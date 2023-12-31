import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ClassroomService } from './classroom.service';
import { JwtGuard } from 'src/auth/guard';
import { Request } from 'express';
import { AddMemberDto, CreateDTO, DeleteMemberDTO } from './dto';
import { User } from '@prisma/client';

@UseGuards(JwtGuard)
@Controller('classroom')
export class ClassroomController {
  constructor(private classroomService: ClassroomService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('/create')
  async createClassroom(
    @Req() req: Request,
    @Body(new ValidationPipe()) dto: CreateDTO,
  ) {
    try {
      const user = req.user as User;
      dto.userId = user.id;

      return await this.classroomService.createClassroom(dto);
    } catch (error) {
      return error.response;
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get('/list')
  async getClassroomList(@Req() req: Request) {
    try {
      const user = req.user as User;

      return await this.classroomService.getClassroomList(user.id);
    } catch (error) {
      return error.response;
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get('/info/:classroom_id')
  async getClasroomInfo(@Req() req: Request, @Param() params) {
    try {
      const user = req.user as User;

      if (!params.classroom_id)
        throw new BadRequestException('Missing classroom id');

      return await this.classroomService.getClassroomInfo(
        parseInt(params.classroom_id),
        user.id,
      );
    } catch (error) {
      return error.response;
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get('/user-info/:classroom_id')
  async getUserInfoInClass(@Req() req: Request, @Param() params) {
    try {
      const user = req.user as User;

      if (!params.classroom_id)
        throw new BadRequestException('Missing classroom id');

      return await this.classroomService.getUserInfoInClass(
        parseInt(params.classroom_id),
        user.id,
      );
    } catch (error) {
      return error.response;
    }
  }

  @HttpCode(HttpStatus.OK)
  @Delete('/leave/:classroom_id')
  async leaveClassroom(@Req() req, @Param() params) {
    try {
      const user = req.user as User;

      if (!params.classroom_id)
        throw new BadRequestException('Missing classroom id');

      return await this.classroomService.leaveClassroom(
        parseInt(params.classroom_id),
        user.id,
      );
    } catch (error) {
      return error.response;
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get('/member-info/:classroom_id')
  async getClassroomMember(@Param() params, @Req() req) {
    try {
      const user = req.user as User;
      return await this.classroomService.getClassroomMember(
        parseInt(params.classroom_id),
        user.id,
      );
    } catch (error) {
      return error.response;
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get('/invitation-info/:classroom_id')
  async getClassroomInvitationInfo(@Req() req, @Param() params) {
    try {
      const user = req.user as User;
      return await this.classroomService.getClassroomInvitationInfo(
        parseInt(params.classroom_id),
        user.id,
      );
    } catch (error) {
      return error.response;
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('/join-by-invite-code')
  async joinClassroomByInviteCode(@Req() req, @Body() body) {
    try {
      const user = req.user as User;

      if (!body.invite_code)
        throw new BadRequestException('Missing invite code');

      return await this.classroomService.joinClassroomByInviteCode(
        body.invite_code,
        user.id,
      );
    } catch (error) {
      return error.response;
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('/join-by-invite-uri')
  async joinClassroomByInviteUri(@Req() req, @Body() body) {
    try {
      const user = req.user as User;

      if (!body.invite_uri) throw new BadRequestException('Missing invite uri');

      return await this.classroomService.joinClassroomByInviteUri(
        body.invite_uri,
        user.id,
      );
    } catch (error) {
      return error.response;
    }
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/add-member')
  async addMember(
    @Req() req,
    @Body(new ValidationPipe({ transform: true })) addMemberDTO: AddMemberDto,
  ) {
    try {
      const user = req.user as User;

      if (!addMemberDTO.classroom_id)
        throw new BadRequestException('Missing classroom id');

      if (!addMemberDTO.members)
        throw new BadRequestException('Missing members');

      if (!addMemberDTO.role_id)
        throw new BadRequestException('Missing role id');

      return await this.classroomService.addMember(
        addMemberDTO,
        user.id,
        role_id,
      );
    } catch (error) {
      return error.response;
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('/delete-member')
  async deleteMember(
    @Req() req,
    @Body(new ValidationPipe()) dto: DeleteMemberDTO,
  ) {
    try {
      const user = req.user as User;

      if (!dto.classroom_id)
        throw new BadRequestException('Missing classroom id');

      if (!dto.member_emails)
        throw new BadRequestException('Missing member email');

      return await this.classroomService.deleteMember(dto, user.id);
    } catch (error) {
      return error.response;
    }
  }
}
