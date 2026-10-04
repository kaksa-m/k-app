import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ClassSessionsService } from './class-sessions.service';

describe('ClassSessionsService', () => {
  const prisma = {
    section: { findFirst: jest.fn() },
    subject: { findFirst: jest.fn() },
    class: { findFirst: jest.fn() },
    teacher: { findFirst: jest.fn() },
    classSession: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn() },
  } as any;
  let service: ClassSessionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.classSession.findMany.mockResolvedValue([]);
    service = new ClassSessionsService(prisma);
  });

  it('rejects a section from another school', async () => {
    prisma.section.findFirst.mockResolvedValue(null);

    await expect(service.create('school-a', {
      sectionId: 'section-b', subjectId: 'subject-a', teacherId: 'teacher-a',
      dayOfWeek: 1, startTime: '09:00', endTime: '10:00', room: '101',
    } as any)).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.classSession.create).not.toHaveBeenCalled();
  });

  it('rejects a subject not offered by the section class', async () => {
    prisma.section.findFirst.mockResolvedValue({ id: 'section-a', classId: 'class-a' });
    prisma.subject.findFirst.mockResolvedValue({ id: 'subject-a' });
    prisma.class.findFirst.mockResolvedValue(null);

    await expect(service.create('school-a', {
      sectionId: 'section-a', subjectId: 'subject-a', teacherId: 'teacher-a',
      dayOfWeek: 1, startTime: '09:00', endTime: '10:00', room: '101',
    } as any)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects an invalid time range', async () => {
    prisma.section.findFirst.mockResolvedValue({ id: 'section-a', classId: 'class-a' });
    prisma.subject.findFirst.mockResolvedValue({ id: 'subject-a' });
    prisma.class.findFirst.mockResolvedValue({ id: 'class-a' });
    prisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-a' });

    await expect(service.create('school-a', {
      sectionId: 'section-a', subjectId: 'subject-a', teacherId: 'teacher-a',
      dayOfWeek: 1, startTime: '10:00', endTime: '09:00', room: '101',
    } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects overlapping section sessions', async () => {
    prisma.section.findFirst.mockResolvedValue({ id: 'section-a', classId: 'class-a' });
    prisma.subject.findFirst.mockResolvedValue({ id: 'subject-a' });
    prisma.class.findFirst.mockResolvedValue({ id: 'class-a' });
    prisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-a' });
    prisma.classSession.findMany.mockResolvedValue([
      { id: 'existing', sectionId: 'section-a', teacherId: 'teacher-b', room: '101', startTime: '09:30', endTime: '10:30' },
    ]);

    await expect(service.create('school-a', {
      sectionId: 'section-a', subjectId: 'subject-a', teacherId: 'teacher-a',
      dayOfWeek: 1, startTime: '10:00', endTime: '11:00', room: '102',
    } as any)).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.classSession.create).not.toHaveBeenCalled();
  });

  it('validates merged relations on update', async () => {
    prisma.classSession.findFirst.mockResolvedValue({
      id: 'session-a', sectionId: 'section-a', subjectId: 'subject-a', teacherId: 'teacher-a',
      startTime: '09:00', endTime: '10:00', section: { class: {} },
      subject: {}, teacher: {},
    });
    prisma.section.findFirst.mockResolvedValue(null);

    await expect(service.update('school-a', 'session-a', { sectionId: 'section-b' } as any))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.classSession.update).not.toHaveBeenCalled();
  });

  it('does not expose a session from another school', async () => {
    prisma.classSession.findFirst.mockResolvedValue(null);

    await expect(service.findOne('school-a', 'session-b')).rejects.toBeInstanceOf(NotFoundException);
  });
});
