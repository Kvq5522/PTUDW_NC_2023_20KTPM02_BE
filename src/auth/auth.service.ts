import {
  ForbiddenException,
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
import { MailDto } from './dto/mail.dto';

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
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          created_at: true,
          updated_at: true,
        },
      });

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

      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Something went wrong, please try again',
        metadata: {},
      };
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
      if (error instanceof NotFoundException) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: error.message,
          metadata: {},
        };
      }

      if (error instanceof ForbiddenException) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message: error.message,
          metadata: {},
        };
      }
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
      if (error instanceof NotFoundException) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: error.message,
          metadata: {},
        };
      }

      if (error instanceof InternalServerErrorException) {
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Something went wrong, please try again',
          metadata: {},
        };
      }

      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message,
        metadata: {},
      };
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
      if (error instanceof NotFoundException) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: error.message,
          metadata: {},
        };
      }

      if (error instanceof ForbiddenException) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message: error.message,
          metadata: {},
        };
      }
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
