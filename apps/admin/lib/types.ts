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
  section?: { name: string; class: { name: string } } | null;
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
