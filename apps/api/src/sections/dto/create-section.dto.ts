import { IsOptional, IsString } from 'class-validator';

export class CreateSectionDto {
  @IsString()
  classId!: string;

  @IsString()
  academicYearId!: string;

  @IsString()
  name!: string; // e.g. "A"

  @IsOptional()
  @IsString()
  classTeacherId?: string;
}
