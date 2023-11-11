import { IsEmail, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class MailDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty({ groups: ['recovery'] })
  @ValidateIf((o) => o.password !== undefined)
  @IsString()
  password: string;

  @IsNotEmpty({ groups: ['recovery'] })
  @ValidateIf((o) => o.confirm_password !== undefined)
  @IsString()
  confirm_password: string;

  @IsNotEmpty({ groups: ['recovery'] })
  @ValidateIf((o) => o.token !== undefined)
  @IsString()
  token: string;
}
