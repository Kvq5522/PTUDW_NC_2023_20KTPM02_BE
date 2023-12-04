import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDTO {
  @IsString()
  @IsNotEmpty()
  classname: string;

  userId: number;
}
