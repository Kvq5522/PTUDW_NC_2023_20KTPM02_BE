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
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsString()
  name: string;

  @IsNumber()
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
