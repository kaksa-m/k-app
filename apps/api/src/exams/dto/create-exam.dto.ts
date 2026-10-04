import { IsDateString, IsString, MinLength } from 'class-validator';

export class CreateExamDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  academicYearId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}
