import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailingModule } from './mailing/mailing.module';
import { FirebaseService } from './firebase/firebase.service';
import { ClassroomModule } from './classroom/classroom.module';
import { GradeModule } from './grade/grade.module';
import { AnnouncementModule } from './announcement/announcement.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    MailingModule,
    ClassroomModule,
    GradeModule,
    AnnouncementModule,
  ],
  controllers: [AppController],
  providers: [AppService, FirebaseService],
})
export class AppModule {}
