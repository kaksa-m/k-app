import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  // Upserts one row per student for the given session + date, so a
  // teacher can re-open "today's attendance" and correct it without
  // creating duplicates (enforced by the @@unique([classSessionId,
  // studentId, date]) constraint in the schema).
  async mark(schoolId: string, dto: MarkAttendanceDto) {
    const session = await this.prisma.classSession.findFirst({
      where: { id: dto.classSessionId, section: { schoolId } },
    });
    if (!session) throw new ForbiddenException('Class session does not belong to your school.');

    const date = new Date(dto.date);

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

  async forSession(schoolId: string, classSessionId: string, date: string) {
    const session = await this.prisma.classSession.findFirst({
      where: { id: classSessionId, section: { schoolId } },
      include: { section: { include: { students: { where: { isActive: true } } } } },
    });
    if (!session) throw new ForbiddenException('Class session does not belong to your school.');

    const existing = await this.prisma.attendance.findMany({
      where: { classSessionId, date: new Date(date) },
    });
    const byStudent = new Map(existing.map((a) => [a.studentId, a.status]));

    // Return the full roster with existing marks pre-filled, so the UI
    // can render everyone even before attendance has been taken today.
    return session.section.students.map((s) => ({
      studentId: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      rollNumber: s.rollNumber,
      status: byStudent.get(s.id) ?? null,
    }));
  }

  async forStudent(schoolId: string, studentId: string, from?: string, to?: string) {
    return this.prisma.attendance.findMany({
      where: {
        studentId,
        student: { schoolId },
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      include: { classSession: { include: { subject: true } } },
      orderBy: { date: 'desc' },
    });
  }
}
