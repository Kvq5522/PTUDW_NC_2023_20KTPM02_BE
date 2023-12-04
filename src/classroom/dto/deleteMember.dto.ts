import { IsInt, IsNotEmpty } from 'class-validator';

export class DeleteMemberDTO {
  @IsInt()
  @IsNotEmpty()
  classroom_id: number;

  @IsNotEmpty()
  member_emails: string[];
}
