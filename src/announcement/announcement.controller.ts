import {
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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

    const checkAuthorization =
      await this.announcementService.isTeacherAuthorization(
        classroom_id,
        user.id,
      );

    if (!checkAuthorization)
      throw new ForbiddenException("You're not a teacher of this classroom");

    return await this.announcementService.getAnnouncementDetail(
      classroom_id,
      announcement_id,
    );
  }
}
