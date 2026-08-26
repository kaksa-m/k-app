import { Injectable } from '@nestjs/common';
import { AttendanceStatus, InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
function endOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}
// Schema uses 0=Monday..6=Sunday (see ClassSession.dayOfWeek); JS Date
// uses 0=Sunday..6=Saturday, so convert before querying by day.
function schemaDayOfWeek(d: Date) {
  const jsDay = d.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

// This module answers "what does today look like?" for each role —
// the "Today's School" dashboard concept from the product plan. Every
// method here is deliberately read-heavy/aggregating; nothing here
// mutates data.
@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async adminToday(schoolId: string) {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = endOfDay(now);
    const todaySchemaDay = schemaDayOfWeek(now);

    const [totalStudents, todaysSessions, presentTodayRows, absentTodayCount, paymentsToday, outstanding, overdueCount] =
      await Promise.all([
        this.prisma.student.count({ where: { schoolId, isActive: true } }),
        this.prisma.classSession.findMany({
          where: { section: { schoolId }, dayOfWeek: todaySchemaDay },
          select: { id: true, teacherId: true },
        }),
        this.prisma.attendance.findMany({
          where: { classSession: { section: { schoolId } }, date: { gte: today, lte: tomorrow }, status: AttendanceStatus.PRESENT },
          distinct: ['studentId'],
          select: { studentId: true },
        }),
        this.prisma.attendance.count({
          where: { classSession: { section: { schoolId } }, date: { gte: today, lte: tomorrow }, status: AttendanceStatus.ABSENT },
        }),
        this.prisma.payment.aggregate({
          where: { invoice: { schoolId }, paidAt: { gte: today, lte: tomorrow } },
          _sum: { amount: true },
        }),
        this.prisma.invoice.aggregate({
          where: { schoolId, status: { in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] } },
          _sum: { amountDue: true, amountPaid: true },
          _count: true,
        }),
        this.prisma.invoice.count({
          where: { schoolId, dueDate: { lt: today }, status: { not: InvoiceStatus.PAID } },
        }),
      ]);

    const teacherIdsScheduledToday = [...new Set(todaysSessions.map((s) => s.teacherId))];
    const sessionIdsToday = todaysSessions.map((s) => s.id);

    const [teacherIdsWithAttendanceMarked, sessionIdsWithClasswork] = await Promise.all([
      this.prisma.attendance
        .findMany({
          where: { classSessionId: { in: sessionIdsToday }, date: { gte: today, lte: tomorrow } },
          select: { classSession: { select: { teacherId: true } } },
          distinct: ['classSessionId'],
        })
        .then((rows) => new Set(rows.map((r) => r.classSession.teacherId))),
      this.prisma.classwork
        .findMany({
          where: { classSessionId: { in: sessionIdsToday }, date: { gte: today, lte: tomorrow } },
          select: { classSessionId: true },
          distinct: ['classSessionId'],
        })
        .then((rows) => new Set(rows.map((r) => r.classSessionId))),
    ]);

    const teachersMissingAttendance = teacherIdsScheduledToday.filter(
      (id) => !teacherIdsWithAttendanceMarked.has(id),
    ).length;
    const sessionsMissingClasswork = sessionIdsToday.filter((id) => !sessionIdsWithClasswork.has(id)).length;

    const totalOutstanding =
      Number(outstanding._sum.amountDue ?? 0) - Number(outstanding._sum.amountPaid ?? 0);

    return {
      date: today.toISOString().slice(0, 10),
      students: { present: presentTodayRows.length, total: totalStudents },
      feesCollectedToday: Number(paymentsToday._sum.amount ?? 0),
      outstandingFees: totalOutstanding,
      alerts: {
        teachersMissingAttendance,
        studentsAbsentToday: absentTodayCount,
        feePaymentsOverdue: overdueCount,
        sessionsMissingClasswork,
      },
    };
  }

  async teacherToday(schoolId: string, teacherId: string) {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = endOfDay(now);
    const todaySchemaDay = schemaDayOfWeek(now);

    const sessions = await this.prisma.classSession.findMany({
      where: { teacherId, section: { schoolId }, dayOfWeek: todaySchemaDay },
      include: {
        subject: true,
        section: { include: { class: true, students: { where: { isActive: true }, select: { id: true } } } },
      },
      orderBy: { startTime: 'asc' },
    });

    const sessionIds = sessions.map((s) => s.id);
    const [attendanceMarkedIds, classworkPostedIds, homeworkPostedIds] = await Promise.all([
      this.prisma.attendance
        .findMany({
          where: { classSessionId: { in: sessionIds }, date: { gte: today, lte: tomorrow } },
          select: { classSessionId: true },
          distinct: ['classSessionId'],
        })
        .then((rows) => new Set(rows.map((r) => r.classSessionId))),
      this.prisma.classwork
        .findMany({
          where: { classSessionId: { in: sessionIds }, date: { gte: today, lte: tomorrow } },
          select: { classSessionId: true },
          distinct: ['classSessionId'],
        })
        .then((rows) => new Set(rows.map((r) => r.classSessionId))),
      this.prisma.homework
        .findMany({
          where: { classSessionId: { in: sessionIds }, assignedDate: { gte: today, lte: tomorrow } },
          select: { classSessionId: true },
          distinct: ['classSessionId'],
        })
        .then((rows) => new Set(rows.map((r) => r.classSessionId))),
    ]);

    const todaysClasses = sessions.map((s) => ({
      classSessionId: s.id,
      startTime: s.startTime,
      endTime: s.endTime,
      subject: s.subject.name,
      className: s.section.class.name,
      sectionName: s.section.name,
      studentCount: s.section.students.length,
      attendanceMarked: attendanceMarkedIds.has(s.id),
    }));

    const pendingClasswork = sessions
      .filter((s) => !classworkPostedIds.has(s.id))
      .map((s) => `${s.subject.name} — ${s.section.class.name}${s.section.name}`);
    const pendingHomework = sessions
      .filter((s) => !homeworkPostedIds.has(s.id))
      .map((s) => `${s.subject.name} — ${s.section.class.name}${s.section.name}`);

    return { date: today.toISOString().slice(0, 10), todaysClasses, pendingClasswork, pendingHomework };
  }

  async parentToday(schoolId: string, studentId: string) {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = endOfDay(now);
    const todaySchemaDay = schemaDayOfWeek(now);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: { section: true },
    });
    if (!student) return null;

    const [todaysSessions, attendanceRows, upcomingHomework, outstandingInvoices] = await Promise.all([
      student.sectionId
        ? this.prisma.classSession.findMany({
            where: { sectionId: student.sectionId, dayOfWeek: todaySchemaDay },
            include: { subject: true },
            orderBy: { startTime: 'asc' },
          })
        : Promise.resolve([]),
      this.prisma.attendance.findMany({
        where: { studentId, date: { gte: thirtyDaysAgo } },
        select: { status: true },
      }),
      student.sectionId
        ? this.prisma.homework.findMany({
            where: { classSession: { sectionId: student.sectionId }, dueDate: { gte: today } },
            include: { classSession: { include: { subject: true } } },
            orderBy: { dueDate: 'asc' },
            take: 10,
          })
        : Promise.resolve([]),
      this.prisma.invoice.findMany({
        where: { studentId, status: { in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] } },
      }),
    ]);

    const attendancePct =
      attendanceRows.length === 0
        ? null
        : Math.round(
            (attendanceRows.filter((a) => a.status === AttendanceStatus.PRESENT).length / attendanceRows.length) * 100,
          );

    const feesDue = outstandingInvoices.reduce(
      (sum, inv) => sum + (Number(inv.amountDue) - Number(inv.amountPaid)),
      0,
    );

    return {
      date: today.toISOString().slice(0, 10),
      student: { id: student.id, firstName: student.firstName, lastName: student.lastName },
      attendancePctLast30Days: attendancePct,
      feesDue,
      todaysTimetable: todaysSessions.map((s) => ({
        subject: s.subject.name,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
      upcomingHomework: upcomingHomework.map((h) => ({
        subject: h.classSession.subject.name,
        title: h.title,
        dueDate: h.dueDate.toISOString().slice(0, 10),
      })),
    };
  }
}
