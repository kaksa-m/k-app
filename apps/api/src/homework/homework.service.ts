import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';

@Injectable()
export class HomeworkService {
  constructor(private prisma: PrismaService) {}

  private async assertSessionAccess(schoolId: string, classSessionId: string, role: Role, userId: string) {
    const session = await this.prisma.classSession.findFirst({ where: { id: classSessionId, section: { schoolId } } });
    if (!session) throw new ForbiddenException('Class session does not belong to your school.');
    if (role === Role.TEACHER) {
      const teacher = await this.prisma.teacher.findFirst({ where: { userId, schoolId }, select: { id: true } });
      if (!teacher || teacher.id !== session.teacherId) throw new ForbiddenException('Teachers can only manage homework for their own sessions.');
    }
    return session;
  }

  async create(schoolId: string, userId: string, role: Role, dto: CreateHomeworkDto) {
    await this.assertSessionAccess(schoolId, dto.classSessionId, role, userId);
    return this.prisma.homework.create({ data: { ...dto, assignedDate: new Date(dto.assignedDate), dueDate: new Date(dto.dueDate) } });
  }

  forSession(schoolId: string, classSessionId: string) {
    return this.prisma.homework.findMany({ where: { classSessionId, classSession: { section: { schoolId } } }, orderBy: { dueDate: 'desc' } });
  }

  forSectionDueBetween(schoolId: string, sectionId: string, from: Date, to: Date) {
    return this.prisma.homework.findMany({
      where: { classSession: { sectionId, section: { schoolId } }, dueDate: { gte: from, lte: to } },
      include: { classSession: { include: { subject: true } } },
      orderBy: { dueDate: 'asc' },
    });
  }

  async remove(schoolId: string, id: string, userId: string, role: Role) {
    const record = await this.prisma.homework.findFirst({
      where: { id, classSession: { section: { schoolId } } },
      include: { classSession: true },
    });
    if (!record) throw new NotFoundException('Homework entry not found.');
    if (role === Role.TEACHER) {
      const teacher = await this.prisma.teacher.findFirst({ where: { userId, schoolId }, select: { id: true } });
      if (!teacher || teacher.id !== record.classSession.teacherId) throw new ForbiddenException('Teachers can only manage homework for their own sessions.');
    }
    await this.prisma.homework.delete({ where: { id } });
    return { success: true };
  }
}
