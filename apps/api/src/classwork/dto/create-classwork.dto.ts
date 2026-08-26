import { IsDateString, IsString } from 'class-validator';

export class CreateClassworkDto {
  @IsString()
  classSessionId!: string;

  @IsDateString()
  date!: string;

  @IsString()
  summary!: string;
}
