import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class StudentGrade {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  student_id: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(10)
  grade: number;
}

export class StudentId {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  student_id: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class StudentGradeDTO {
  @IsNumber()
  @IsNotEmpty()
  classroom_id: number;

  @IsNumber()
  @IsNotEmpty()
  grade_category: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentGrade)
  student_grades: StudentGrade[];
}

export class ReassessStudentGradeDTO {
  @IsNumber()
  @IsNotEmpty()
  classroom_id: number;

  @IsNumber()
  @IsNotEmpty()
  grade_category: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  student_id: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(10)
  grade: number;
}

export class StudentIdDto {
  @IsNumber()
  @IsNotEmpty()
  classroom_id: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentId)
  student_ids: StudentId[];
}
