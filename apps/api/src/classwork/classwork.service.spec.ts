import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ClassworkService } from './classwork.service';

describe('ClassworkService', () => {
  const prisma = {
    classSession: { findFirst: jest.fn() },
    teacher: { findFirst: jest.fn() },
    classwork: { create: jest.fn(), findFirst: jest.fn(), delete: jest.fn(), findMany: jest.fn() },
  } as any;
  let service: ClassworkService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ClassworkService(prisma);
  });

  it('allows a teacher to create classwork only for their own session', async () => {
    prisma.classSession.findFirst.mockResolvedValue({ id: 'session-1', teacherId: 'teacher-a' });
    prisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-a' });
    prisma.classwork.create.mockResolvedValue({ id: 'cw-1' });

    const result = await service.create('school-a', 'user-a', Role.TEACHER, {
      classSessionId: 'session-1',
      title: 'Fractions',
      description: 'Practice',
      date: '2026-10-04',
    } as any);

    expect(result).toEqual({ id: 'cw-1' });
    expect(prisma.classwork.create).toHaveBeenCalled();
  });

  it('rejects a teacher creating classwork for another teacher\'s session', async () => {
    prisma.classSession.findFirst.mockResolvedValue({ id: 'session-1', teacherId: 'teacher-b' });
    prisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-a' });

    await expect(service.create('school-a', 'user-a', Role.TEACHER, {
      classSessionId: 'session-1',
      title: 'Fractions',
      date: '2026-10-04',
    } as any)).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.classwork.create).not.toHaveBeenCalled();
  });
});
