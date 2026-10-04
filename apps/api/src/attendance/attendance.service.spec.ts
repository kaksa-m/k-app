import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AttendanceService } from './attendance.service';

describe('AttendanceService', () => {
  const prisma = {
    classSession: { findFirst: jest.fn(), findUniqueOrThrow: jest.fn() },
    teacher: { findFirst: jest.fn() },
    parent: { findFirst: jest.fn() },
    student: { findMany: jest.fn(), findFirst: jest.fn() },
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
  it('allows a student to view only their own attendance', async () => {
    prisma.student.findFirst.mockResolvedValue({ id: 'student-1', userId: 'user-student', parentId: null });
    prisma.attendance.findMany.mockResolvedValue([]);

    await expect(service.forStudent('school-a', 'student-1', Role.STUDENT, 'user-student'))
      .resolves.toEqual([]);
  });

  it('rejects a student viewing another student attendance', async () => {
    prisma.student.findFirst.mockResolvedValue({ id: 'student-2', userId: 'user-other', parentId: null });

    await expect(service.forStudent('school-a', 'student-2', Role.STUDENT, 'user-student'))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.attendance.findMany).not.toHaveBeenCalled();
  });

  it('allows a parent to view attendance for their own child', async () => {
    prisma.student.findFirst.mockResolvedValue({ id: 'student-1', userId: null, parentId: 'parent-1' });
    prisma.parent.findFirst.mockResolvedValue({ id: 'parent-1' });
    prisma.attendance.findMany.mockResolvedValue([]);

    await expect(service.forStudent('school-a', 'student-1', Role.PARENT, 'parent-user'))
      .resolves.toEqual([]);
  });

  it('rejects a parent viewing another family student attendance', async () => {
    prisma.student.findFirst.mockResolvedValue({ id: 'student-2', userId: null, parentId: 'parent-2' });
    prisma.parent.findFirst.mockResolvedValue(null);

    await expect(service.forStudent('school-a', 'student-2', Role.PARENT, 'parent-user'))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.attendance.findMany).not.toHaveBeenCalled();
  });

});
