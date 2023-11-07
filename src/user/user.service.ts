import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}

  async getInfo(email: string) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: {
          email: email,
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
        statusCode: HttpStatus.OK,
        message: 'User info',
        metadata: user,
      };
    } catch (error) {
      return error;
    }
  }
}
