import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

export class UserInfo {
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  student_id: string;

  @IsBoolean()
  @IsNotEmpty()
  is_banned: boolean;

  @IsNumber()
  @IsNotEmpty()
  authorization: number;
}

export class UserInfoDto {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => UserInfo)
  users: UserInfo[];
}

export class AdminInfo {
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsString()
  @IsNotEmpty()
  email: string;
}

export class AdminInfoDto {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AdminInfo)
  admins: AdminInfo[];
}
