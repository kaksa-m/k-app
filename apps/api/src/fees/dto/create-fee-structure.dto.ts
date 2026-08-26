import { IsIn, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateFeeStructureDto {
  @IsString()
  name!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsIn(['monthly', 'quarterly', 'annual', 'one-time'])
  frequency!: string;
}
