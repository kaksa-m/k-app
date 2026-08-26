import { PrismaClient, Role, AttendanceStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

// Seeds one demo school end-to-end so the MVP loop from the product plan —
// School Setup → Classes → Teachers → Students → Timetable → Attendance →
// Classwork → Homework → Announcements → Fees — has real data to click
// through in the admin app. Safe to re-run: uses upsert/find-or-create
// patterns where it matters (school slug, user emails).
async function main() {
  const passwordHash = await bcrypt.hash('password123', SALT_ROUNDS);

  const school = await prisma.school.upsert({
    where: { slug: 'green-valley' },
    update: {},
    create: { name: 'Green Valley School', slug: 'green-valley', city: 'Hyderabad' },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@greenvalley.test' },
    update: {},
    create: {
      schoolId: school.id,
      email: 'admin@greenvalley.test',
      passwordHash,
      role: Role.SCHOOL_ADMIN,
      name: 'Anita Rao',
    },
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: 'priya@greenvalley.test' },
    update: {},
    create: { schoolId: school.id, email: 'priya@greenvalley.test', passwordHash, role: Role.TEACHER },
  });
  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      schoolId: school.id,
      userId: teacherUser.id,
      firstName: 'Priya',
      lastName: 'Sharma',
      department: 'Mathematics',
      employeeCode: 'T-001',
    },
  });

  const academicYear = await prisma.academicYear.create({
    data: {
      schoolId: school.id,
      name: '2026-27',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2027-04-30'),
      isCurrent: true,
    },
  });

  const class8 = await prisma.class.create({ data: { schoolId: school.id, name: 'Class 8', order: 8 } });

  const section8A = await prisma.section.create({
    data: {
      schoolId: school.id,
      classId: class8.id,
      academicYearId: academicYear.id,
      name: 'A',
      classTeacherId: teacher.id,
    },
  });

  const mathsSubject = await prisma.subject.create({
    data: { schoolId: school.id, name: 'Mathematics', code: 'MATH' },
  });

  // Today's day-of-week in schema terms (0=Monday..6=Sunday), so the
  // seeded session actually shows up in "today's classes" when you run this.
  const jsDay = new Date().getDay();
  const todaySchemaDay = jsDay === 0 ? 6 : jsDay - 1;

  const session = await prisma.classSession.create({
    data: {
      sectionId: section8A.id,
      subjectId: mathsSubject.id,
      teacherId: teacher.id,
      dayOfWeek: todaySchemaDay,
      startTime: '09:00',
      endTime: '09:45',
      room: 'Room 12',
    },
  });

  const parentUser = await prisma.user.upsert({
    where: { email: 'parent1@greenvalley.test' },
    update: {},
    create: { schoolId: school.id, email: 'parent1@greenvalley.test', passwordHash, role: Role.PARENT },
  });
  const parent = await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: { schoolId: school.id, userId: parentUser.id, firstName: 'Ramesh', lastName: 'Kumar' },
  });

  const students = await Promise.all(
    [
      { firstName: 'Aarav', lastName: 'Kumar', rollNumber: '01', parentId: parent.id },
      { firstName: 'Diya', lastName: 'Patel', rollNumber: '02' },
      { firstName: 'Kabir', lastName: 'Singh', rollNumber: '03' },
    ].map((s) =>
      prisma.student.create({
        data: { schoolId: school.id, sectionId: section8A.id, ...s },
      }),
    ),
  );

  await prisma.attendance.createMany({
    data: [
      { classSessionId: session.id, studentId: students[0].id, date: new Date(), status: AttendanceStatus.PRESENT },
      { classSessionId: session.id, studentId: students[1].id, date: new Date(), status: AttendanceStatus.PRESENT },
      { classSessionId: session.id, studentId: students[2].id, date: new Date(), status: AttendanceStatus.ABSENT },
    ],
    skipDuplicates: true,
  });

  await prisma.classwork.create({
    data: { classSessionId: session.id, date: new Date(), summary: 'Chapter 4 — Linear Equations, Q1-Q10' },
  });

  await prisma.homework.create({
    data: {
      classSessionId: session.id,
      assignedDate: new Date(),
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      title: 'Worksheet 4B',
      description: 'Complete questions 1-15, show your working.',
    },
  });

  await prisma.announcement.create({
    data: {
      schoolId: school.id,
      title: 'Independence Day event',
      body: 'School assembly at 9am, followed by a half day.',
    },
  });

  const feeStructure = await prisma.feeStructure.create({
    data: { schoolId: school.id, name: 'Tuition — Class 8', amount: 4500, frequency: 'monthly' },
  });

  await prisma.invoice.create({
    data: {
      schoolId: school.id,
      studentId: students[0].id,
      feeStructureId: feeStructure.id,
      amountDue: 4500,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('Seed complete.');
  console.log('  School admin login:  admin@greenvalley.test / password123');
  console.log('  Teacher login:       priya@greenvalley.test / password123');
  console.log('  Parent login:        parent1@greenvalley.test / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
