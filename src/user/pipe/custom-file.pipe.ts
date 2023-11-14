import { Injectable } from '@nestjs/common';
import { ParseFilePipe, ParseFileOptions } from '@nestjs/common';

@Injectable()
export class CustomFilePipe extends ParseFilePipe implements ParseFilePipe {
  constructor(options: ParseFileOptions) {
    super(options);
  }

  async transform(value: any) {
    if (!value) {
      return value;
    }

    return super.transform(value);
  }
}
