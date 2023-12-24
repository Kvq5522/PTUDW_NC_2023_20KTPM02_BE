import { IsInt, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class GradeReviewDTO {
  @IsNumber()
  @IsInt()
  @IsNotEmpty()
  classroom_id: number;

  @IsNumber()
  @IsNotEmpty()
  expected_grade: number;

  @IsNotEmpty()
  @IsNumber()
  grade_category: number;

  @IsString()
  @IsNotEmpty()
  description: string;
}
