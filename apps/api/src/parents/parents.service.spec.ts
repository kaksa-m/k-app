import { ConflictException, ForbiddenException } from '@nestjs/common';
import { ParentsService } from './parents.service';

jest.mock('bcrypt', () => ({ hash: jest.fn().mockResolvedValue('hashed-password') }));

function prismaMock() {
  return {
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    parent: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    $transaction: jest.fn(async (cb: any) => cb({
      user: { create: jest.fn().mockResolvedValue({ id: 'user-1' }), update: jest.fn(), delete: jest.fn() },
      parent: { create: jest.fn().mockResolvedValue({ id: 'parent-1' }), update: jest.fn().mockResolvedValue({ id: 'parent-1' }), delete: jest.fn() },
    })),
  };
}

describe('ParentsService', () => {
  it('rejects duplicate email', async () => {
    const prisma = prismaMock();
    prisma.user.findUnique.mockResolvedValue({ id: 'existing' });
    const service = new ParentsService(prisma as any);

    await expect(service.create('school-1', {
      firstName: 'A', lastName: 'B', email: 'parent@example.com',
    })).rejects.toBeInstanceOf(ConflictException);
  });

  it('blocks deletion while parent has students', async () => {
    const prisma = prismaMock();
    prisma.parent.findFirst.mockResolvedValue({ id: 'p1', userId: 'u1', firstName: 'A', lastName: 'B', students: [{ id: 's1' }] });
    const service = new ParentsService(prisma as any);

    await expect(service.remove('school-1', 'p1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates a parent login and profile in one transaction', async () => {
    const prisma = prismaMock();
    prisma.user.findUnique.mockResolvedValue(null);
    const service = new ParentsService(prisma as any);

    await service.create('school-1', {
      firstName: 'Ramesh', lastName: 'Kumar', email: 'Ramesh@Example.com', phone: '999',
    });

    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
