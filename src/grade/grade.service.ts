import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GradeCompositionDto } from './dto';

import { ExcelService } from 'src/excel/excel.service';

@Injectable()
export class GradeService {
  constructor(
    private prismaService: PrismaService,
    private excelService: ExcelService,
  ) {}

  async getGradeComposition(classroom_id: number) {
    try {
      const compositions = await this.prismaService.gradeComposition.findMany({
        where: {
          classroom_id,
        },
      });

      return {
        statusCode: 200,
        message: 'OK',
        metadata: compositions,
      };
    } catch (error) {
      if (!(error instanceof HttpException)) {
        throw new InternalServerErrorException(
          error.message || 'Internal Server Error',
        );
      }

      throw error;
    }
  }

  async editGradeCompostition(dto: GradeCompositionDto) {
    try {
      const { classroom_id, grade_compositions } = dto;

      //check if grade_compositions name is not duplicated
      const nameSet = new Set<string>();
      const indexSet = new Set<number>();

      for (const comp of grade_compositions) {
        if (nameSet.has(comp.name) || indexSet.has(comp.index)) {
          return new BadRequestException(
            `Grade composition name ${comp.name} is duplicated`,
          );
        }
        nameSet.add(comp.name);
        indexSet.add(comp.index);
      }

      //check if grade_percent total is 100
      let total = 0;
      for (const comp of grade_compositions) {
        total += comp.grade_percent;
      }

      if (total !== 100) {
        return new BadRequestException(
          `Grade composition total is ${total} instead of 100`,
        );
      }

      const currentCompostions =
        await this.prismaService.gradeComposition.findMany({
          where: {
            classroom_id,
          },
        });

      const updatedList = [];
      const addedList = [];
      const deletedList = [];

      for (const comp of currentCompostions) {
        const found = grade_compositions.find((x) => x.name === comp.name);

        if (!found) {
          deletedList.push(comp);
        }
      }

      for (const comp of grade_compositions) {
        const found = currentCompostions.find(
          (x) => x.name === comp.name && x.index === comp.index,
        );

        if (!found) {
          addedList.push({
            ...comp,
            classroom_id: classroom_id,
          });
        } else {
          updatedList.push({
            ...found,
            ...comp,
          });
        }
      }

      const deletedIds = deletedList.map((x) => x.id);
      if (deletedIds.length > 0) {
        await this.prismaService.gradeComposition.deleteMany({
          where: {
            id: {
              in: deletedIds,
            },
          },
        });
      }

      let updatedSuccess = [];
      for (const comp of updatedList) {
        const updatedComp = this.prismaService.gradeComposition.update({
          where: {
            id: comp.id,
          },
          data: {
            name: comp.name,
            grade_percent: comp.grade_percent,
            is_finalized: comp.is_finalized,
            index: comp.index,
          },
        });

        updatedSuccess.push(updatedComp);
      }
      updatedSuccess = await this.prismaService.$transaction(updatedSuccess);

      const addedSuccess = await this.prismaService.gradeComposition.createMany(
        {
          data: addedList,
        },
      );

      return {
        statusCode: 200,
        message: 'OK',
        metadata: updatedSuccess.concat(addedSuccess),
      };
    } catch (error) {
      if (!(error instanceof HttpException)) {
        throw new InternalServerErrorException(error);
      }

      throw error;
    }
  }

  async uploadStudentGradeList(
    classroom_id: number,
    excel: Express.Multer.File,
  ) {
    try {
      const parseData = this.excelService.parseExcelSheet(
        excel.buffer,
        'Student List',
        ['Student Name', 'Student ID', 'Email'],
      );

      if (!parseData) throw new BadRequestException('Invalid excel file');

      const nameSet = new Set<string>();
      const idSet = new Set<string>();
      const emailSet = new Set<string>();

      //check if student name, student id, email is duplicated
      for (const student of parseData) {
        if (
          nameSet.has(student['Student Name']) ||
          idSet.has(student['Student ID']) ||
          emailSet.has(student['Email'])
        ) {
          throw new BadRequestException(
            `Student name ${student['Student Name']} or student id ${student['Student ID']} or email ${student['Email']} is duplicated`,
          );
        }

        nameSet.add(student['Student Name']);
        idSet.add(student['Student ID']);
        emailSet.add(student['Email']);
      }

      const students = await this.prismaService.studentGradeList.findMany({
        where: {
          classroom_id,
        },
      });

      const updatedList = [];
      const addedList = [];
      const deletedList = [];

      //check if student_id is deleted
      for (const student of students) {
        const found = parseData.find(
          (x) => x['Student ID'] === student.student_id,
        );

        if (!found) {
          deletedList.push(student);
        }
      }

      //check if student_id is updated or newly added
      for (const student of parseData) {
        const found = students.find(
          (x) => x.student_id === student['Student ID'],
        );

        if (!found) {
          addedList.push({
            name: student['Student Name'],
            student_id: student['Student ID'],
            email: student['Email'],
            classroom_id: classroom_id,
          });
        } else {
          updatedList.push({
            ...found,
            name: student['Student Name'],
            student_id: student['Student ID'],
            email: student['Email'],
          });
        }
      }

      //delete student
      const deletedStudentIds = deletedList.map((x) => x.student_id);
      if (deletedStudentIds.length > 0) {
        await this.prismaService.reservedStudentId.deleteMany({
          where: {
            student_id: {
              in: deletedStudentIds,
            },
          },
        });
      }

      //update student
      let updatedSuccess = [];
      for (const student of updatedList) {
        const updatedStudent = this.prismaService.studentGradeList.update({
          where: {
            id: student.id,
          },
          data: {
            name: student.name,
            student_id: student.student_id,
            email: student.email,
          },
        });

        updatedSuccess.push(updatedStudent);
      }
      updatedSuccess = await this.prismaService.$transaction(updatedSuccess);

      //add student
      const studentIds = students.map((x) => x.student_id);
      const existedStudentIds =
        await this.prismaService.reservedStudentId.findMany({
          where: {
            student_id: {
              in: studentIds,
            },
          },
        });

      let addedSuccess = [];
      let reservedSuccess = [];
      const addedFailed = [];
      for (const student of addedList) {
        if (existedStudentIds.includes(student.student_id)) {
          addedFailed.push(student);
          continue;
        }

        const reserved = this.prismaService.reservedStudentId.create({
          data: {
            student_id: student.student_id,
          },
        });

        reservedSuccess.push(reserved);

        const addedStudent = this.prismaService.studentGradeList.create({
          data: {
            name: student.name,
            student_id: student.student_id,
            email: student.email,
            classroom_id: classroom_id,
          },
        });

        addedSuccess.push(addedStudent);
      }
      reservedSuccess = await this.prismaService.$transaction(reservedSuccess);
      addedSuccess = await this.prismaService.$transaction(addedSuccess);

      return {
        statusCode: 200,
        message: 'Upload student grade list successfully',
        metadata: {
          success: updatedSuccess.concat(addedSuccess),
          failed: addedFailed,
        },
      };
    } catch (error) {
      if (!(error instanceof HttpException)) {
        throw new InternalServerErrorException(
          error.message || 'Internal Server Error',
        );
      }

      throw error;
    }
  }

  async downloadStudentGradeList(classroom_id: number) {
    try {
      const students = await this.prismaService.studentGradeList.findMany({
        where: {
          classroom_id,
        },
      });

      const data = students.map((x) => {
        return {
          'Student Name': x.name,
          'Student ID': x.student_id,
          Email: x.email,
        };
      });

      const excelFile = await this.excelService.writeExcelFile(
        data,
        'Student List',
        ['Student Name', 'Student ID', 'Email'],
      );

      return excelFile;
    } catch (error) {
      if (!(error instanceof HttpException)) {
        throw new InternalServerErrorException(
          error.message || 'Internal Server Error',
        );
      }
    }
  }

  async getStudentGradeList(classroom_id: number) {
    try {
      const students = await this.prismaService.studentGradeList.findMany({
        where: {
          classroom_id,
        },
      });

      return {
        statusCode: 200,
        message: 'OK',
        metadata: students,
      };
    } catch (error) {
      if (!(error instanceof HttpException)) {
        throw new InternalServerErrorException(
          error.message || 'Internal Server Error',
        );
      }

      throw error;
    }
  }

  async isTeacherAuthorization(classroom_id: number, user_id: number) {
    try {
      const existedTeacher = await this.prismaService.classroomMember.findFirst(
        {
          where: {
            classroom_id: classroom_id,
            member_id: user_id,
          },
        },
      );

      if (!existedTeacher || existedTeacher.member_role < 2)
        throw new Error('Not authorized');

      return true;
    } catch (error) {
      return false;
    }
  }
}
