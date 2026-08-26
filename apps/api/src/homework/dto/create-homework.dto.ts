import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateHomeworkDto {
  @IsString()
  classSessionId!: string;

  @IsDateString()
  assignedDate!: string;

  @IsDateString()
  dueDate!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
