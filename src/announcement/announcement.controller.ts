import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { GetUser } from 'src/auth/decorator';
import { User } from '@prisma/client';
import { JwtGuard } from 'src/auth/guard';

@UseGuards(JwtGuard)
@Controller('announcement')
export class AnnouncementController {
  constructor(private announcementService: AnnouncementService) {}

  @HttpCode(HttpStatus.OK)
  @Get('/get-classroom-announcement/:classroom_id')
  async getClassroomAnnouncement(
    @GetUser() user,
    @Param('classroom_id') classroom_id,
  ) {
    classroom_id = parseInt(classroom_id);

    return this.announcementService.getClassroomAnnouncements(
      classroom_id,
      user.id,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('/get-notifications')
  async getNotifications(@GetUser() user: User) {
    return await this.announcementService.getNotifications(user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/get-announcement/:classroom_id/detail/:announcement_id')
  async getAnnouncementDetail(
    @GetUser() user: User,
    @Param('classroom_id') classroom_id,
    @Param('announcement_id') announcement_id,
  ) {
    announcement_id = parseInt(announcement_id);
    classroom_id = parseInt(classroom_id);

    const checkInClassroom = await this.announcementService.isMemberOfClassroom(
      classroom_id,
      user.id,
    );

    const checkIsRelated =
      await this.announcementService.isRelatedToAnnouncement(
        announcement_id,
        user.id,
      );

    if (!checkInClassroom || !checkIsRelated)
      throw new ForbiddenException("You're not allowed to view this");

    return await this.announcementService.getAnnouncementDetail(
      classroom_id,
      announcement_id,
    );
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/create-comment/:classroom_id/:announcement_id')
  async createComment(
    @GetUser() user: User,
    @Param('announcement_id') announcement_id,
    @Param('classroom_id') classroom_id,
    @Body('description') description: string,
  ) {
    announcement_id = parseInt(announcement_id);
    classroom_id = parseInt(classroom_id);

    const checkInClassroom = await this.announcementService.isMemberOfClassroom(
      classroom_id,
      user.id,
    );

    const checkIsRelated =
      await this.announcementService.isRelatedToAnnouncement(
        announcement_id,
        user.id,
      );

    if (!checkInClassroom || !checkIsRelated)
      throw new ForbiddenException("You're not allowed to view this");

    if (!description) throw new BadRequestException('Description is required');

    return await this.announcementService.createComment(
      announcement_id,
      user,
      description,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('/get-comments/:classroom_id/:announcement_id')
  async getComments(
    @GetUser() user: User,
    @Param('announcement_id') announcement_id,
    @Param('classroom_id') classroom_id,
  ) {
    announcement_id = parseInt(announcement_id);
    classroom_id = parseInt(classroom_id);

    const checkInClassroom = await this.announcementService.isMemberOfClassroom(
      classroom_id,
      user.id,
    );

    const checkIsRelated =
      await this.announcementService.isRelatedToAnnouncement(
        announcement_id,
        user.id,
      );

    if (!checkInClassroom || !checkIsRelated)
      throw new ForbiddenException("You're not allowed to view this");

    return await this.announcementService.getComments(announcement_id);
  }
}
