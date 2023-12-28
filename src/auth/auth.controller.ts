import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { MailDto } from './dto/mail.dto';
import { FacebookGuard, GoogleGuard, JwtGuard } from './guard';
import { GetUser } from './decorator';

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

  @Get('google')
  @UseGuards(GoogleGuard)
  async googleAuth() {}

  @HttpCode(HttpStatus.OK)
  @Get('google/callback')
  @UseGuards(GoogleGuard)
  async googleAuthRedirect(@Req() req, @Res() res) {
    try {
      const token = await this.authService.findOrCreateOauthUser(req);
      return res.redirect(`${process.env.FE_ENDPOINT}/sign-in?token=${token}`);
    } catch (error) {
      return res.redirect(`${process.env.FE_ENDPOINT}/sign-in`);
    }
  }

  @Get('facebook')
  @UseGuards(FacebookGuard)
  async facebookAuth() {}

  @Get('facebook/callback')
  @UseGuards(FacebookGuard)
  async facebookAuthRedirect(@Req() req, @Res() res) {
    try {
      const token = await this.authService.findOrCreateOauthUser(req);
      return res.redirect(`${process.env.FE_ENDPOINT}/sign-in?token=${token}`);
    } catch (error) {
      return res.redirect(`${process.env.FE_ENDPOINT}/sign-in`);
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

  @HttpCode(HttpStatus.OK)
  @Get('/verify-email')
  async activateAccount(@Query() queries, @Res() res) {
    try {
      const token = await this.authService.activateAccount(
        queries.email,
        queries.token,
      );

      return res.redirect(`${process.env.FE_ENDPOINT}/sign-in?token=${token}`);
    } catch (error) {
      return error.response;
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('/verify-token')
  async verifyToken(@Body() body) {
    try {
      if (!body.token) throw new ForbiddenException('Token is required');

      return await this.authService.verifyToken(body.token);
    } catch (error) {
      return error.response;
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('/verify-admin')
  @UseGuards(JwtGuard)
  async verifyAdmin(@GetUser() user) {
    const test = await this.authService.verifyAdmin(user);

    return test;
  }
}
