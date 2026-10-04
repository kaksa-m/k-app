import { PlatformService } from './platform.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({ hash: jest.fn().mockResolvedValue('hashed-password') }));

describe('PlatformService', () => {
  const prisma = {
    school: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
    },
    user: { count: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    student: { count: jest.fn() },
    invoice: { aggregate: jest.fn() },
    $transaction: jest.fn(),
  } as any;

  beforeEach(() => jest.clearAllMocks());

  it('aggregates platform data across schools for SUPER_ADMIN', async () => {
    prisma.school.count.mockResolvedValue(2);
    prisma.user.count.mockResolvedValue(6);
    prisma.student.count.mockResolvedValue(40);
    prisma.invoice.aggregate.mockResolvedValue({ _sum: { amountDue: 50000, amountPaid: 32000 } });

    await expect(new PlatformService(prisma).overview()).resolves.toEqual({
      schools: 2,
      users: 6,
      students: 40,
      outstandingFees: 18000,
    });
    expect(prisma.user.count).toHaveBeenCalledWith({ where: { role: { not: Role.SUPER_ADMIN } } });
  });

  it('creates a school and its first SCHOOL_ADMIN in one transaction', async () => {
    prisma.school.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue(null);
    const tx = {
      school: { create: jest.fn().mockResolvedValue({ id: 'school-1', name: 'North Star', slug: 'north-star' }) },
      user: { create: jest.fn().mockResolvedValue({ id: 'user-1', email: 'admin@northstar.test', name: 'Admin' }) },
    };
    prisma.$transaction.mockImplementation(async (callback: any) => callback(tx));

    const result = await new PlatformService(prisma).createSchool({
      schoolName: 'North Star', schoolSlug: 'north-star', city: 'Hyderabad',
      adminName: 'Admin', adminEmail: 'admin@northstar.test', adminPassword: 'password123',
    });

    expect(result.admin.email).toBe('admin@northstar.test');
    expect(tx.school.create).toHaveBeenCalled();
    expect(tx.user.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ schoolId: 'school-1', role: Role.SCHOOL_ADMIN }) }));
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
  });
});
