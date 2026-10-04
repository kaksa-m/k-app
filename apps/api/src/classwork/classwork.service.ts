import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateClassworkDto } from './dto/create-classwork.dto';

@Injectable()
export class ClassworkService {
  constructor(private prisma: PrismaService) {}

  private async assertSessionAccess(schoolId: string, classSessionId: string, role: Role, userId: string) {
    const session = await this.prisma.classSession.findFirst({ where: { id: classSessionId, section: { schoolId } } });
    if (!session) throw new ForbiddenException('Class session does not belong to your school.');
    if (role === Role.TEACHER) {
      const teacher = await this.prisma.teacher.findFirst({ where: { userId, schoolId }, select: { id: true } });
      if (!teacher || teacher.id !== session.teacherId) throw new ForbiddenException('Teachers can only manage classwork for their own sessions.');
    }
    return session;
  }

  async create(schoolId: string, userId: string, role: Role, dto: CreateClassworkDto) {
    await this.assertSessionAccess(schoolId, dto.classSessionId, role, userId);
    return this.prisma.classwork.create({ data: { ...dto, date: new Date(dto.date) } });
  }

  forSession(schoolId: string, classSessionId: string) {
    return this.prisma.classwork.findMany({ where: { classSessionId, classSession: { section: { schoolId } } }, orderBy: { date: 'desc' } });
  }

  async remove(schoolId: string, id: string, userId: string, role: Role) {
    const record = await this.prisma.classwork.findFirst({
      where: { id, classSession: { section: { schoolId } } },
      include: { classSession: true },
    });
    if (!record) throw new NotFoundException('Classwork entry not found.');
    if (role === Role.TEACHER) {
      const teacher = await this.prisma.teacher.findFirst({ where: { userId, schoolId }, select: { id: true } });
      if (!teacher || teacher.id !== record.classSession.teacherId) throw new ForbiddenException('Teachers can only manage classwork for their own sessions.');
    }
    await this.prisma.classwork.delete({ where: { id } });
    return { success: true };
  }
}
