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

  async sendVerificationMail(
    user: { email: any; first_name: any; last_name: any },
    token: string,
  ) {
    try {
      if (!user) throw new Error('User not found');

      await this.mailService.sendMail({
        to: user.email,
        subject: 'Email Verification',
        template: 'activateAccount',
        context: {
          link: `${process.env.BE_ENDPOINT}/auth/verify-email?token=${token}&email=${user.email}`,
          user: `${user.first_name} ${user.last_name}`,
        },
      });
    } catch (error) {
      Logger.error(error);
      throw new Error(error);
    }
  }

  async sendInviteMail(
    user: { email: any; first_name: any; last_name: any },
    classname: string,
    owner: { first_name: any; last_name: any },
    uri: string,
  ) {
    try {
      if (!user) throw new Error('User not found');

      await this.mailService.sendMail({
        to: user.email,
        subject: 'Invitation to join the classroom',
        template: 'inviteToClass',
        context: {
          link: `${process.env.FE_ENDPOINT}/classroom/invite?uri=${uri}`,
          user: `${user.first_name} ${user.last_name}`,
          classname: classname,
          owner: `${owner.first_name} ${owner.last_name}`,
        },
      });
    } catch (error) {
      Logger.error(error);
      throw new Error(error);
    }
  }
}
