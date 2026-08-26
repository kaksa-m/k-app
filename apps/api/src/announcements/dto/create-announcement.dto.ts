import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AnnouncementAudience } from '@prisma/client';

export class CreateAnnouncementDto {
  @IsString()
  title!: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsEnum(AnnouncementAudience)
  audience?: AnnouncementAudience;

  @IsOptional()
  @IsString()
  sectionId?: string;
}
