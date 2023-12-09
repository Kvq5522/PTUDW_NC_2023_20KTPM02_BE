import { Module } from '@nestjs/common';
import { ClassroomController } from './classroom.controller';
import { ClassroomService } from './classroom.service';
import { MailingService } from 'src/mailing/mailing.service';

@Module({
  controllers: [ClassroomController],
  providers: [ClassroomService, MailingService],
})
export class ClassroomModule {}
