import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { FeesService } from './fees.service';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { InvoiceStatus } from '@prisma/client';

@Controller('fees')
export class FeesController {
  constructor(private service: FeesService) {}

  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT)
  @Post('structures')
  createStructure(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateFeeStructureDto) {
    return this.service.createStructure(user.schoolId!, dto);
  }

  @Get('structures')
  findStructures(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findStructures(user.schoolId!);
  }

  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT)
  @Post('invoices')
  createInvoice(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateInvoiceDto) {
    return this.service.createInvoice(user.schoolId!, dto);
  }

  @Get('invoices')
  findInvoices(
    @CurrentUser() user: AuthenticatedUser,
    @Query('studentId') studentId?: string,
    @Query('status') status?: InvoiceStatus,
  ) {
    return this.service.findInvoices(user.schoolId!, { studentId, status });
  }

  @Get('outstanding-summary')
  outstandingSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.service.outstandingSummary(user.schoolId!);
  }

  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT)
  @Post('invoices/:id/payments')
  recordPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') invoiceId: string,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.service.recordPayment(user.schoolId!, invoiceId, dto);
  }
}
