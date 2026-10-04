import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AttendanceService } from './attendance.service';

describe('AttendanceService', () => {
  const prisma = {
    classSession: { findFirst: jest.fn(), findUniqueOrThrow: jest.fn() },
    teacher: { findFirst: jest.fn() },
    student: { findMany: jest.fn() },
    attendance: { upsert: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn(),
  } as any;
  let service: AttendanceService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (ops: any[]) => Promise.all(ops));
    service = new AttendanceService(prisma);
  });

  it('rejects a teacher managing another teacher\'s session', async () => {
    prisma.classSession.findFirst.mockResolvedValue({
      id: 'session-1',
      teacherId: 'teacher-b',
      section: { id: 'section-1' },
    });
    prisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-a' });

    await expect(service.mark('school-a', 'user-a', Role.TEACHER, {
      classSessionId: 'session-1',
      date: '2026-10-04',
      entries: [{ studentId: 'student-1', status: 'PRESENT' as any }],
    })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects students outside the session section', async () => {
    prisma.classSession.findFirst.mockResolvedValue({
      id: 'session-1',
      teacherId: 'teacher-a',
      section: { id: 'section-1' },
    });
    prisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-a' });
    prisma.student.findMany.mockResolvedValue([{ id: 'student-1' }]);

    await expect(service.mark('school-a', 'user-a', Role.TEACHER, {
      classSessionId: 'session-1',
      date: '2026-10-04',
      entries: [
        { studentId: 'student-1', status: 'PRESENT' as any },
        { studentId: 'student-2', status: 'ABSENT' as any },
      ],
    })).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.attendance.upsert).not.toHaveBeenCalled();
  });

  it('rejects duplicate students in one submission', async () => {
    prisma.classSession.findFirst.mockResolvedValue({
      id: 'session-1',
      teacherId: 'teacher-a',
      section: { id: 'section-1' },
    });
    prisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-a' });

    await expect(service.mark('school-a', 'user-a', Role.TEACHER, {
      classSessionId: 'session-1',
      date: '2026-10-04',
      entries: [
        { studentId: 'student-1', status: 'PRESENT' as any },
        { studentId: 'student-1', status: 'ABSENT' as any },
      ],
    })).rejects.toBeInstanceOf(Error);

    expect(prisma.student.findMany).not.toHaveBeenCalled();
  });
});
