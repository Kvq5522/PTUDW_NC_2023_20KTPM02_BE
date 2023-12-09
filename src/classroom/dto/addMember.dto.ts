import { IsInt, IsNotEmpty, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class AddMemberDto {
  @IsInt()
  @IsNotEmpty()
  classroom_id: number;

  @IsNotEmpty()
  @IsInt()
  role_id: number;

  @IsArray()
  @IsNotEmpty()
  @Transform(({ value }) => {
    return value;
  })
  members: string[];
}
