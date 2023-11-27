import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    super({
      clientID: process.env.FACEBOOK_OATH_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_OATH_CLIENT_SECRET,
      callbackURL: `${process.env.BE_ENDPOINT}/auth/facebook/callback`,
      profileFields: ['email', 'name', 'picture.type(large)'],
      scope: ['email', 'public_profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ) {
    const { name, emails, photos } = profile;

    if (!emails) {
      throw new Error('Email not found');
    }

    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      token: accessToken,
    };
    done(null, user);
  }
}
