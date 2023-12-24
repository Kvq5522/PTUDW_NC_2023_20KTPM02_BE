import { Module } from '@nestjs/common';
import { AnnouncementController } from './announcement.controller';
import { AnnouncementService } from './announcement.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [AnnouncementController],
  providers: [AnnouncementService, PrismaService],
})
export class AnnouncementModule {}
