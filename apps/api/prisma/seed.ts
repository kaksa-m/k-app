import { PrismaClient, Role, AttendanceStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

// Seeds one demo school end-to-end so the MVP loop from the product plan —
// School Setup → Classes → Teachers → Students → Timetable → Attendance →
// Classwork → Homework → Announcements → Fees — has real data to click
// through in the admin app.
//
// Safe to re-run:
// - Demo account passwords are reset on every seed.
// - School is identified by slug.
// - Users are identified by email.
// - Teachers/parents are identified by their user.
// - Academic year/class/section/subject/session use find-or-create patterns.
// - Student demo records are identified by school + roll number.
// - Content records use stable identifying fields where appropriate.
async function main() {
  const passwordHash = await bcrypt.hash('password123', SALT_ROUNDS);

  // ---------------------------------------------------------------------------
  // SUPER ADMIN
  // ---------------------------------------------------------------------------

  await prisma.user.upsert({
    where: { email: 'superadmin@kaksam.test' },
    update: {
      passwordHash,
      role: Role.SUPER_ADMIN,
      name: 'KAKSAM Platform Admin',
      isActive: true,
      schoolId: null,
    },
    create: {
      email: 'superadmin@kaksam.test',
      passwordHash,
      role: Role.SUPER_ADMIN,
      name: 'KAKSAM Platform Admin',
      isActive: true,
      schoolId: null,
    },
  });

  // ---------------------------------------------------------------------------
  // SCHOOL
  // ---------------------------------------------------------------------------

  const school = await prisma.school.upsert({
    where: { slug: 'green-valley' },
    update: {},
    create: {
      name: 'Green Valley School',
      slug: 'green-valley',
      city: 'Hyderabad',
    },
  });

  // ---------------------------------------------------------------------------
  // SCHOOL ADMIN
  // ---------------------------------------------------------------------------

  await prisma.user.upsert({
    where: { email: 'admin@greenvalley.test' },
    update: {
      schoolId: school.id,
      passwordHash,
      role: Role.SCHOOL_ADMIN,
      name: 'Anita Rao',
      isActive: true,
    },
    create: {
      schoolId: school.id,
      email: 'admin@greenvalley.test',
      passwordHash,
      role: Role.SCHOOL_ADMIN,
      name: 'Anita Rao',
      isActive: true,
    },
  });

  // ---------------------------------------------------------------------------
  // TEACHER
  // ---------------------------------------------------------------------------

  const teacherUser = await prisma.user.upsert({
    where: { email: 'priya@greenvalley.test' },
    update: {
      schoolId: school.id,
      passwordHash,
      role: Role.TEACHER,
      name: 'Priya Sharma',
      isActive: true,
    },
    create: {
      schoolId: school.id,
      email: 'priya@greenvalley.test',
      passwordHash,
      role: Role.TEACHER,
      name: 'Priya Sharma',
      isActive: true,
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {
      schoolId: school.id,
      firstName: 'Priya',
      lastName: 'Sharma',
      department: 'Mathematics',
      employeeCode: 'T-001',
    },
    create: {
      schoolId: school.id,
      userId: teacherUser.id,
      firstName: 'Priya',
      lastName: 'Sharma',
      department: 'Mathematics',
      employeeCode: 'T-001',
    },
  });

  // ---------------------------------------------------------------------------
  // ACADEMIC YEAR
  // ---------------------------------------------------------------------------

  const academicYear =
    (await prisma.academicYear.findFirst({
      where: { schoolId: school.id, name: '2026-27' },
    })) ??
    (await prisma.academicYear.create({
      data: {
        schoolId: school.id,
        name: '2026-27',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-04-30'),
        isCurrent: true,
      },
    }));

  await prisma.academicYear.updateMany({
    where: { schoolId: school.id, id: { not: academicYear.id } },
    data: { isCurrent: false },
  });
  await prisma.academicYear.update({
    where: { id: academicYear.id },
    data: { isCurrent: true },
  });

  // ---------------------------------------------------------------------------
  // CLASS
  // ---------------------------------------------------------------------------

  const class8 =
    (await prisma.class.findFirst({
      where: { schoolId: school.id, name: 'Class 8' },
    })) ??
    (await prisma.class.create({
      data: { schoolId: school.id, name: 'Class 8', order: 8 },
    }));

  // ---------------------------------------------------------------------------
  // SECTION
  // ---------------------------------------------------------------------------

  const section8A =
    (await prisma.section.findFirst({
      where: {
        schoolId: school.id,
        classId: class8.id,
        academicYearId: academicYear.id,
        name: 'A',
      },
    })) ??
    (await prisma.section.create({
      data: {
        schoolId: school.id,
        classId: class8.id,
        academicYearId: academicYear.id,
        name: 'A',
        classTeacherId: teacher.id,
      },
    }));

  await prisma.section.update({
    where: { id: section8A.id },
    data: { classTeacherId: teacher.id },
  });

  // ---------------------------------------------------------------------------
  // SUBJECT
  // ---------------------------------------------------------------------------

  const mathsSubject =
    (await prisma.subject.findFirst({
      where: { schoolId: school.id, name: 'Mathematics' },
    })) ??
    (await prisma.subject.create({
      data: { schoolId: school.id, name: 'Mathematics', code: 'MATH' },
    }));

  await prisma.class.update({
    where: { id: class8.id },
    data: { subjects: { connect: { id: mathsSubject.id } } },
  });

  // ---------------------------------------------------------------------------
  // TODAY'S CLASS SESSION
  // ---------------------------------------------------------------------------

  // Schema day-of-week: 0 = Monday ... 6 = Sunday.
  const jsDay = new Date().getDay();
  const todaySchemaDay = jsDay === 0 ? 6 : jsDay - 1;

  const session =
    (await prisma.classSession.findFirst({
      where: {
        sectionId: section8A.id,
        subjectId: mathsSubject.id,
        teacherId: teacher.id,
        dayOfWeek: todaySchemaDay,
        startTime: '09:00',
        endTime: '09:45',
      },
    })) ??
    (await prisma.classSession.create({
      data: {
        sectionId: section8A.id,
        subjectId: mathsSubject.id,
        teacherId: teacher.id,
        dayOfWeek: todaySchemaDay,
        startTime: '09:00',
        endTime: '09:45',
        room: 'Room 12',
      },
    }));

  // ---------------------------------------------------------------------------
  // PARENT
  // ---------------------------------------------------------------------------

  const parentUser = await prisma.user.upsert({
    where: { email: 'parent1@greenvalley.test' },
    update: {
      schoolId: school.id,
      passwordHash,
      role: Role.PARENT,
      name: 'Ramesh Kumar',
      isActive: true,
    },
    create: {
      schoolId: school.id,
      email: 'parent1@greenvalley.test',
      passwordHash,
      role: Role.PARENT,
      name: 'Ramesh Kumar',
      isActive: true,
    },
  });

  const parent = await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: {
      schoolId: school.id,
      firstName: 'Ramesh',
      lastName: 'Kumar',
    },
    create: {
      schoolId: school.id,
      userId: parentUser.id,
      firstName: 'Ramesh',
      lastName: 'Kumar',
    },
  });

  // ---------------------------------------------------------------------------
  // STUDENTS
  // ---------------------------------------------------------------------------

  const studentSeeds = [
    { firstName: 'Aarav', lastName: 'Kumar', rollNumber: '01', parentId: parent.id },
    { firstName: 'Diya', lastName: 'Patel', rollNumber: '02', parentId: undefined },
    { firstName: 'Kabir', lastName: 'Singh', rollNumber: '03', parentId: undefined },
  ];

  const students = await Promise.all(
    studentSeeds.map(async (studentSeed) => {
      const existing = await prisma.student.findFirst({
        where: { schoolId: school.id, rollNumber: studentSeed.rollNumber },
      });

      if (existing) {
        return prisma.student.update({
          where: { id: existing.id },
          data: {
            firstName: studentSeed.firstName,
            lastName: studentSeed.lastName,
            rollNumber: studentSeed.rollNumber,
            parentId: studentSeed.parentId,
            sectionId: section8A.id,
            schoolId: school.id,
          },
        });
      }

      return prisma.student.create({
        data: {
          schoolId: school.id,
          sectionId: section8A.id,
          ...studentSeed,
        },
      });
    }),
  );

  // ---------------------------------------------------------------------------
  // ATTENDANCE
  // ---------------------------------------------------------------------------

  await prisma.attendance.createMany({
    data: [
      {
        classSessionId: session.id,
        studentId: students[0].id,
        date: new Date(),
        status: AttendanceStatus.PRESENT,
      },
      {
        classSessionId: session.id,
        studentId: students[1].id,
        date: new Date(),
        status: AttendanceStatus.PRESENT,
      },
      {
        classSessionId: session.id,
        studentId: students[2].id,
        date: new Date(),
        status: AttendanceStatus.ABSENT,
      },
    ],
    skipDuplicates: true,
  });

  // ---------------------------------------------------------------------------
  // CLASSWORK
  // ---------------------------------------------------------------------------

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const classwork = await prisma.classwork.findFirst({
    where: {
      classSessionId: session.id,
      date: today,
      summary: 'Chapter 4 — Linear Equations, Q1-Q10',
    },
  });

  if (!classwork) {
    await prisma.classwork.create({
      data: {
        classSessionId: session.id,
        date: today,
        summary: 'Chapter 4 — Linear Equations, Q1-Q10',
      },
    });
  }

  // ---------------------------------------------------------------------------
  // HOMEWORK
  // ---------------------------------------------------------------------------

  const dueDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

  const homework = await prisma.homework.findFirst({
    where: {
      classSessionId: session.id,
      assignedDate: today,
      title: 'Worksheet 4B',
    },
  });

  if (!homework) {
    await prisma.homework.create({
      data: {
        classSessionId: session.id,
        assignedDate: today,
        dueDate,
        title: 'Worksheet 4B',
        description: 'Complete questions 1-15, show your working.',
      },
    });
  }

  // ---------------------------------------------------------------------------
  // ANNOUNCEMENT
  // ---------------------------------------------------------------------------

  const announcement = await prisma.announcement.findFirst({
    where: { schoolId: school.id, title: 'Independence Day event' },
  });

  if (!announcement) {
    await prisma.announcement.create({
      data: {
        schoolId: school.id,
        title: 'Independence Day event',
        body: 'School assembly at 9am, followed by a half day.',
      },
    });
  }

  // ---------------------------------------------------------------------------
  // FEE STRUCTURE
  // ---------------------------------------------------------------------------

  const feeStructure =
    (await prisma.feeStructure.findFirst({
      where: { schoolId: school.id, name: 'Tuition — Class 8' },
    })) ??
    (await prisma.feeStructure.create({
      data: {
        schoolId: school.id,
        name: 'Tuition — Class 8',
        amount: 4500,
        frequency: 'monthly',
      },
    }));

  // ---------------------------------------------------------------------------
  // INVOICE
  // ---------------------------------------------------------------------------

  const invoice = await prisma.invoice.findFirst({
    where: {
      schoolId: school.id,
      studentId: students[0].id,
      feeStructureId: feeStructure.id,
    },
  });

  if (!invoice) {
    await prisma.invoice.create({
      data: {
        schoolId: school.id,
        studentId: students[0].id,
        feeStructureId: feeStructure.id,
        amountDue: 4500,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------

  console.log('');
  console.log('==============================================');
  console.log('KAKSAM seed complete');
  console.log('==============================================');
  console.log('');
  console.log('Super admin:');
  console.log('  superadmin@kaksam.test / password123');
  console.log('');
  console.log('School admin:');
  console.log('  admin@greenvalley.test / password123');
  console.log('');
  console.log('Teacher:');
  console.log('  priya@greenvalley.test / password123');
  console.log('');
  console.log('Parent:');
  console.log('  parent1@greenvalley.test / password123');
  console.log('');
  console.log(`School: ${school.name} (${school.slug})`);
  console.log('==============================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
