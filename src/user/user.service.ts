import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserDto } from './dto';

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

      if (!checkUser) {
        throw new BadRequestException('User not found');
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

        if (
          oldImagePath !== 'images/avatar/user-default-avatar.png' ||
          !oldImagePath.includes('firebasestorage.googleapis.com')
        ) {
          await this.firebaseService.deleteFile(checkUser.avatar);
        }

        if (!downloadURL) {
          return new BadRequestException('Upload image failed');
        }
      }

      const updatedData = {};

      for (const keys in dto) {
        if (!dto[keys]) continue;

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
