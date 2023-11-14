import { IsNotEmpty, IsNumber, IsString, ValidateIf } from 'class-validator';

export class UserDto {
  @IsNotEmpty()
  @IsString()
  confirm_password: string;

  @ValidateIf((o) => o.new_password !== undefined)
  @IsString()
  new_password: string;

  @ValidateIf((o) => o.first_name !== undefined)
  @IsString()
  first_name: string;

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
}
