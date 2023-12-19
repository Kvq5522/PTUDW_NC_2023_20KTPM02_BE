import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateIf,
} from 'class-validator';

export class AuthDto {
  @IsNotEmpty({ groups: ['sign-up', 'sign-in'] })
  @IsEmail()
  email: string;

  @IsNotEmpty({ groups: ['sign-up', 'sign-in'] })
  @IsString()
  password: string;

  @IsNotEmpty({ groups: ['sign-up'] })
  @ValidateIf((o) => o.first_name !== undefined)
  @IsString()
  first_name: string;

  @IsNotEmpty({ groups: ['sign-up'] })
  @ValidateIf((o) => o.last_name !== undefined)
  @IsString()
  last_name: string;

  @ValidateIf((o) => o.phone_number !== undefined)
  @IsString()
  phone_number: string;

  @ValidateIf((o) => o.address !== undefined)
  @IsString()
  address: string;

  @ValidateIf((o) => o.age !== undefined)
  @IsNumber()
  age: number;

  @ValidateIf((o) => o.gender !== undefined)
  @IsString()
  gender: string;

  @ValidateIf((o) => o.student_id !== undefined)
  @IsString()
  student_id: string;
}
