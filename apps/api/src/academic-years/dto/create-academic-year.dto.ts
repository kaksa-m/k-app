import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateAcademicYearDto {
  @IsString()
  name!: string; // e.g. "2026-27"

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;
}
