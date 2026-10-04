import { ForbiddenException } from '@nestjs/common';
import { StudentsService } from './students.service';

function makePrisma() {
  return {
    section: { findFirst: jest.fn() },
    parent: { findFirst: jest.fn() },
    student: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  } as any;
}

describe('StudentsService', () => {
  it('rejects a section from another school', async () => {
    const prisma = makePrisma();
    prisma.section.findFirst.mockResolvedValue(null);
    const service = new StudentsService(prisma);

    await expect(
      service.create('school-a', { firstName: 'A', lastName: 'Student', sectionId: 'section-b' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('filters student search inside the tenant and supports inactive records only when requested', async () => {
    const prisma = makePrisma();
    prisma.student.findMany.mockResolvedValue([]);
    const service = new StudentsService(prisma);

    await service.findAll('school-a', { q: 'sam', includeInactive: true });

    expect(prisma.student.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: 'school-a', OR: expect.any(Array) }),
      }),
    );
    expect(prisma.student.findMany.mock.calls[0][0].where.isActive).toBeUndefined();
  });

  it('deactivates a student rather than deleting the record', async () => {
    const prisma = makePrisma();
    prisma.student.findFirst.mockResolvedValue({ id: 'student-1', schoolId: 'school-a' });
    prisma.student.update.mockResolvedValue({ id: 'student-1', isActive: false });
    const service = new StudentsService(prisma);

    await service.remove('school-a', 'student-1');

    expect(prisma.student.update).toHaveBeenCalledWith({
      where: { id: 'student-1' },
      data: { isActive: false },
    });
  });
});
