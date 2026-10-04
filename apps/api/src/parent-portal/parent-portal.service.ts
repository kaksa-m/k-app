import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ParentPortalService {
  constructor(private prisma: PrismaService) {}

  async dashboard(userId: string, schoolId: string) {
    const parent = await this.prisma.parent.findFirst({
      where: { userId, schoolId },
      include: {
        students: {
          where: { schoolId, isActive: true },
          include: {
            section: { include: { class: true } },
            attendance: {
              orderBy: { date: 'desc' },
              take: 30,
              include: { classSession: { include: { subject: true } } },
            },
            invoices: {
              orderBy: { dueDate: 'asc' },
              include: { feeStructure: true, payments: true },
            },
          },
          orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        },
      },
    });

    if (!parent) throw new ForbiddenException('Parent account is not linked to this school.');

    const sectionIds = parent.students
      .map((student) => student.sectionId)
      .filter((id): id is string => Boolean(id));

    const studentIds = parent.students.map((student) => student.id);

    const [homework, classwork, announcements] = await Promise.all([
      this.prisma.homework.findMany({
        where: {
          classSession: { sectionId: { in: sectionIds } },
        },
        include: {
          classSession: { include: { subject: true, section: { include: { class: true } } } },
        },
        orderBy: { dueDate: 'asc' },
        take: 50,
      }),
      this.prisma.classwork.findMany({
        where: {
          classSession: { sectionId: { in: sectionIds } },
        },
        include: {
          classSession: { include: { subject: true, section: { include: { class: true } } } },
        },
        orderBy: { date: 'desc' },
        take: 50,
      }),
      this.prisma.announcement.findMany({
        where: {
          schoolId,
          OR: [
            { audience: 'SCHOOL_WIDE' },
            ...(sectionIds.length > 0 ? [{ audience: 'SECTION' as const, sectionId: { in: sectionIds } }] : []),
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    // Keep this reference explicit so future portal features can add student-specific
    // resources without accidentally widening the tenant scope.
    if (studentIds.length === 0) {
      return {
        parent: { id: parent.id, firstName: parent.firstName, lastName: parent.lastName },
        students: [],
        homework: [],
        classwork: [],
        announcements,
      };
    }

    return {
      parent: { id: parent.id, firstName: parent.firstName, lastName: parent.lastName },
      students: parent.students,
      homework,
      classwork,
      announcements,
    };
  }
}
