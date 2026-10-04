import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  private async assertSessionAccess(schoolId: string, classSessionId: string, role: Role, userId: string) {
    const session = await this.prisma.classSession.findFirst({
      where: { id: classSessionId, section: { schoolId } },
      include: { section: { select: { id: true } } },
    });
    if (!session) throw new ForbiddenException('Class session does not belong to your school.');

    if (role === Role.TEACHER) {
      const teacher = await this.prisma.teacher.findFirst({ where: { userId, schoolId }, select: { id: true } });
      if (!teacher || session.teacherId !== teacher.id) {
        throw new ForbiddenException('Teachers can only manage attendance for their own class sessions.');
      }
    }

    return session;
  }

  async mark(schoolId: string, userId: string, role: Role, dto: MarkAttendanceDto) {
    const session = await this.assertSessionAccess(schoolId, dto.classSessionId, role, userId);
    const date = new Date(dto.date);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid attendance date.');

    const studentIds = dto.entries.map((entry) => entry.studentId);
    if (new Set(studentIds).size !== studentIds.length) {
      throw new BadRequestException('Each student may appear only once in an attendance submission.');
    }

    const students = await this.prisma.student.findMany({
      where: { id: { in: studentIds }, schoolId, sectionId: session.section.id },
      select: { id: true },
    });
    if (students.length !== studentIds.length) {
      throw new ForbiddenException('Attendance can only be recorded for students in this class section.');
    }

    const results = await this.prisma.$transaction(
      dto.entries.map((entry) =>
        this.prisma.attendance.upsert({
          where: {
            classSessionId_studentId_date: {
              classSessionId: dto.classSessionId,
              studentId: entry.studentId,
              date,
            },
          },
          create: {
            classSessionId: dto.classSessionId,
            studentId: entry.studentId,
            date,
            status: entry.status,
          },
          update: { status: entry.status, markedAt: new Date() },
        }),
      ),
    );

    return { success: true, count: results.length };
  }

  async forSession(schoolId: string, classSessionId: string, date: string, role: Role, userId: string) {
    const session = await this.assertSessionAccess(schoolId, classSessionId, role, userId);
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) throw new BadRequestException('Invalid attendance date.');

    const fullSession = await this.prisma.classSession.findUniqueOrThrow({
      where: { id: session.id },
      include: { section: { include: { students: { where: { isActive: true } } } } },
    });
    const existing = await this.prisma.attendance.findMany({ where: { classSessionId, date: parsedDate } });
    const byStudent = new Map(existing.map((a) => [a.studentId, a.status]));

    return fullSession.section.students.map((s) => ({
      studentId: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      rollNumber: s.rollNumber,
      status: byStudent.get(s.id) ?? null,
    }));
  }

  async forStudent(schoolId: string, studentId: string, role: Role, userId: string, from?: string, to?: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId },
      select: { id: true, userId: true, parentId: true },
    });
    if (!student) throw new NotFoundException('Student not found.');

    if (role === Role.STUDENT && student.userId !== userId) {
      throw new ForbiddenException('Students can only view their own attendance.');
    }

    if (role === Role.PARENT) {
      const parent = await this.prisma.parent.findFirst({
        where: { userId, schoolId, students: { some: { id: studentId } } },
        select: { id: true },
      });
      if (!parent) throw new ForbiddenException('Parents can only view attendance for their own children.');
    }

    return this.prisma.attendance.findMany({
      where: {
        studentId,
        student: { schoolId },
        ...(from || to ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
      },
      include: { classSession: { include: { subject: true } } },
      orderBy: { date: 'desc' },
    });
  }
}
