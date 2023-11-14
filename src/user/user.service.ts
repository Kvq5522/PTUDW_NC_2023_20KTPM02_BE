import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserDto } from './dto';

import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    private prismaService: PrismaService,
    private firebaseService: FirebaseService,
  ) {}

  async updateUser(userId: number, dto: UserDto, file: Express.Multer.File) {
    try {
      let downloadURL = '';

      const checkUser = await this.prismaService.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          password: true,
          avatar: true,
        },
      });

      if (!(await bcrypt.compare(dto.confirm_password, checkUser.password))) {
        throw new BadRequestException("Password doesn't match");
      }

      if (dto.first_name === '' || dto.last_name === '') {
        throw new BadRequestException('First name or last name is empty');
      }

      if (file) {
        downloadURL = await this.firebaseService.uploadFile(
          file,
          'avatar',
          'image',
        );

        const oldImagePath = decodeURIComponent(
          checkUser.avatar.split('/o/')[1],
        ).split('?')[0];

        if (oldImagePath !== 'images/avatar/user-default-avatar.png') {
          await this.firebaseService.deleteFile(checkUser.avatar);
        }

        if (!downloadURL) {
          return new BadRequestException('Upload image failed');
        }
      }

      const updatedData = {};

      for (const keys in dto) {
        if (keys == 'confirm_password') continue;

        if (keys == 'new_password') {
          updatedData['password'] = await bcrypt.hash(dto[keys], 10);
          continue;
        }

        updatedData[keys] = dto[keys];
      }

      if (downloadURL) {
        updatedData['avatar'] = downloadURL;
      }

      await this.prismaService.user.update({
        where: {
          id: userId,
        },
        data: updatedData,
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Update user successfully',
      };
    } catch (error) {
      return error.response;
    }
  }
}
