import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

class GradeComposition {
  @IsString()
  name: string;

  @IsInt()
  grade_percent: number;

  @IsBoolean()
  is_finalized: boolean;

  @IsNumber()
  index: number;
}

export class GradeCompositionDto {
  @IsNotEmpty()
  @IsInt()
  classroom_id: number;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeComposition)
  grade_compositions: GradeComposition[];
}
