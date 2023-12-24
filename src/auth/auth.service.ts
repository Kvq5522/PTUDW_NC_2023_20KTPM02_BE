import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';

import * as bcrypt from 'bcrypt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { JwtService } from '@nestjs/jwt';

import { MailingService } from 'src/mailing/mailing.service';
import { MailDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailingService,
  ) {}

  async signUp(dto: AuthDto) {
    try {
      const hash = await bcrypt.hash(dto.password, 10);

      const user = await this.prisma.user.create({
        data: {
          ...dto,
          password: hash,
        },
      });

      delete user.password;

      await this.mailService.sendVerificationMail(
        user,
        await this.signToken(
          user.id,
          user.email,
          user.first_name,
          user.last_name,
        ),
      );

      return {
        statusCode: HttpStatus.CREATED,
        message: 'User created successfully',
        metadata: user,
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return {
            statusCode: HttpStatus.CONFLICT,
            message: 'User already exists',
            metadata: {},
          };
        }
      }

      if (!(error instanceof HttpException)) {
        return new InternalServerErrorException(error);
      }

      return error;
    }
  }

  async signIn(dto: AuthDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email: dto.email,
        },
      });

      if (!user) throw new NotFoundException('User not found');

      if (!user.is_activated)
        throw new ForbiddenException('User is not activated');

      if (user.is_banned) throw new ForbiddenException('User is banned');

      const match = await bcrypt.compare(dto.password, user.password);

      if (!match) throw new ForbiddenException('Password is wrong');

      return {
        statusCode: HttpStatus.OK,
        message: 'User signed in successfully',
        metadata: {
          token: await this.signToken(
            user.id,
            user.email,
            user.first_name,
            user.last_name,
          ),
        },
      };
    } catch (error: any) {
      if (!(error instanceof HttpException)) {
        throw new InternalServerErrorException(error);
      }
      throw error;
    }
  }

  async findOrCreateOauthUser(req: any) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email: req.user.email,
        },
      });

      if (!user) {
        const createdUser = await this.prisma.user.create({
          data: {
            email: req.user.email,
            first_name: req.user.firstName,
            last_name: req.user.lastName,
            avatar: req.user.avatar,
            is_activated: true,
            password: '',
          },
        });

        return await this.signToken(
          createdUser.id,
          createdUser.email,
          createdUser.first_name,
          createdUser.last_name,
        );
      }

      return await this.signToken(
        user.id,
        user.email,
        user.first_name,
        user.last_name,
      );
    } catch (error) {
      if (!(error instanceof HttpException)) {
        throw new InternalServerErrorException(error);
      }
      throw error;
    }
  }

  async activateAccount(email: string, token: string) {
    try {
      const decode = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      if (decode.email !== email)
        throw new ForbiddenException('Token is invalid');

      const user = await this.prisma.user.update({
        where: {
          email: email,
        },
        data: {
          is_activated: true,
        },
      });

      if (!user) throw new NotFoundException('User not found');

      return await this.signToken(
        user.id,
        user.email,
        user.first_name,
        user.last_name,
      );
    } catch (error) {
      if (!(error instanceof HttpException)) {
        throw new InternalServerErrorException(error);
      }
      throw error;
    }
  }

  async sendRecoveryMail(email: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          email: email,
        },
        orderBy: {
          created_at: 'desc',
        },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
        },
      });

      if (!user) throw new NotFoundException('User not found');

      const tokenString = this.generateRandomString(8);

      const createdRecoveryToken = await this.prisma.recoveryToken.create({
        data: {
          token: tokenString,
          user_id: user.id,
          expires_at: new Date(Date.now() + 1000 * 60 * 15), // 15 minutes
        },
      });

      if (!createdRecoveryToken) throw new InternalServerErrorException();

      await this.mailService.sendRecoveryMail(user, tokenString);

      return {
        statusCode: HttpStatus.OK,
        message: 'Recovery mail sent successfully',
        metadata: {},
      };
    } catch (error) {
      if (!(error instanceof HttpException)) {
        throw new InternalServerErrorException(error);
      }
      throw error;
    }
  }

  async recoverPassword(dto: MailDto) {
    try {
      const recoveryToken = await this.prisma.recoveryToken.findFirst({
        where: {
          token: dto.token,
        },
      });

      if (!recoveryToken) throw new NotFoundException('Token not found');

      if (recoveryToken.expires_at < new Date(Date.now()))
        throw new ForbiddenException('Token expired');

      const user = await this.prisma.user.findUnique({
        where: {
          id: recoveryToken.user_id,
        },
      });

      if (!user) throw new NotFoundException('User not found');

      if (dto.password !== dto.confirm_password)
        throw new ForbiddenException('Passwords do not match');

      const hash = await bcrypt.hash(dto.password, 10);

      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          password: hash,
          is_activated: true,
        },
      });

      await this.prisma.recoveryToken.delete({
        where: {
          id: recoveryToken.id,
        },
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Password recovered successfully',
        metadata: {},
      };
    } catch (error) {
      if (!(error instanceof HttpException)) {
        throw new InternalServerErrorException(error);
      }

      throw error;
    }
  }

  async verifyToken(token: string) {
    try {
      const decode = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      if (
        !decode.userId ||
        !decode.email ||
        !decode.first_name ||
        !decode.last_name
      )
        throw new ForbiddenException('Token is invalid');

      const user = await this.prisma.user.findUnique({
        where: {
          id: decode.userId,
        },
      });

      if (!user) throw new ForbiddenException('User not found');

      if (decode.email !== user.email)
        throw new ForbiddenException('Token is invalid');

      //check expiration
      const expiration = new Date(decode.exp * 1000);

      if (expiration < new Date(Date.now()))
        throw new ForbiddenException('Token expired');

      return {
        statusCode: HttpStatus.OK,
        message: 'Token is valid',
        metadata: {},
      };
    } catch (error) {
      if (!(error instanceof HttpException)) {
        throw new InternalServerErrorException(error);
      }
      throw error;
    }
  }

  signToken(
    userId: number,
    email: string,
    first_name: string,
    last_name: string,
  ): Promise<string> {
    const payload = { userId, email, first_name, last_name };
    return this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '1d',
    });
  }

  generateRandomString(length: number) {
    let result = '';
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
  }
}
