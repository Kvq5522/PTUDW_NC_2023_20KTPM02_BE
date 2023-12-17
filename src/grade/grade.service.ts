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

      const nameSet = new Map<string, string>(); // same name, but different student id
      const idSet = new Set<string>();
      const emailSet = new Set<string>();

      //check if student name, student id, email is duplicated
      for (const student of parseData) {
        if (
          (nameSet.has(student['Student Name']) &&
            nameSet.get(student['Student Name']) === student['Student ID']) ||
          idSet.has(student['Student ID']) ||
          emailSet.has(student['Email'])
        ) {
          throw new BadRequestException(
            `Student name ${student['Student Name']} or student id ${student['Student ID']} or email ${student['Email']} is duplicated`,
          );
        }

        nameSet.set(student['Student Name'], student['Student ID']);
        idSet.add(student['Student ID']);
        emailSet.add(student['Email']);
      }

      const students = await this.prismaService.studentGradeList.findMany({
        where: {
          classroom_id,
        },
      });

      const existedStudentIds = (
        await this.prismaService.reservedStudentId.findMany({
          select: {
            student_id: true,
          },
        })
      ).map((x) => x.student_id);

      const updatedList = [];
      const addedList = [];
      const deletedList = [];
      const failList = [];

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

        if (!student['Student Name'] || !student['Student ID']) {
          failList.push(student);
          continue;
        }

        if (!found || !existedStudentIds.includes(student['Student ID'])) {
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
          failed: addedFailed.concat(failList),
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

  async uploadStudentGradeByComposition(
    classroom_id: number,
    composition_id: number,
    excel: Express.Multer.File,
  ) {
    try {
      if (
        !(await this.prismaService.gradeComposition.findFirst({
          where: {
            id: composition_id,
            classroom_id: classroom_id,
          },
        }))
      )
        throw new BadRequestException('Invalid composition id');

      const parseData = this.excelService.parseExcelSheet(
        excel.buffer,
        'Grade List',
        ['Student Name', 'Student ID', 'Email', 'Student Grade'],
      );

      if (!parseData) throw new BadRequestException('Invalid excel file');

      const nameSet = new Map<string, string>(); // same name, but different student id

      //check if student name, student id is duplicated
      for (const student of parseData) {
        if (
          nameSet.has(student['Student Name']) &&
          nameSet.get(student['Student Name']) === student['Student ID']
        ) {
          throw new BadRequestException(
            `Student name ${student['Student Name']} or student id ${student['Student ID']} is duplicated`,
          );
        }

        nameSet.set(student['Student Name'], student['Student ID']);
      }

      const studentGrades =
        await this.prismaService.studentGradeDetail.findMany({
          where: {
            classroom_id,
            grade_category: composition_id,
          },
        });

      const existedStudentIds = (
        await this.prismaService.studentGradeList.findMany({
          where: {
            classroom_id: classroom_id,
          },
          select: {
            student_id: true,
          },
        })
      ).map((x) => x.student_id);

      const updatedList = [];
      const addedList = [];
      const deletedList = [];
      const failList = [];

      //check if grade is deleted
      for (const student of studentGrades) {
        const found = parseData.find(
          (x) => x['Student ID'] === student.student_id,
        );

        if (!found) {
          deletedList.push(student);
        }
      }

      //check if grade is updated or newly added
      for (const student of parseData) {
        const found = studentGrades.find(
          (x) => x.student_id === student['Student ID'],
        );

        const parseGrade = parseFloat(student['Student Grade']);
        if (
          isNaN(parseGrade) ||
          parseGrade < 0 ||
          parseGrade > 10 ||
          !student['Student Name'] ||
          !student['Student ID']
        ) {
          failList.push(student);
          continue;
        }

        if (!found || !existedStudentIds.includes(student['Student ID'])) {
          addedList.push({
            name: student['Student Name'],
            student_id: student['Student ID'],
            classroom_id: classroom_id,
            email: student['Email'],
            grade: student['Student Grade'],
          });
        } else {
          updatedList.push({
            ...found,
            grade: student['Student Grade'],
          });
        }
      }

      //delete grade
      const deletedStudentIds = deletedList.map((x) => x.student_id);
      if (deletedStudentIds.length > 0) {
        await this.prismaService.studentGradeDetail.deleteMany({
          where: {
            student_id: {
              in: deletedStudentIds,
            },
            grade_category: composition_id,
          },
        });
      }

      //update grade
      let updatedSuccess = [];
      for (const student of updatedList) {
        const updatedStudent = this.prismaService.studentGradeDetail.upsert({
          where: {
            student_id_classroom_id_grade_category: {
              student_id: student.student_id,
              classroom_id: classroom_id,
              grade_category: composition_id,
            },
          },
          create: {
            student_id: student.student_id,
            classroom_id: classroom_id,
            grade_category: composition_id,
            grade: parseFloat(student.grade),
          },
          update: {
            grade: parseFloat(student.grade),
          },
        });

        updatedSuccess.push(updatedStudent);
      }
      updatedSuccess = await this.prismaService.$transaction(updatedSuccess);

      //check if student_id is updated or newly added
      //if not in grade list, add to grade list
      let addedGradeSuccess = [];
      let addedStudentSuccess = [];
      let reservedSuccess = [];
      const addedFailed = [];

      for (const student of addedList) {
        if (!existedStudentIds.includes(student.student_id)) {
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
              classroom_id: classroom_id,
              email: student.email,
            },
          });

          addedStudentSuccess.push(addedStudent);
        }

        const addedGrade = this.prismaService.studentGradeDetail.create({
          data: {
            student_id: student.student_id,
            classroom_id: classroom_id,
            grade_category: composition_id,
            grade: parseFloat(student.grade),
          },
        });

        addedGradeSuccess.push(addedGrade);
      }
      reservedSuccess = await this.prismaService.$transaction(reservedSuccess);
      addedStudentSuccess =
        await this.prismaService.$transaction(addedStudentSuccess);
      addedGradeSuccess =
        await this.prismaService.$transaction(addedGradeSuccess);

      return {
        statusCode: 200,
        message: 'Upload student grade list successfully',
        metadata: {
          success: updatedSuccess.concat(addedGradeSuccess),
          failed: addedFailed.concat(failList),
        },
      };
    } catch (error) {
      console.log(error);
      if (!(error instanceof HttpException)) {
        throw new InternalServerErrorException(
          error.message || 'Internal Server Error',
        );
      }

      throw error;
    }
  }

  async downloadStudentGradeByComposition(
    classroom_id: number,
    composition_id: number,
  ) {
    try {
      const studentGradeList =
        await this.prismaService.studentGradeList.findMany({
          where: {
            classroom_id: classroom_id,
          },
        });

      const studentGradeDetails =
        await this.prismaService.studentGradeDetail.findMany({
          where: {
            classroom_id,
            grade_category: composition_id,
          },
          select: {
            student_id_fk: {
              select: {
                name: true,
                student_id: true,
                email: true,
              },
            },
            grade: true,
          },
        });

      //if student grade is not in grade list, add to grade list with grade = 0
      const addedList = [];
      for (const student of studentGradeList) {
        const found = studentGradeDetails.find(
          (x) => x.student_id_fk.student_id === student.student_id,
        );

        if (!found) {
          addedList.push({
            student_id_fk: {
              name: student.name,
              student_id: student.student_id,
              email: student.email,
            },
            grade: 0,
          });
        }
      }

      const data = studentGradeDetails.concat(addedList).map((x) => {
        return {
          'Student Name': x.student_id_fk.name,
          'Student ID': x.student_id_fk.student_id,
          Email: x.student_id_fk.email,
          'Student Grade': x.grade,
        };
      });

      const excelFile = await this.excelService.writeExcelFile(
        data,
        'Grade List',
        ['Student Name', 'Student ID', 'Email', 'Student Grade'],
      );

      return excelFile;
    } catch (error) {
      if (!(error instanceof HttpException)) {
        throw new InternalServerErrorException(
          error.message || 'Internal Server Error',
        );
      }

      throw error;
    }
  }

  async getStudentGradesByComposition(
    classroom_id: number,
    composition_id: number,
  ) {
    try {
      const grades = await this.prismaService.studentGradeDetail.findMany({
        where: {
          classroom_id: classroom_id,
          grade_category: composition_id,
        },
        select: {
          classroom_id: true,
          grade: true,
          grade_category: true,
          student_id: true,
        },
      });
      const gradeStudentIds = grades.map((x) => x.student_id);

      const students = await this.prismaService.studentGradeList.findMany({
        where: {
          classroom_id: classroom_id,
          student_id: {
            not: { in: gradeStudentIds },
          },
        },
      });

      for (const student of students) {
        grades.push({
          classroom_id: classroom_id,
          grade: 0,
          grade_category: composition_id,
          student_id: student.student_id,
        });
      }

      return {
        statusCode: 200,
        message: 'Get student grades by composition successfully',
        metadata: {
          grades: grades,
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

  async uploadStudentGradeBoard(
    classroom_id: number,
    excel: Express.Multer.File,
  ) {
    try {
      const getGradeComposition =
        await this.prismaService.gradeComposition.findMany({
          where: {
            classroom_id: classroom_id,
          },
          select: {
            id: true,
            name: true,
          },
        });
      const gradeCompositionNames = getGradeComposition.map((x) => x.name);

      const parseData = this.excelService.parseExcelSheet(
        excel.buffer,
        'Grade Board',
        [
          'Student Name',
          'Student ID',
          'Email',
          ...gradeCompositionNames.map((x) => `Grade: ${x}`),
        ],
      );

      if (!parseData) throw new BadRequestException('Invalid excel file');

      const nameSet = new Map<string, string>(); // same name, but different student id
      const idSet = new Set<string>();
      const emailSet = new Set<string>();

      //check if student name, student id, email is duplicated
      for (const student of parseData) {
        if (
          (nameSet.has(student['Student Name']) &&
            nameSet.get(student['Student Name']) === student['Student ID']) ||
          idSet.has(student['Student ID']) ||
          emailSet.has(student['Email'])
        ) {
          throw new BadRequestException(
            `Student name ${student['Student Name']} or student id ${student['Student ID']} or email ${student['Email']} is duplicated`,
          );
        }

        nameSet.set(student['Student Name'], student['Student ID']);
        idSet.add(student['Student ID']);
        emailSet.add(student['Email']);
      }

      const studentsGrade =
        await this.prismaService.studentGradeDetail.findMany({
          where: {
            classroom_id: classroom_id,
          },
        });

      const existedStudentIds = (
        await this.prismaService.reservedStudentId.findMany({
          select: {
            student_id: true,
          },
        })
      ).map((x) => x.student_id);

      const updatedList = [];
      const addedList = [];
      const deletedList = [];
      const failList = [];

      //check if student_id is deleted
      for (const student of studentsGrade) {
        const found = parseData.find(
          (x) => x['Student ID'] === student.student_id,
        );

        if (!found) {
          deletedList.push(student);
        }
      }

      //check if student_id is updated or newly added
      for (const student of parseData) {
        const found = studentsGrade.find(
          (x) => x.student_id === student['Student ID'],
        );

        if (!student['Student Name'] || !student['Student ID']) {
          failList.push(student);
          continue;
        }

        if (!found || !existedStudentIds.includes(student['Student ID'])) {
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

      //delete student grades
      const deletedStudentIds = deletedList.map((x) => x.student_id);
      if (deletedStudentIds.length > 0) {
        await this.prismaService.studentGradeDetail.deleteMany({
          where: {
            student_id: {
              in: deletedStudentIds,
            },
            classroom_id: classroom_id,
          },
        });
      }

      //update student all composition grades
      let updatedSuccess = [];
      for (const student of updatedList) {
        if (!student['Student Name'] || !student['Student ID']) {
          continue;
        }

        for (const comp of gradeCompositionNames) {
          const found = parseData.find(
            (x) =>
              x[`Grade: ${comp}`] &&
              x['Student ID'] === student.student_id &&
              x['Student Name'] === student.name,
          );

          if (!found) continue;

          const parseGrade = parseFloat(found[`Grade: ${comp}`]);
          if (isNaN(parseGrade) || parseGrade < 0 || parseGrade > 10) {
            failList.push(found);
            continue;
          }

          const updatedStudent = this.prismaService.studentGradeDetail.upsert({
            where: {
              student_id_classroom_id_grade_category: {
                student_id: student.student_id,
                classroom_id: classroom_id,
                grade_category: getGradeComposition.find((x) => x.name === comp)
                  .id,
              },
            },
            create: {
              student_id: student.student_id,
              classroom_id: classroom_id,
              grade_category: getGradeComposition.find((x) => x.name === comp)
                .id,
              grade: parseFloat(found[`Grade: ${comp}`]),
            },
            update: {
              grade: parseFloat(found[`Grade: ${comp}`]),
            },
          });

          updatedSuccess.push(updatedStudent);
        }
      }
      updatedSuccess = await this.prismaService.$transaction(updatedSuccess);

      //chck if student_id is updated or newly added
      let addedSuccess = [];
      let addedStudentSuccess = [];
      let reservedSuccess = [];
      const addedFailed = [];

      for (const student of addedList) {
        if (!student.name || !student.student_id) {
          failList.push(student);
          continue;
        }

        if (!existedStudentIds.includes(student.student_id)) {
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

          addedStudentSuccess.push(addedStudent);
        }

        for (const comp of gradeCompositionNames) {
          const found = parseData.find(
            (x) =>
              x[`Grade: ${comp}`] &&
              x['Student ID'] === student.student_id &&
              x['Student Name'] === student.name,
          );

          if (!found) continue;

          const parseGrade = parseFloat(found[`Grade: ${comp}`]);
          if (isNaN(parseGrade) || parseGrade < 0 || parseGrade > 10) {
            failList.push(found);
            continue;
          }

          const addedGrade = this.prismaService.studentGradeDetail.create({
            data: {
              student_id: student.student_id,
              classroom_id: classroom_id,
              grade_category: getGradeComposition.find((x) => x.name === comp)
                .id,
              grade: parseFloat(found[`Grade: ${comp}`]),
            },
          });

          addedSuccess.push(addedGrade);
        }
      }
      reservedSuccess = await this.prismaService.$transaction(reservedSuccess);
      addedStudentSuccess =
        await this.prismaService.$transaction(addedStudentSuccess);
      addedSuccess = await this.prismaService.$transaction(addedSuccess);

      return {
        statusCode: 200,
        message: 'Upload student grade board successfully',
        metadata: {
          success: updatedSuccess.concat(addedSuccess),
          failed: addedFailed.concat(failList),
        },
      };
    } catch (error) {
      console.log(error);

      if (!(error instanceof HttpException)) {
        throw new InternalServerErrorException(
          error.message || 'Internal Server Error',
        );
      }

      throw error;
    }
  }

  async downloadStudentGradeBoard(classroom_id: number) {
    try {
      //get grade composition
      const gradeComposition =
        await this.prismaService.gradeComposition.findMany({
          where: {
            classroom_id: classroom_id,
          },
          select: {
            id: true,
            name: true,
          },
        });
      const gradeCompositionNames = gradeComposition.map((x) => x.name);
      const gradeCompositionIds = gradeComposition.map((x) => x.id);

      //get student list
      const studentGradeList =
        await this.prismaService.studentGradeList.findMany({
          where: {
            classroom_id: classroom_id,
          },
        });

      //get student grade list of classroom
      const grades = await this.prismaService.studentGradeDetail.findMany({
        where: {
          classroom_id: classroom_id,
          grade_category: {
            in: gradeCompositionIds,
          },
        },
        select: {
          student_id_fk: {
            select: {
              name: true,
              student_id: true,
              email: true,
            },
          },
          grade: true,
          grade_category: true,
          grade_category_fk: {
            select: {
              name: true,
              grade_percent: true,
            },
          },
        },
      });

      //group grades by student id
      const studentsIds = new Set(
        grades.map((x) => x.student_id_fk.student_id),
      );
      const result = [];
      for (const id of studentsIds) {
        const foundGrade = grades.find(
          (x) => x.student_id_fk.student_id === id,
        );

        const student = {
          'Student Name': foundGrade.student_id_fk.name,
          'Student ID': foundGrade.student_id_fk.student_id,
          Email: foundGrade.student_id_fk.email,
        };

        for (const comp of gradeCompositionNames) {
          const found = grades.find(
            (x) =>
              x.grade_category_fk.name === comp &&
              x.student_id_fk.student_id ===
                foundGrade.student_id_fk.student_id,
          );

          if (!found) continue;

          student[`Grade: ${comp}`] = found.grade;
        }

        result.push(student);
        studentGradeList.splice(
          studentGradeList.findIndex((x) => x.student_id === id),
          1,
        );
      }

      for (const student of studentGradeList) {
        const studentData = {
          'Student Name': student.name,
          'Student ID': student.student_id,
          Email: student.email,
        };

        for (const comp of gradeCompositionNames) {
          studentData[`Grade: ${comp}`] = 0;
        }

        result.push(studentData);
      }

      result.sort((a, b) => {
        if (a['Student Name'] <= b['Student Name']) return -1;
        if (a['Student Name'] > b['Student Name']) return 1;
      });

      const excelFile = await this.excelService.writeExcelFile(
        result,
        'Grade Board',
        [
          'Student Name',
          'Student ID',
          'Email',
          ...gradeCompositionNames.map((x) => `Grade: ${x}`),
        ],
      );

      return excelFile;
    } catch (error) {
      console.log(error);
      if (!(error instanceof HttpException)) {
        throw new InternalServerErrorException(
          error.message || 'Internal Server Error',
        );
      }

      throw error;
    }
  }

  async getStudentGradeBoard(classroom_id: number) {
    try {
      const gradeCompositions = (
        await this.prismaService.gradeComposition.findMany({
          where: {
            classroom_id: classroom_id,
          },
        })
      ).map((x) => {
        return {
          grade_percent: x.grade_percent,
          grade_category: x.id,
        };
      });
      const gradeCompositionIds = gradeCompositions.map(
        (x) => x.grade_category,
      );

      const grades = await this.prismaService.studentGradeDetail.findMany({
        where: {
          classroom_id: classroom_id,
          grade_category: {
            in: gradeCompositionIds,
          },
        },
      });

      //get student list
      const students = await this.prismaService.studentGradeList.findMany({
        where: {
          classroom_id: classroom_id,
        },
      });

      //group students and grades by student id
      const result = [];
      for (const student of students) {
        const gradeFilter = [];
        gradeCompositionIds.forEach((id) => {
          const found = grades.find(
            (x) =>
              x.grade_category === id && x.student_id === student.student_id,
          );

          if (!found) {
            gradeFilter.push({
              grade: 0,
              grade_category: id,
              grade_percent: gradeCompositions.find(
                (y) => id === y.grade_category,
              )['grade_percent'],
            });
          } else {
            gradeFilter.push({
              grade: found.grade,
              grade_category: found.grade_category,
              grade_percent: gradeCompositions.find(
                (y) => id === y.grade_category,
              )['grade_percent'],
            });
          }
        });

        result.push({
          name: student.name,
          student_id: student.student_id,
          email: student.email,
          grades: gradeFilter,
        });
      }

      return {
        statusCode: 200,
        message: 'Get student grade board successfully',
        metadata: result,
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

  //Student only

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
