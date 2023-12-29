import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ExcelService } from 'src/excel/excel.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdminInfoDto, ClassroomInfoDto, UserInfoDto } from './dto';

@Injectable()
export class AdminService {
  constructor(
    private prismaService: PrismaService,
    private excelService: ExcelService,
  ) {}

  async getUserList() {
    try {
      const users = await this.prismaService.user.findMany({
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          authorization: true,
          student_id: true,
          is_banned: true,
        },
      });

      return {
        statusCode: 200,
        message: 'Get user list successfully',
        metadata: users,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateUserInfo(dto: UserInfoDto) {
    try {
      const { users } = dto;

      const usersToUpdate = await this.prismaService.user.findMany({
        where: {
          id: {
            in: users.map((user) => user.id),
          },
        },
      });

      const existedStudentIds = await this.prismaService.user.findMany({
        where: {
          student_id: {
            in: users.map((user) => user.student_id),
          },
        },
      });

      const existedStudentGradeList =
        await this.prismaService.studentGradeList.findMany({
          where: {
            student_id: {
              in: users.map((user) => user.student_id),
            },
          },
        });

      const updatedList = [];
      const failedList = [];
      const newReservedStudentIdList = [];
      const deletedReservedStudentIdList = [];
      for (const user of users) {
        if (!usersToUpdate.find((u) => u.id === user.id)) {
          failedList.push({
            email: user.email,
            reason: 'User not found',
          });
          continue;
        }

        const checkExistedStudentId = existedStudentIds.find(
          (u) => u.student_id === user.student_id,
        );

        const checkExistedInGradeList = existedStudentGradeList.find(
          (u) => u.student_id === user.student_id && u.email === user.email,
        );

        //Check if student id existed but not mapped by teacher
        if (
          checkExistedStudentId &&
          !checkExistedInGradeList &&
          user.student_id !==
            usersToUpdate.find((u) => u.id === user.id).student_id
        ) {
          failedList.push({
            email: user.email,
            reason: 'Student ID existed',
          });

          continue;
        }

        //Check if student id is mapped by teacher
        // if yes, delete old reserved student id and create new one
        if (
          !checkExistedInGradeList &&
          user.student_id !== undefined &&
          user.student_id !== '' &&
          user.student_id !==
            usersToUpdate.find((u) => u.id === user.id).student_id
        ) {
          const newReservedStudentId =
            this.prismaService.reservedStudentId.create({
              data: {
                student_id: user.student_id,
              },
            });

          newReservedStudentIdList.push(newReservedStudentId);

          const oldReservedStudentId = usersToUpdate.find(
            (u) => u.id === user.id,
          ).student_id;

          if (oldReservedStudentId) {
            const deletedReservedStudentId =
              this.prismaService.reservedStudentId.delete({
                where: {
                  student_id: oldReservedStudentId,
                },
              });

            deletedReservedStudentIdList.push(deletedReservedStudentId);
          }
        }

        const objKeys = ['student_id', 'is_banned', 'authorization'];
        let dataToUpdate = {};
        for (const key of objKeys) {
          if (key === 'student_id' && user[key] === '') continue;

          if (
            key === 'student_id' &&
            user[key] === usersToUpdate.find((u) => u.id === user.id).student_id
          ) {
            continue;
          }

          if (user[key]) {
            dataToUpdate = {
              ...dataToUpdate,
              [key]: user[key],
            };
          }
        }

        const updatedUser = this.prismaService.user.update({
          where: {
            id: user.id,
          },
          data: dataToUpdate,
          select: {
            id: true,
            email: true,
            student_id: true,
            is_banned: true,
            first_name: true,
            last_name: true,
            authorization: true,
          },
        });

        updatedList.push(updatedUser);
      }
      await this.prismaService.$transaction(newReservedStudentIdList);
      const updatedSuccess = await this.prismaService.$transaction(updatedList);
      await this.prismaService.$transaction(deletedReservedStudentIdList);

      return {
        statusCode: 200,
        message: 'Edit user info successfully',
        metadata: {
          success: updatedSuccess,
          failed: failedList,
        },
      };
    } catch (error) {
      console.log(error);
      if (!(error instanceof HttpException)) {
        throw new InternalServerErrorException(error);
      }

      throw error;
    }
  }

  async downloadUserList() {
    try {
      const students = await this.prismaService.user.findMany({});

      const data = students.map((student) => {
        return {
          Email: student.email,
          'First Name': student.first_name,
          'Last Name': student.last_name,
          'Student ID': student.student_id,
        };
      });

      const excelFile = await this.excelService.writeExcelFile(
        data,
        'User List',
        ['Email', 'First Name', 'Last Name', 'Student ID'],
      );

      return excelFile;
    } catch (error) {
      return null;
    }
  }

  async uploadUserList(excel: Express.Multer.File) {
    try {
      const parseData = this.excelService.parseExcelSheet(
        excel.buffer,
        'User List',
        ['Email', 'First Name', 'Last Name', 'Student ID'],
      );

      if (!parseData) throw new BadRequestException('Invalid excel file');

      const emailSet = new Set<string>();
      const studentIdSet = new Set<string>();

      //Check if student id is mapped by teacher
      // if yes, delete old reserved student id and create new one
      for (const user of parseData) {
        if (emailSet.has(user['Email']))
          throw new BadRequestException('Duplicate email');

        if (studentIdSet.has(user['Student ID']) && user['Student ID']) {
          throw new BadRequestException('Duplicate student ID');
        }

        emailSet.add(user['Email']);
        studentIdSet.add(user['Student ID']);
      }

      //Check if email existed
      const users = await this.prismaService.user.findMany({
        where: {
          email: {
            in: [...emailSet],
          },
        },
      });

      const uploadedStudentIds = parseData
        .map((student) => {
          if (student['Student ID']) return student['Student ID'];
        })
        .filter((studentId) => studentId !== undefined);

      const existedStudentIds = await this.prismaService.user.findMany({
        where: {
          student_id: {
            in: uploadedStudentIds,
          },
        },
      });

      const existedStudentGradeList =
        await this.prismaService.studentGradeList.findMany({
          where: {
            student_id: {
              in: uploadedStudentIds,
            },
          },
        });

      const updatedList = [];
      const failedList = [];
      const deletedReservedStudentIdList = [];
      const newReservedStudentIdList = [];

      for (const user of parseData) {
        //Check if student id is truthy
        if (user['Student ID'] && !user['Student ID'].trim()) {
          failedList.push({
            email: user['Email'],
            reason: 'Student ID must not be empty',
          });
          continue;
        }

        //Check if email existed
        if (!users.find((u) => u.email === user['Email'])) {
          failedList.push({
            email: user['Email'],
            reason: 'User not found',
          });
          continue;
        }

        //Check if student id is less than 10 characters
        if (user['Student ID'] && user['Student ID'].length > 10) {
          failedList.push({
            email: user['Email'],
            reason: 'Student ID must be less than 10 characters',
          });
          continue;
        }

        const checkExistedStudentId = existedStudentIds.find(
          (u) => u.student_id === user['Student ID'],
        );

        const checkExistedInGradeList = existedStudentGradeList.find(
          (u) =>
            u.student_id === user['Student ID'] && u.email === user['Email'],
        );

        //Check if student id existed but not mapped by teacher
        if (checkExistedStudentId && !checkExistedInGradeList) {
          failedList.push({
            email: user['Email'],
            reason: 'Student ID existed',
          });

          continue;
        }

        //Check if student id is mapped by teacher
        // if yes, delete old reserved student id and create new one
        if (!checkExistedInGradeList && user['Student ID']) {
          const newReservedStudentId =
            this.prismaService.reservedStudentId.create({
              data: {
                student_id: user['Student ID'],
              },
            });

          newReservedStudentIdList.push(newReservedStudentId);

          const oldReservedStudentId = users.find(
            (u) => u.email === user['Email'],
          ).student_id;

          if (oldReservedStudentId) {
            const deletedReservedStudentId =
              this.prismaService.reservedStudentId.delete({
                where: {
                  student_id: oldReservedStudentId,
                },
              });

            deletedReservedStudentIdList.push(deletedReservedStudentId);
          }
        }

        //Check if student id is blank
        // if yes, delete old reserved student id
        if (user['Student ID'] === undefined) {
          const oldReservedStudentId = users.find(
            (u) => u.email === user['Email'],
          ).student_id;

          if (oldReservedStudentId && !checkExistedInGradeList) {
            const deletedReservedStudentId =
              this.prismaService.reservedStudentId.delete({
                where: {
                  student_id: oldReservedStudentId,
                },
              });

            deletedReservedStudentIdList.push(deletedReservedStudentId);
          }
        }

        const updatedUser = this.prismaService.user.update({
          where: {
            email: user['Email'],
          },
          data: {
            student_id: user['Student ID'],
          },
          select: {
            id: true,
            email: true,
            student_id: true,
            is_banned: true,
            first_name: true,
            last_name: true,
            authorization: true,
          },
        });

        updatedList.push(updatedUser);
      }

      await this.prismaService.$transaction(newReservedStudentIdList);
      const updatedSuccess = await this.prismaService.$transaction(updatedList);
      await this.prismaService.$transaction(deletedReservedStudentIdList);

      return {
        statusCode: 200,
        message: 'Upload user list successfully',
        metadata: {
          success: updatedSuccess,
          failed: failedList,
        },
      };
    } catch (error) {
      console.log(error);
      if (!(error instanceof HttpException)) {
        throw new InternalServerErrorException(error);
      }

      throw error;
    }
  }

  async getClassroomList() {
    try {
      const classrooms = await this.prismaService.classroom.findMany({
        select: {
          id: true,
          name: true,
          owner_fk: {
            select: {
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          is_archived: true,
        },
      });

      return {
        statusCode: 200,
        message: 'Get classroom list successfully',
        metadata: classrooms,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateClassroomInfo(dto: ClassroomInfoDto) {
    try {
      const { classrooms } = dto;

      const updatedList = [];
      for (const classroom of classrooms) {
        const updatedClassroom = this.prismaService.classroom.update({
          where: {
            id: classroom.id,
          },
          data: {
            is_archived: classroom.is_archived,
          },
        });

        updatedList.push(updatedClassroom);
      }

      const updatedSuccess = await this.prismaService.$transaction(updatedList);

      return {
        statusCode: 200,
        message: 'Edit classroom info successfully',
        metadata: updatedSuccess,
      };
    } catch (error) {
      if (!(error instanceof HttpException)) {
        throw new InternalServerErrorException(error);
      }

      throw error;
    }
  }

  async addAdmin(dto: AdminInfoDto) {
    try {
      const { admins } = dto;

      const userIds = admins.map((admin) => admin.id);

      const users = await this.prismaService.user.findMany({
        where: {
          id: {
            in: userIds,
          },
        },
      });

      const failedList = [];
      const updatedList = [];

      for (const admin of admins) {
        const user = users.find((u) => u.id === admin.id);

        if (!user) {
          failedList.push({
            id: admin.email,
            reason: 'User not found',
          });

          continue;
        }

        const updatedUser = this.prismaService.user.update({
          where: {
            id: admin.id,
          },
          data: {
            authorization: 4,
          },
          select: {
            id: true,
            email: true,
            authorization: true,
          },
        });

        updatedList.push(updatedUser);
      }

      const updatedSuccess = await this.prismaService.$transaction(updatedList);

      return {
        statusCode: 200,
        message: 'Add admin successfully',
        metadata: {
          success: updatedSuccess,
          failed: failedList,
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
