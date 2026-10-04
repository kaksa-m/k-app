import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  code?: string;

  // Which classes offer this subject, e.g. ["<class-8-id>", "<class-9-id>"].
  // Omit or send an empty array for a subject not yet assigned to any class.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  classIds?: string[];
}
