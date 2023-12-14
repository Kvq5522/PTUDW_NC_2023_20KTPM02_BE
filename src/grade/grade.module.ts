import { Module } from '@nestjs/common';
import { GradeController } from './grade.controller';
import { GradeService } from './grade.service';
import { ExcelService } from 'src/excel/excel.service';

@Module({
  controllers: [GradeController],
  providers: [GradeService, ExcelService],
})
export class GradeModule {}
