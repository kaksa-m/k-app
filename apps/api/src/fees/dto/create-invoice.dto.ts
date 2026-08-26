import { IsDateString, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  studentId!: string;

  @IsString()
  feeStructureId!: string;

  @IsNumber()
  @IsPositive()
  amountDue!: number;

  @IsDateString()
  dueDate!: string;
}
