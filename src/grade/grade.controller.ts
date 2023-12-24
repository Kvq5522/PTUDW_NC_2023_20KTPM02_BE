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
import { GradeCompositionDto, StudentGradeDTO, StudentIdDto } from './dto';
import { CustomFilePipe } from 'src/user/pipe';
import { GetUser } from 'src/auth/decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@UseGuards(JwtGuard)
@Controller('grade')
export class GradeController {
  constructor(private gradeService: GradeService) {}

  // Both teacher and student
  @HttpCode(HttpStatus.OK)
  @Get('/get-compositions/:classroom_id')
  async getGradeComposition(
    @GetUser() user,
    @Param('classroom_id') classroom_id,
  ) {
    classroom_id = parseInt(classroom_id);

    return this.gradeService.getGradeComposition(classroom_id);
  }

  //Teacher only
  @HttpCode(HttpStatus.OK)
  @Post('/add-composition')
  async addGradeComposition(
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

    return this.gradeService.addGradeComposition(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/delete-composition')
  async deleteGradeComposition(
    @GetUser() user,
    @Body('classroom_id') classroom_id,
    @Body('composition_id') composition_id,
  ) {
    classroom_id = parseInt(classroom_id);
    composition_id = parseInt(composition_id);

    const checkAuthorization = await this.gradeService.isTeacherAuthorization(
      classroom_id,
      user.id,
    );

    if (!checkAuthorization)
      throw new ForbiddenException(
        "You don't have permission to access this resource",
      );

    return this.gradeService.deleteGradeComposition(
      classroom_id,
      composition_id,
    );
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

    return this.gradeService.editGradeCompostition(dto, user.id);
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
    @Body('classroom_id') classroom_id,
    @Body('composition_id') composition_id,
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
  @Post('/edit-student-grade-by-composition')
  async editStudentGradeByComposition(
    @GetUser() user,
    @Body(new ValidationPipe()) dto: StudentGradeDTO,
  ) {
    const { id } = user;
    const { classroom_id } = dto;

    const checkAuthorization = await this.gradeService.isTeacherAuthorization(
      classroom_id,
      id,
    );

    if (!checkAuthorization)
      throw new ForbiddenException(
        "You don't have permission to access this resource",
      );

    return this.gradeService.editStudentGradeByComposition(dto);
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

  @HttpCode(HttpStatus.OK)
  @Post('/map-student-id-in-grade-board')
  async mapStudentIdInGradeBoard(
    @GetUser() user,
    @Body(new ValidationPipe()) dto: StudentIdDto,
  ) {
    const { id } = user;
    const { classroom_id } = dto;

    const checkAuthorization = await this.gradeService.isTeacherAuthorization(
      classroom_id,
      id,
    );

    if (!checkAuthorization)
      throw new ForbiddenException(
        "You don't have permission to access this resource",
      );

    return this.gradeService.mapStudentIdInGradeBoard(dto);
  }

  //Student only
  @HttpCode(HttpStatus.OK)
  @Get('/get-student-grades/:classroom_id')
  async getStudentGrades(@GetUser() user, @Param('classroom_id') classroom_id) {
    classroom_id = parseInt(classroom_id);

    const checkAuthorization = await this.gradeService.isStudentAuthorization(
      classroom_id,
      user.id,
    );

    if (!checkAuthorization)
      throw new ForbiddenException(
        "You don't have permission to access this resource",
      );

    return this.gradeService.getStudentGrades(classroom_id, user);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/create-grade-review')
  async createGradeReview(
    @GetUser() user,
    @Body(new ValidationPipe()) dto: any,
  ) {
    const { id } = user;
    const { classroom_id } = dto;

    const checkAuthorization = await this.gradeService.isStudentAuthorization(
      classroom_id,
      id,
    );

    if (!checkAuthorization)
      throw new ForbiddenException(
        "You don't have permission to access this resource",
      );

    return this.gradeService.createGradeReview(dto, user);
  }
}
