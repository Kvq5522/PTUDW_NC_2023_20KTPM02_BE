import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      statusCode: 200,
      message: 'Google classrom clone API',
      metadata: {
        version: '1.0.0',
        author_1: 'Quach Vinh Khang',
        author_2: 'Ha Huynh Duc Huy',
        class: 'Web Dev Adv 20KTPM02',
      },
    };
  }
}
