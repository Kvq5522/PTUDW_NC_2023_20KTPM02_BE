import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailingModule } from './mailing/mailing.module';
import { FirebaseService } from './firebase/firebase.service';

@Module({
  imports: [
    UserModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    MailingModule,
  ],
  controllers: [AppController],
  providers: [AppService, FirebaseService],
})
export class AppModule {}
