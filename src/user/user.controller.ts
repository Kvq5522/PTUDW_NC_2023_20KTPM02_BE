import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { UserService } from './user.service';

import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';

import { User } from '@prisma/client';
import { UserDto } from './dto';
import { CustomFilePipe } from './pipe';

@UseGuards(JwtGuard)
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @HttpCode(200)
  @Get('/get-info')
  getUser(@GetUser() user: User) {
    delete user.password;

    return {
      statusCode: HttpStatus.OK,
      message: 'Get user info successfully',
      metadata: user,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Patch('/update-info')
  @UseInterceptors(FileInterceptor('avatar', {}))
  async updateUser(
    @GetUser() user: User,
    @Body(new ValidationPipe({ groups: ['update-info'] })) dto: UserDto,
    @UploadedFile(
      new CustomFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }),
          new FileTypeValidator({ fileType: 'image' }),
        ],
      }),
    )
    avatar: Express.Multer.File,
  ) {
    try {
      return await this.userService.updateUser(user.id, dto, avatar);
    } catch (error) {
      return error.response;
    }
  }
}
