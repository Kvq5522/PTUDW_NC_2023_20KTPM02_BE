import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  signUp() {
    return 'This is a sign-up method';
  }

  signIn() {
    return 'This is a sign-in method';
  }
}
