import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';

import * as bcrypt from 'bcrypt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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

      throw error;
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

      if (!match) throw new ForbiddenException('User not found');

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
    } catch (error) {
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
}
