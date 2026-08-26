import { IsInt, IsString } from 'class-validator';

export class CreateClassDto {
  @IsString()
  name!: string;

  @IsInt()
  order!: number;
}
