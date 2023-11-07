import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';

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
}
