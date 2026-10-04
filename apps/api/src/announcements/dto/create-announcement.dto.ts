import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AnnouncementAudience } from '@prisma/client';

export class CreateAnnouncementDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body!: string;

  @IsOptional()
  @IsEnum(AnnouncementAudience)
  audience?: AnnouncementAudience;

  @IsOptional()
  @IsString()
  sectionId?: string;
}
