import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { FirebaseService } from 'src/firebase/firebase.service';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService, FirebaseService],
})
export class UserModule {}
