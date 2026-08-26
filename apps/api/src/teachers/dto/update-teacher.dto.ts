import { IsOptional, IsString } from 'class-validator';

// Deliberately excludes email/password — profile edits only.
// Credential changes should go through a dedicated auth flow later.
export class UpdateTeacherDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  employeeCode?: string;
}
