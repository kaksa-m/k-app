import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class StudentPortalService {
  constructor(private prisma: PrismaService) {}

  async dashboard(userId: string, schoolId: string) {
    const student = await this.prisma.student.findFirst({
      where: { userId, schoolId, isActive: true },
      include: { section: { include: { class: true, academicYear: true } }, parent: true },
    });
    if (!student) throw new ForbiddenException('Student account is not linked to an active student record.');
    const [attendance, homework, classwork, announcements, results] = await Promise.all([
      this.prisma.attendance.findMany({ where: { studentId: student.id }, include: { classSession: { include: { subject: true } } }, orderBy: { date: 'desc' }, take: 30 }),
      this.prisma.homework.findMany({ where: student.sectionId ? { classSession: { sectionId: student.sectionId } } : { id: '__none__' }, include: { classSession: { include: { subject: true } } }, orderBy: { dueDate: 'asc' }, take: 30 }),
      this.prisma.classwork.findMany({ where: student.sectionId ? { classSession: { sectionId: student.sectionId } } : { id: '__none__' }, include: { classSession: { include: { subject: true } } }, orderBy: { date: 'desc' }, take: 30 }),
      this.prisma.announcement.findMany({ where: { schoolId, OR: [{ audience: 'SCHOOL_WIDE' }, ...(student.sectionId ? [{ audience: 'SECTION' as const, sectionId: student.sectionId }] : [])] }, orderBy: { createdAt: 'desc' }, take: 30 }),
      this.prisma.examResult.findMany({ where: { studentId: student.id, exam: { academicYear: { schoolId }, status: 'PUBLISHED' } }, include: { exam: true, subject: true }, orderBy: [{ exam: { startDate: 'desc' } }, { subject: { name: 'asc' } }] }),
    ]);
    return { student, attendance, homework, classwork, announcements, results };
  }
}
