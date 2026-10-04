import { ConflictException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSchoolDto } from './dto/create-school.dto';

const SALT_ROUNDS = 12;

@Injectable()
export class PlatformService {
  constructor(private prisma: PrismaService) {}

  async overview() {
    const [schools, users, students, invoices] = await Promise.all([
      this.prisma.school.count(),
      this.prisma.user.count({ where: { role: { not: Role.SUPER_ADMIN } } }),
      this.prisma.student.count({ where: { isActive: true } }),
      this.prisma.invoice.aggregate({ _sum: { amountDue: true, amountPaid: true } }),
    ]);

    return {
      schools,
      users,
      students,
      outstandingFees: Number(invoices._sum.amountDue ?? 0) - Number(invoices._sum.amountPaid ?? 0),
    };
  }

  async listSchools() {
    const schools = await this.prisma.school.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { users: true, students: true, teachers: true, invoices: true } },
        users: {
          where: { role: Role.SCHOOL_ADMIN, isActive: true },
          select: { id: true, name: true, email: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    return schools.map((school) => ({
      id: school.id,
      name: school.name,
      slug: school.slug,
      city: school.city,
      timezone: school.timezone,
      createdAt: school.createdAt,
      counts: school._count,
      admin: school.users[0] ?? null,
    }));
  }

  async getSchool(id: string) {
    return this.prisma.school.findUniqueOrThrow({
      where: { id },
      include: {
        _count: { select: { users: true, students: true, teachers: true, invoices: true } },
        users: {
          where: { role: Role.SCHOOL_ADMIN },
          select: { id: true, name: true, email: true, isActive: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async createSchool(dto: CreateSchoolDto) {
    const [slug, email] = await Promise.all([
      this.prisma.school.findUnique({ where: { slug: dto.schoolSlug } }),
      this.prisma.user.findUnique({ where: { email: dto.adminEmail } }),
    ]);
    if (slug) throw new ConflictException('A school with this slug already exists.');
    if (email) throw new ConflictException('A user with this email already exists.');

    const passwordHash = await bcrypt.hash(dto.adminPassword, SALT_ROUNDS);
    return this.prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          name: dto.schoolName,
          slug: dto.schoolSlug,
          city: dto.city,
          timezone: dto.timezone || 'Asia/Kolkata',
        },
      });
      const admin = await tx.user.create({
        data: {
          schoolId: school.id,
          email: dto.adminEmail,
          passwordHash,
          role: Role.SCHOOL_ADMIN,
          name: dto.adminName,
        },
      });
      return { school, admin: { id: admin.id, email: admin.email, name: admin.name } };
    });
  }
}
