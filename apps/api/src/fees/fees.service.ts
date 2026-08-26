import { Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

@Injectable()
export class FeesService {
  constructor(private prisma: PrismaService) {}

  // ---- Fee structures ----

  createStructure(schoolId: string, dto: CreateFeeStructureDto) {
    return this.prisma.feeStructure.create({ data: { ...dto, schoolId } });
  }

  findStructures(schoolId: string) {
    return this.prisma.feeStructure.findMany({ where: { schoolId }, orderBy: { name: 'asc' } });
  }

  // ---- Invoices ----

  async createInvoice(schoolId: string, dto: CreateInvoiceDto) {
    const [student, structure] = await Promise.all([
      this.prisma.student.findFirst({ where: { id: dto.studentId, schoolId } }),
      this.prisma.feeStructure.findFirst({ where: { id: dto.feeStructureId, schoolId } }),
    ]);
    if (!student) throw new NotFoundException('Student not found.');
    if (!structure) throw new NotFoundException('Fee structure not found.');

    return this.prisma.invoice.create({
      data: {
        schoolId,
        studentId: dto.studentId,
        feeStructureId: dto.feeStructureId,
        amountDue: dto.amountDue,
        dueDate: new Date(dto.dueDate),
      },
    });
  }

  findInvoices(schoolId: string, filters: { studentId?: string; status?: InvoiceStatus }) {
    return this.prisma.invoice.findMany({
      where: { schoolId, ...filters },
      include: { student: true, feeStructure: true, payments: true },
      orderBy: { dueDate: 'asc' },
    });
  }

  // Every school-wide "outstanding fees" figure on the dashboard reads
  // from this — kept as one method so the definition of "outstanding"
  // (unpaid + partially paid, regardless of due date) stays consistent.
  async outstandingSummary(schoolId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { schoolId, status: { in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] } },
    });
    const totalOutstanding = invoices.reduce(
      (sum, inv) => sum + (Number(inv.amountDue) - Number(inv.amountPaid)),
      0,
    );
    return { invoiceCount: invoices.length, totalOutstanding };
  }

  // ---- Payments ----

  async recordPayment(schoolId: string, invoiceId: string, dto: RecordPaymentDto) {
    const invoice = await this.prisma.invoice.findFirst({ where: { id: invoiceId, schoolId } });
    if (!invoice) throw new NotFoundException('Invoice not found.');

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: { invoiceId, amount: dto.amount, method: dto.method, reference: dto.reference },
      });

      const newAmountPaid = Number(invoice.amountPaid) + dto.amount;
      const amountDue = Number(invoice.amountDue);
      const status: InvoiceStatus =
        newAmountPaid >= amountDue
          ? InvoiceStatus.PAID
          : newAmountPaid > 0
            ? InvoiceStatus.PARTIALLY_PAID
            : InvoiceStatus.PENDING;

      await tx.invoice.update({
        where: { id: invoiceId },
        data: { amountPaid: newAmountPaid, status },
      });

      return payment;
    });
  }
}
