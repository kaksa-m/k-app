import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpsertExamResultDto {
  @IsString()
  examId!: string;

  @IsString()
  studentId!: string;

  @IsString()
  subjectId!: string;

  @IsNumber()
  @Min(0)
  marks!: number;

  @IsNumber()
  @Min(0.01)
  maxMarks!: number;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
