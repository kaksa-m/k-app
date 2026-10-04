import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { FeesService } from './fees.service';

describe('FeesService', () => {
  const prisma = {
    invoice: { findFirst: jest.fn(), update: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    payment: { create: jest.fn() },
    $transaction: jest.fn(),
  } as any;
  let service: FeesService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (fn: any) => fn(prisma));
    service = new FeesService(prisma);
  });

  it('rejects a payment larger than the invoice balance', async () => {
    prisma.invoice.findFirst.mockResolvedValue({
      id: 'inv-1',
      amountDue: new Prisma.Decimal('1000'),
      amountPaid: new Prisma.Decimal('250'),
    });

    await expect(service.recordPayment('school-a', 'inv-1', { amount: 751, method: 'cash' }))
      .rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.payment.create).not.toHaveBeenCalled();
    expect(prisma.invoice.update).not.toHaveBeenCalled();
  });

  it('records a partial payment and updates invoice status transactionally', async () => {
    prisma.invoice.findFirst.mockResolvedValue({
      id: 'inv-1',
      amountDue: new Prisma.Decimal('1000'),
      amountPaid: new Prisma.Decimal('250'),
    });
    prisma.payment.create.mockResolvedValue({ id: 'pay-1', amount: new Prisma.Decimal('300') });

    const result = await service.recordPayment('school-a', 'inv-1', { amount: 300, method: 'cash' });

    expect(result.id).toBe('pay-1');
    expect(prisma.invoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: { amountPaid: new Prisma.Decimal('550'), status: InvoiceStatus.PARTIALLY_PAID },
    });
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
  });

  it('marks the invoice paid when the balance reaches zero', async () => {
    prisma.invoice.findFirst.mockResolvedValue({
      id: 'inv-1',
      amountDue: new Prisma.Decimal('1000'),
      amountPaid: new Prisma.Decimal('750'),
    });
    prisma.payment.create.mockResolvedValue({ id: 'pay-1', amount: new Prisma.Decimal('250') });

    await service.recordPayment('school-a', 'inv-1', { amount: 250, method: 'online' });

    expect(prisma.invoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: { amountPaid: new Prisma.Decimal('1000'), status: InvoiceStatus.PAID },
    });
  });

  it('does not expose an invoice from another school', async () => {
    prisma.invoice.findFirst.mockResolvedValue(null);

    await expect(service.recordPayment('school-a', 'inv-1', { amount: 10, method: 'cash' }))
      .rejects.toBeInstanceOf(NotFoundException);
  });
});
