import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { HomeworkService } from './homework.service';

describe('HomeworkService', () => {
  const prisma = {
    classSession: { findFirst: jest.fn() },
    teacher: { findFirst: jest.fn() },
    homework: { create: jest.fn(), findFirst: jest.fn(), delete: jest.fn(), findMany: jest.fn() },
  } as any;
  let service: HomeworkService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new HomeworkService(prisma);
  });

  it('allows a teacher to create homework for their own session', async () => {
    prisma.classSession.findFirst.mockResolvedValue({ id: 'session-1', teacherId: 'teacher-a' });
    prisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-a' });
    prisma.homework.create.mockResolvedValue({ id: 'hw-1' });

    await expect(service.create('school-a', 'user-a', Role.TEACHER, {
      classSessionId: 'session-1', assignedDate: '2026-10-04', dueDate: '2026-10-05', title: 'Practice',
    } as any)).resolves.toEqual({ id: 'hw-1' });
  });

  it('rejects a teacher creating homework for another teacher session', async () => {
    prisma.classSession.findFirst.mockResolvedValue({ id: 'session-1', teacherId: 'teacher-b' });
    prisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-a' });

    await expect(service.create('school-a', 'user-a', Role.TEACHER, {
      classSessionId: 'session-1', assignedDate: '2026-10-04', dueDate: '2026-10-05', title: 'Practice',
    } as any)).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.homework.create).not.toHaveBeenCalled();
  });
});
