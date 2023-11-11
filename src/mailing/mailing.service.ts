import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailingService {
  constructor(private mailService: MailerService) {}

  async sendRecoveryMail(
    user: { email: any; first_name: any; last_name: any },
    token: string,
  ) {
    try {
      if (!user) throw new Error('User not found');

      await this.mailService.sendMail({
        to: user.email,
        subject: 'Password Recovery',
        template: 'recoverPassword',
        context: {
          token,
          user: `${user.first_name} ${user.last_name}`,
        },
      });
    } catch (error) {
      Logger.error(error);
      throw new Error(error);
    }
  }
}
