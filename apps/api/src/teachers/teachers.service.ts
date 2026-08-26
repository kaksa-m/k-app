import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

const SALT_ROUNDS = 12;

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async create(schoolId: string, dto: CreateTeacherDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('A user with this email already exists.');

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { schoolId, email: dto.email, passwordHash, role: Role.TEACHER },
      });
      return tx.teacher.create({
        data: {
          schoolId,
          userId: user.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          department: dto.department,
          employeeCode: dto.employeeCode,
        },
      });
    });
  }

  findAll(schoolId: string) {
    return this.prisma.teacher.findMany({
      where: { schoolId },
      include: { user: { select: { email: true, isActive: true } } },
      orderBy: { firstName: 'asc' },
    });
  }

  async findOne(schoolId: string, id: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id, schoolId },
      include: {
        user: { select: { email: true, isActive: true } },
        classSessions: { include: { subject: true, section: { include: { class: true } } } },
      },
    });
    if (!teacher) throw new NotFoundException('Teacher not found.');
    return teacher;
  }

  async update(schoolId: string, id: string, dto: UpdateTeacherDto) {
    await this.findOne(schoolId, id);
    return this.prisma.teacher.update({ where: { id }, data: dto });
  }

  // Deactivates the login rather than hard-deleting — preserves attendance
  // and classwork history that references this teacher.
  async remove(schoolId: string, id: string) {
    const teacher = await this.findOne(schoolId, id);
    await this.prisma.user.update({ where: { id: teacher.userId }, data: { isActive: false } });
    return { success: true };
  }
}
