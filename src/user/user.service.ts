import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
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
      let updateStudentId = true;

      for (const keys in dto) {
        if (!dto[keys]) continue;

        if (keys === 'student_id') {
          const existedStudentIdInUser =
            await this.prismaService.user.findFirst({
              where: {
                student_id: dto[keys],
              },
            });

          const existedStudentIdInStudentGradeList =
            await this.prismaService.studentGradeList.findFirst({
              where: {
                student_id: dto[keys],
              },
            });

          if (
            (existedStudentIdInUser &&
              existedStudentIdInUser.email !== checkUser.email) ||
            (existedStudentIdInStudentGradeList &&
              existedStudentIdInStudentGradeList.email !== checkUser.email)
          ) {
            updateStudentId = false;
            continue;
          }
        }

        updatedData[keys] = dto[keys];
      }

      if (!dto.student_id) {
        updateStudentId = false;
      }

      if (downloadURL) {
        updatedData['avatar'] = downloadURL;
      }

      //reserve student id
      if (updateStudentId) {
        const checkStudentId =
          await this.prismaService.reservedStudentId.findFirst({
            where: {
              student_id: dto.student_id,
            },
          });

        if (!checkStudentId) {
          const newReservedStudentId =
            this.prismaService.reservedStudentId.create({
              data: {
                student_id: dto.student_id,
              },
            });

          const reserveSucess = await this.prismaService.$transaction([
            newReservedStudentId,
          ]);

          if (!reserveSucess.length) {
            throw new InternalServerErrorException(
              'Create new reserved student id failed',
            );
          }
        }
      }

      const updatedUser = await this.prismaService.user.update({
        where: {
          id: userId,
        },
        data: {
          ...updatedData,
          student_id: updateStudentId ? dto.student_id : checkUser.student_id,
        },
      });

      //delete reserved student id if not used
      if (updateStudentId) {
        const checkStudentGradeIdUsage =
          await this.prismaService.studentGradeList.findFirst({
            where: {
              student_id: checkUser.student_id,
            },
          });

        if (!checkStudentGradeIdUsage) {
          await this.prismaService.reservedStudentId.delete({
            where: {
              student_id: checkUser.student_id,
            },
          });
        }
      }

      delete updatedUser.password;

      const isUpdateStudentId = dto.student_id != '' ? updateStudentId : true;

      return {
        statusCode: HttpStatus.OK,
        message: 'Update user successfully',
        metadata: {
          userProfile: updatedUser,
          isUpdateStudentId: isUpdateStudentId,
        },
      };
    } catch (error) {
      if (!(error instanceof HttpException)) {
        throw new InternalServerErrorException(error);
      }

      throw error;
    }
  }
}
