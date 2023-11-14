import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { MailDto } from './dto/mail.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('/sign-up')
  async signUp(
    @Body(new ValidationPipe({ groups: ['sign-up'] })) dto: AuthDto,
  ) {
    try {
      return await this.authService.signUp(dto);
    } catch (error) {
      return error.response;
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('/sign-in')
  async signIn(
    @Body(new ValidationPipe({ groups: ['sign-in'] })) dto: AuthDto,
  ) {
    try {
      return await this.authService.signIn(dto);
    } catch (error) {
      return error.response;
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('/send-recovery-mail')
  async sendRecoveryMail(@Body(new ValidationPipe()) dto: MailDto) {
    return await this.authService.sendRecoveryMail(dto.email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/recover-password')
  async recoverPassword(
    @Body(new ValidationPipe({ groups: ['recovery'] })) dto: MailDto,
  ) {
    try {
      return await this.authService.recoverPassword(dto);
    } catch (error) {
      return error.response;
    }
  }
}
