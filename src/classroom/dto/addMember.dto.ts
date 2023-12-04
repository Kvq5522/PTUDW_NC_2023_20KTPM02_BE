import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsNotEmpty, ValidateNested } from 'class-validator';

class AddMember {
  @IsEmail()
  member_email: string;

  @IsInt()
  role_id: number;
}

export class AddMemberDto {
  @IsInt()
  @IsNotEmpty()
  classroom_id: number;

  @ValidateNested({ each: true })
  @Type(() => AddMember)
  members: AddMember[];
}
