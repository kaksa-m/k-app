// Mirrors the shapes returned by the KAKSAM API. Kept hand-written and
// minimal rather than generated, since the API surface is still moving —
// swap for generated types (e.g. via openapi-typescript) once it's stable.

export type Role = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT' | 'ACCOUNTANT';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  schoolId: string | null;
  name: string | null;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface SchoolClass {
  id: string;
  name: string;
  order: number;
  sections?: Section[];
}

export interface Section {
  id: string;
  name: string;
  classId: string;
  academicYearId: string;
  class?: SchoolClass;
  academicYear?: AcademicYear;
  classTeacher?: Teacher | null;
  students?: Student[];
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  department: string | null;
  employeeCode: string | null;
  user: { email: string; isActive: boolean };
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string | null;
  dateOfBirth?: string | null;
  isActive: boolean;
  section?: { id: string; name: string; class: { name: string } } | null;
  parent?: { id: string; firstName: string; lastName: string; phone: string | null } | null;
}

export interface AdminDashboard {
  date: string;
  students: { present: number; total: number };
  feesCollectedToday: number;
  outstandingFees: number;
  alerts: {
    teachersMissingAttendance: number;
    studentsAbsentToday: number;
    feePaymentsOverdue: number;
    sessionsMissingClasswork: number;
  };
}

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface Subject {
  id: string;
  name: string;
  code: string | null;
  classes?: SchoolClass[];
}

export interface ClassSession {
  id: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: number; // 0=Monday..6=Sunday
  startTime: string;
  endTime: string;
  room: string | null;
  subject?: Subject;
  teacher?: Teacher;
  section?: Section & { class: SchoolClass };
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface AttendanceRosterEntry {
  studentId: string;
  firstName: string;
  lastName: string;
  rollNumber: string | null;
  status: AttendanceStatus | null;
}

export interface Classwork {
  id: string;
  classSessionId: string;
  date: string;
  summary: string;
  createdAt: string;
}

export interface Homework {
  id: string;
  classSessionId: string;
  assignedDate: string;
  dueDate: string;
  title: string;
  description: string | null;
}

export type AnnouncementAudience = 'SCHOOL_WIDE' | 'SECTION' | 'STAFF_ONLY';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  sectionId: string | null;
  createdAt: string;
}

// Days of the week in schema order (0=Monday..6=Sunday) — used to render
// the dayOfWeek picker consistently across Attendance/Classwork/Homework forms.
export const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export type FeeStructure = {
  id: string;
  name: string;
  amount: number | string;
  frequency: string;
  schoolId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Invoice = {
  id: string;
  invoiceNumber?: string;
  studentId: string;
  student: Student;
  feeStructureId?: string;
  feeStructure: FeeStructure;
  amountDue: number | string;
  amountPaid: number | string;
  dueDate: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PlatformOverview = {
  schools: number;
  users: number;
  students: number;
  outstandingFees: number;
};

export type SchoolSummary = {
  id: string;
  name: string;
  slug: string;
  city?: string | null;
  timezone: string;
  createdAt?: string;
  counts: {
    users: number;
    students: number;
    teachers: number;
    invoices: number;
  };
  admin: {
    id: string;
    name: string;
    email: string;
  } | null;
};
