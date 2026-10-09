import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceStatus, Prisma } from '@prisma/client';
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

  async updateStructure(schoolId: string, id: string, dto: CreateFeeStructureDto) {
    const existing = await this.prisma.feeStructure.findFirst({ where: { id, schoolId } });
    if (!existing) throw new NotFoundException('Fee structure not found.');
    return this.prisma.feeStructure.update({ where: { id }, data: dto });
  }

  async deleteStructure(schoolId: string, id: string) {
    const existing = await this.prisma.feeStructure.findFirst({
      where: { id, schoolId },
      include: { _count: { select: { invoices: true } } },
    });
    if (!existing) throw new NotFoundException('Fee structure not found.');
    if (existing._count.invoices > 0) {
      throw new BadRequestException('This fee structure is linked to invoices and cannot be deleted. Edit it instead, or only delete unused fee structures.');
    }
    return this.prisma.feeStructure.delete({ where: { id } });
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
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({ where: { id: invoiceId, schoolId } });
      if (!invoice) throw new NotFoundException('Invoice not found.');

      const paymentAmount = new Prisma.Decimal(dto.amount);
      const balance = invoice.amountDue.minus(invoice.amountPaid);
      if (paymentAmount.greaterThan(balance)) {
        throw new BadRequestException(`Payment exceeds the invoice balance of ${balance.toFixed(2)}.`);
      }

      const payment = await tx.payment.create({
        data: { invoiceId, amount: paymentAmount, method: dto.method, reference: dto.reference },
      });

      const newAmountPaid = invoice.amountPaid.plus(paymentAmount);
      const status: InvoiceStatus = newAmountPaid.greaterThanOrEqualTo(invoice.amountDue)
        ? InvoiceStatus.PAID
        : newAmountPaid.greaterThan(0)
          ? InvoiceStatus.PARTIALLY_PAID
          : InvoiceStatus.PENDING;

      await tx.invoice.update({
        where: { id: invoiceId },
        data: { amountPaid: newAmountPaid, status },
      });

      return payment;
    }, { isolationLevel: 'Serializable' });
  }
}
