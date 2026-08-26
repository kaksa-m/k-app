import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class RecordPaymentDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  method!: string; // "cash" | "online" | "cheque" | ...

  @IsOptional()
  @IsString()
  reference?: string;
}
