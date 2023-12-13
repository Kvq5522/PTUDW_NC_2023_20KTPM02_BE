import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import { GradeService } from './grade.service';
import { GradeCompositionDto } from './dto';

@UseGuards(JwtGuard)
@Controller('grade')
export class GradeController {
  constructor(private gradeService: GradeService) {}

  @HttpCode(HttpStatus.OK)
  @Get('/get-composition/:classroom_id')
  async getGrade(@Param('classroom_id') classroom_id: number) {
    return this.gradeService.getGradeComposition(classroom_id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/edit-composition')
  async editGradeCompositions(
    @Body(new ValidationPipe()) dto: GradeCompositionDto,
  ) {
    return this.gradeService.editGradeCompostition(dto);
  }
}
