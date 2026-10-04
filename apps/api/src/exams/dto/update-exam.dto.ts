import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ExamStatus } from '@prisma/client';
export class UpdateExamDto {
  @IsOptional() @IsString() @MaxLength(120) name?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsEnum(ExamStatus) status?: ExamStatus;
}
