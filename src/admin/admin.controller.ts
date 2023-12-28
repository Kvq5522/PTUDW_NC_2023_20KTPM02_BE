import {
  BadRequestException,
  Body,
  Controller,
  FileTypeValidator,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import { AdminService } from './admin.service';
import { GetUser } from 'src/auth/decorator';
import { ClassroomInfoDto, UserInfoDto } from './dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CustomFilePipe } from 'src/user/pipe';

@Controller('admin')
@UseGuards(JwtGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @HttpCode(HttpStatus.OK)
  @Get('/get-user-list')
  async getUserList(@GetUser() user) {
    try {
      if (user.authorization < 4)
        throw new ForbiddenException("You're not allowed");

      return await this.adminService.getUserList();
    } catch (error) {
      throw error;
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('/update-user-info')
  async updateUserInfo(
    @GetUser() user,
    @Body(new ValidationPipe()) dto: UserInfoDto,
  ) {
    try {
      if (user.authorization < 4)
        throw new ForbiddenException("You're not allowed");

      return await this.adminService.updateUserInfo(dto);
    } catch (error) {
      throw error;
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('/download-user-list')
  async downloadStudentList(@GetUser() user, @Res() res) {
    try {
      if (user.authorization < 4)
        throw new ForbiddenException("You're not allowed");

      const excel = await this.adminService.downloadUserList();

      if (!excel) throw new BadRequestException('No Data');

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );

      res.setHeader(
        'Content-Disposition',
        `attachment; filename=user-list-template.xlsx`,
      );

      res.end(excel, 'binary');
    } catch (error) {
      throw error;
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('/upload-user-list')
  @UseInterceptors(FileInterceptor('excel', {}))
  async uploadStudentList(
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
  ) {
    try {
      if (user.authorization < 4)
        throw new ForbiddenException("You're not allowed");

      return await this.adminService.uploadUserList(excel);
    } catch (error) {
      throw error;
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get('/get-classroom-list')
  async getClassroomList(@GetUser() user) {
    try {
      if (user.authorization < 4)
        throw new ForbiddenException("You're not allowed");

      return await this.adminService.getClassroomList();
    } catch (error) {
      throw error;
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('/update-classroom-info')
  async updateClassroomInfo(
    @GetUser() user,
    @Body(new ValidationPipe()) dto: ClassroomInfoDto,
  ) {
    try {
      if (user.authorization < 4)
        throw new ForbiddenException("You're not allowed");

      return await this.adminService.updateClassroomInfo(dto);
    } catch (error) {
      throw error;
    }
  }
}
