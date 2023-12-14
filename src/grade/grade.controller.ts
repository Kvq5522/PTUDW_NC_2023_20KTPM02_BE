import {
  Body,
  Controller,
  FileTypeValidator,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import { GradeService } from './grade.service';
import { GradeCompositionDto } from './dto';
import { CustomFilePipe } from 'src/user/pipe';
import { GetUser } from 'src/auth/decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@UseGuards(JwtGuard)
@Controller('grade')
export class GradeController {
  constructor(private gradeService: GradeService) {}

  @HttpCode(HttpStatus.OK)
  @Get('/get-composition/:classroom_id')
  async getGradeCompositio(@Param('classroom_id') classroom_id: number) {
    return this.gradeService.getGradeComposition(classroom_id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/edit-composition')
  async editGradeCompositions(
    @GetUser() user,
    @Body(new ValidationPipe()) dto: GradeCompositionDto,
  ) {
    const checkAuthorization = await this.gradeService.isTeacherAuthorization(
      dto.classroom_id,
      user.id,
    );

    if (!checkAuthorization)
      throw new ForbiddenException(
        "You don't have permission to access this resource",
      );

    return this.gradeService.editGradeCompostition(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/upload-student-list')
  @UseInterceptors(FileInterceptor('excel', {}))
  async uploadStudentGradeList(
    @GetUser() user,
    @UploadedFile(
      new CustomFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
          new FileTypeValidator({
            fileType:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          }),
        ],
      }),
    )
    excel: Express.Multer.File,
    @Body() body: any,
  ) {
    const { classroom_id } = body;
    const { id } = user;

    if (!classroom_id || !user.id) throw new ForbiddenException('Missing data');

    const checkAuthorization = await this.gradeService.isTeacherAuthorization(
      parseInt(classroom_id),
      parseInt(id),
    );

    if (!checkAuthorization)
      throw new ForbiddenException(
        "You don't have permission to access this resource",
      );

    return this.gradeService.uploadStudentGradeList(
      parseInt(classroom_id),
      excel,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('/download-student-list')
  async downloadStudentGradeList(
    @GetUser() user,
    @Body('classroom_id') classroom_id,
    @Res() res,
  ) {
    classroom_id = parseInt(classroom_id);

    const checkAuthorization = await this.gradeService.isTeacherAuthorization(
      classroom_id,
      parseInt(user.id),
    );

    console.log(checkAuthorization);

    if (!checkAuthorization)
      throw new ForbiddenException(
        "You don't have permission to access this resource",
      );

    const excel =
      await this.gradeService.downloadStudentGradeList(classroom_id);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=student-list-template.xlsx`,
    );

    res.end(excel, 'binary');
  }

  @HttpCode(HttpStatus.OK)
  @Get('/get-student-list/:classroom_id')
  async getStudentGradeList(
    @GetUser() user,
    @Param('classroom_id') classroom_id: number,
  ) {
    const { id } = user;
    const checkAuthorization = await this.gradeService.isTeacherAuthorization(
      classroom_id,
      id,
    );

    if (!checkAuthorization)
      throw new ForbiddenException(
        "You don't have permission to access this resource",
      );

    return this.gradeService.getStudentGradeList(classroom_id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/upload-student-grade-by-composition')
  @UseInterceptors(FileInterceptor('excel', {}))
  async uploadStudentGradeByComposition() {}
}
