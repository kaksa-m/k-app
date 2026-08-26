import { IsEmail, IsString, MinLength } from 'class-validator';

// Onboards a brand-new school along with its first School Admin user,
// in a single transaction — see auth.service.ts#registerSchool.
export class RegisterSchoolDto {
  @IsString()
  schoolName!: string;

  @IsString()
  schoolSlug!: string; // used in URLs / subdomain later, e.g. "green-valley"

  @IsEmail()
  adminEmail!: string;

  @IsString()
  @MinLength(8)
  adminPassword!: string;

  @IsString()
  adminName!: string;
}
