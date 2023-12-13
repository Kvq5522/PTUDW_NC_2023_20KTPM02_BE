import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GradeCompositionDto } from './dto';

@Injectable()
export class GradeService {
  constructor(private prismaService: PrismaService) {}

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
        metadata: Array.from([updatedSuccess, addedSuccess]),
      };
    } catch (error) {
      if (!(error instanceof HttpException)) {
        console.log(error);
        throw new InternalServerErrorException(error);
      }

      throw error;
    }
  }
}
