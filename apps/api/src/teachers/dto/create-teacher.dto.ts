import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

// Creates a login (User, role=TEACHER) and a Teacher profile together —
// a teacher can't exist in KAKSAM without being able to log in.
export class CreateTeacherDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

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
