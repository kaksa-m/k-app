import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';

const SALT_ROUNDS = 12;

@Injectable()
export class ParentsService {
  constructor(private prisma: PrismaService) {}

  private async ensureEmailAvailable(email: string, excludeUserId?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (user && user.id !== excludeUserId) {
      throw new ConflictException('A user with this email already exists.');
    }
  }

  async create(schoolId: string, dto: CreateParentDto) {
    const email = dto.email.trim().toLowerCase();
    await this.ensureEmailAvailable(email);

    const password = dto.password?.trim() || 'password123';
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const parent = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          schoolId,
          email,
          passwordHash,
          role: Role.PARENT,
          name: `${dto.firstName.trim()} ${dto.lastName.trim()}`,
          isActive: true,
        },
      });

      return tx.parent.create({
        data: {
          schoolId,
          userId: user.id,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          phone: dto.phone?.trim() || undefined,
        },
        include: {
          students: {
            select: { id: true, firstName: true, lastName: true, rollNumber: true, isActive: true },
          },
          user: { select: { id: true, email: true, isActive: true } },
        },
      });
    });

    return parent;
  }

  findAll(schoolId: string, q?: string) {
    const query = q?.trim();
    return this.prisma.parent.findMany({
      where: {
        schoolId,
        ...(query
          ? {
              OR: [
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query, mode: 'insensitive' } },
                { user: { email: { contains: query, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: {
        user: { select: { id: true, email: true, isActive: true } },
        students: {
          select: { id: true, firstName: true, lastName: true, rollNumber: true, isActive: true },
          orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
  }

  async findOne(schoolId: string, id: string) {
    const parent = await this.prisma.parent.findFirst({
      where: { id, schoolId },
      include: {
        user: { select: { id: true, email: true, isActive: true } },
        students: {
          include: { section: { include: { class: true } } },
          orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        },
      },
    });
    if (!parent) throw new NotFoundException('Parent not found.');
    return parent;
  }

  async update(schoolId: string, id: string, dto: UpdateParentDto) {
    const current = await this.findOne(schoolId, id);
    const email = dto.email?.trim().toLowerCase();

    if (email) await this.ensureEmailAvailable(email, current.userId);

    const userData: Record<string, unknown> = {};
    if (email) userData.email = email;
    if (dto.firstName !== undefined || dto.lastName !== undefined) {
      const firstName = dto.firstName?.trim() ?? current.firstName;
      const lastName = dto.lastName?.trim() ?? current.lastName;
      userData.name = `${firstName} ${lastName}`;
    }
    if (dto.password?.trim()) {
      userData.passwordHash = await bcrypt.hash(dto.password.trim(), SALT_ROUNDS);
    }

    return this.prisma.$transaction(async (tx) => {
      if (Object.keys(userData).length > 0) {
        await tx.user.update({ where: { id: current.userId }, data: userData });
      }

      return tx.parent.update({
        where: { id },
        data: {
          ...(dto.firstName !== undefined ? { firstName: dto.firstName.trim() } : {}),
          ...(dto.lastName !== undefined ? { lastName: dto.lastName.trim() } : {}),
          ...(dto.phone !== undefined ? { phone: dto.phone.trim() || null } : {}),
        },
        include: {
          user: { select: { id: true, email: true, isActive: true } },
          students: { select: { id: true, firstName: true, lastName: true, rollNumber: true, isActive: true } },
        },
      });
    });
  }

  async setActive(schoolId: string, id: string, isActive: boolean) {
    const parent = await this.findOne(schoolId, id);
    await this.prisma.user.update({ where: { id: parent.userId }, data: { isActive } });
    return this.findOne(schoolId, id);
  }

  async remove(schoolId: string, id: string) {
    const parent = await this.findOne(schoolId, id);
    if (parent.students.length > 0) {
      throw new ForbiddenException('Remove this parent from all students before deleting the parent account.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.parent.delete({ where: { id } });
      await tx.user.delete({ where: { id: parent.userId } });
    });

    return { success: true };
  }
}
