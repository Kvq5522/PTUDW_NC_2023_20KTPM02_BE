import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { MailDto } from './dto/mail.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/sign-up')
  async signUp(
    @Body(new ValidationPipe({ groups: ['sign-up'] })) dto: AuthDto,
  ) {
    return await this.authService.signUp(dto);
  }

  @Post('/sign-in')
  async signIn(
    @Body(new ValidationPipe({ groups: ['sign-in'] })) dto: AuthDto,
  ) {
    return await this.authService.signIn(dto);
  }

  @Post('/send-recovery-mail')
  async sendRecoveryMail(@Body(new ValidationPipe()) dto: MailDto) {
    return await this.authService.sendRecoveryMail(dto.email);
  }

  @Post('/recover-password')
  async recoverPassword(
    @Body(new ValidationPipe({ groups: ['recovery'] })) dto: MailDto,
  ) {
    return await this.authService.recoverPassword(dto);
  }
}
