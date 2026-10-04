import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateClassSessionDto } from './dto/create-class-session.dto';
import { UpdateClassSessionDto } from './dto/update-class-session.dto';

@Injectable()
export class ClassSessionsService {
  constructor(private prisma: PrismaService) {}

  private async validateRelations(schoolId: string, dto: Partial<CreateClassSessionDto>) {
    const section = dto.sectionId
      ? await this.prisma.section.findFirst({
          where: { id: dto.sectionId, schoolId },
          select: { id: true, classId: true },
        })
      : null;
    if (dto.sectionId && !section) throw new ForbiddenException('Section does not belong to your school.');

    if (dto.subjectId) {
      const subject = await this.prisma.subject.findFirst({
        where: { id: dto.subjectId, schoolId },
        select: { id: true },
      });
      if (!subject) throw new ForbiddenException('Subject does not belong to your school.');

      const classId = section?.classId;
      if (classId) {
        const offered = await this.prisma.class.findFirst({
          where: { id: classId, schoolId, subjects: { some: { id: dto.subjectId } } },
          select: { id: true },
        });
        if (!offered) throw new ForbiddenException('Subject is not offered for this class.');
      }
    }

    if (dto.teacherId) {
      const teacher = await this.prisma.teacher.findFirst({ where: { id: dto.teacherId, schoolId }, select: { id: true } });
      if (!teacher) throw new ForbiddenException('Teacher does not belong to your school.');
    }

    if (dto.startTime && dto.endTime && dto.startTime >= dto.endTime) {
      throw new BadRequestException('endTime must be later than startTime.');
    }
  }

  private overlaps(startA: string, endA: string, startB: string, endB: string) {
    return startA < endB && endA > startB;
  }

  private async validateConflicts(
    schoolId: string,
    dto: { sectionId: string; teacherId: string; dayOfWeek: number; startTime: string; endTime: string; room?: string | null },
    excludeId?: string,
  ) {
    const sessions = await this.prisma.classSession.findMany({
      where: {
        dayOfWeek: dto.dayOfWeek,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
        OR: [
          { sectionId: dto.sectionId },
          { teacherId: dto.teacherId },
          ...(dto.room ? [{ room: dto.room }] : []),
        ],
        section: { schoolId },
      },
      select: { id: true, sectionId: true, teacherId: true, room: true, startTime: true, endTime: true },
    });

    for (const session of sessions) {
      if (!this.overlaps(dto.startTime, dto.endTime, session.startTime, session.endTime)) continue;

      if (session.sectionId === dto.sectionId) {
        throw new BadRequestException('This section already has a class scheduled during that time.');
      }
      if (session.teacherId === dto.teacherId) {
        throw new BadRequestException('This teacher already has a class scheduled during that time.');
      }
      if (dto.room && session.room === dto.room) {
        throw new BadRequestException('This room is already booked during that time.');
      }
    }
  }

  async create(schoolId: string, dto: CreateClassSessionDto) {
    await this.validateRelations(schoolId, dto);
    await this.validateConflicts(schoolId, dto);
    return this.prisma.classSession.create({ data: dto });
  }

  findForSection(schoolId: string, sectionId: string) {
    return this.prisma.classSession.findMany({
      where: { sectionId, section: { schoolId } },
      include: { subject: true, teacher: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  findForTeacher(schoolId: string, teacherId: string, dayOfWeek?: number) {
    return this.prisma.classSession.findMany({
      where: { teacherId, teacher: { schoolId }, ...(dayOfWeek !== undefined ? { dayOfWeek } : {}) },
      include: { subject: true, section: { include: { class: true } } },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async findOne(schoolId: string, id: string) {
    const session = await this.prisma.classSession.findFirst({
      where: { id, section: { schoolId } },
      include: { subject: true, teacher: true, section: { include: { class: true } } },
    });
    if (!session) throw new NotFoundException('Class session not found.');
    return session;
  }

  async update(schoolId: string, id: string, dto: UpdateClassSessionDto) {
    const current = await this.findOne(schoolId, id);
    const merged = {
      sectionId: dto.sectionId ?? current.sectionId,
      subjectId: dto.subjectId ?? current.subjectId,
      teacherId: dto.teacherId ?? current.teacherId,
      dayOfWeek: dto.dayOfWeek ?? current.dayOfWeek,
      startTime: dto.startTime ?? current.startTime,
      endTime: dto.endTime ?? current.endTime,
      room: dto.room ?? current.room,
    };
    await this.validateRelations(schoolId, merged);
    await this.validateConflicts(schoolId, merged, id);
    return this.prisma.classSession.update({ where: { id }, data: dto });
  }

  async remove(schoolId: string, id: string) {
    await this.findOne(schoolId, id);
    await this.prisma.classSession.delete({ where: { id } });
    return { success: true };
  }
}
