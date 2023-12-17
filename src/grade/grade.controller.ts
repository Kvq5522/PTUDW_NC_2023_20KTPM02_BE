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

  //Teacher only
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

    if (!checkAuthorization)
      throw new ForbiddenException(
        "You don't have permission to access this resource",
      );

    const excel =
      await this.gradeService.downloadStudentGradeList(classroom_id);

    if (!excel) throw new ForbiddenException('No data');

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
  async uploadStudentGradeByComposition(
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
    const { id } = user;
    const classroom_id = parseInt(body.classroom_id);
    const composition_id = parseInt(body.composition_id);

    const checkAuthorization = await this.gradeService.isTeacherAuthorization(
      classroom_id,
      id,
    );

    if (!checkAuthorization)
      throw new ForbiddenException(
        "You don't have permission to access this resource",
      );

    return this.gradeService.uploadStudentGradeByComposition(
      classroom_id,
      composition_id,
      excel,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('/download-student-grade-by-composition')
  async downloadStudentGradeByComposition(
    @GetUser() user,
    @Body('classroom_id') classroom_id,
    @Body('composition_id') composition_id,
    @Res() res,
  ) {
    classroom_id = parseInt(classroom_id);
    composition_id = parseInt(composition_id);

    const checkAuthorization = await this.gradeService.isTeacherAuthorization(
      classroom_id,
      parseInt(user.id),
    );

    if (!checkAuthorization)
      throw new ForbiddenException(
        "You don't have permission to access this resource",
      );

    const excel = await this.gradeService.downloadStudentGradeByComposition(
      classroom_id,
      composition_id,
    );

    if (!excel) throw new ForbiddenException('No data');

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=student-grade-template.xlsx`,
    );

    res.end(excel, 'binary');
  }

  @HttpCode(HttpStatus.OK)
  @Get('/get-student-grades-by-composition/:classroom_id/:composition_id')
  async getStudentGradesByComposition(
    @GetUser() user,
    @Param('classroom_id') classroom_id,
    @Param('composition_id') composition_id,
  ) {
    const { id } = user;
    classroom_id = parseInt(classroom_id);
    composition_id = parseInt(composition_id);

    const checkAuthorization = await this.gradeService.isTeacherAuthorization(
      classroom_id,
      id,
    );

    if (!checkAuthorization)
      throw new ForbiddenException(
        "You don't have permission to access this resource",
      );

    return this.gradeService.getStudentGradesByComposition(
      classroom_id,
      composition_id,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('/upload-student-grade-board')
  @UseInterceptors(FileInterceptor('excel', {}))
  async uploadStudentGradeBoard(
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
    @Body('classroom_id') classroom_id,
  ) {
    const { id } = user;
    classroom_id = parseInt(classroom_id);

    const checkAuthorization = await this.gradeService.isTeacherAuthorization(
      classroom_id,
      id,
    );

    if (!checkAuthorization)
      throw new ForbiddenException(
        "You don't have permission to access this resource",
      );

    return this.gradeService.uploadStudentGradeBoard(classroom_id, excel);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/download-student-grade-board')
  async downloadStudentGradeBoard(
    @GetUser() user,
    @Body('classroom_id') classroom_id,
    @Res() res,
  ) {
    classroom_id = parseInt(classroom_id);

    const checkAuthorization = await this.gradeService.isTeacherAuthorization(
      classroom_id,
      parseInt(user.id),
    );

    if (!checkAuthorization)
      throw new ForbiddenException(
        "You don't have permission to access this resource",
      );

    const excel =
      await this.gradeService.downloadStudentGradeBoard(classroom_id);

    if (!excel) throw new ForbiddenException('No data');

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=student-grade-board.xlsx`,
    );

    res.end(excel, 'binary');
  }

  @HttpCode(HttpStatus.OK)
  @Get('/get-student-grade-board/:classroom_id')
  async getStudentGradeBoard(
    @GetUser() user,
    @Param('classroom_id') classroom_id,
  ) {
    const { id } = user;
    classroom_id = parseInt(classroom_id);

    const checkAuthorization = await this.gradeService.isTeacherAuthorization(
      classroom_id,
      id,
    );

    if (!checkAuthorization)
      throw new ForbiddenException(
        "You don't have permission to access this resource",
      );

    return this.gradeService.getStudentGradeBoard(classroom_id);
  }

  //Student only
}
