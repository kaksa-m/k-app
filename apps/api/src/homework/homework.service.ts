import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';

@Injectable()
export class HomeworkService {
  constructor(private prisma: PrismaService) {}

  async create(schoolId: string, dto: CreateHomeworkDto) {
    const session = await this.prisma.classSession.findFirst({
      where: { id: dto.classSessionId, section: { schoolId } },
    });
    if (!session) throw new ForbiddenException('Class session does not belong to your school.');

    return this.prisma.homework.create({
      data: {
        ...dto,
        assignedDate: new Date(dto.assignedDate),
        dueDate: new Date(dto.dueDate),
      },
    });
  }

  forSession(schoolId: string, classSessionId: string) {
    return this.prisma.homework.findMany({
      where: { classSessionId, classSession: { section: { schoolId } } },
      orderBy: { dueDate: 'desc' },
    });
  }

  // Powers the student/parent "homework due" view — everything due
  // for a section between two dates (defaults to "still open").
  forSectionDueBetween(schoolId: string, sectionId: string, from: Date, to: Date) {
    return this.prisma.homework.findMany({
      where: {
        classSession: { sectionId, section: { schoolId } },
        dueDate: { gte: from, lte: to },
      },
      include: { classSession: { include: { subject: true } } },
      orderBy: { dueDate: 'asc' },
    });
  }

  async remove(schoolId: string, id: string) {
    const record = await this.prisma.homework.findFirst({
      where: { id, classSession: { section: { schoolId } } },
    });
    if (!record) throw new NotFoundException('Homework entry not found.');
    await this.prisma.homework.delete({ where: { id } });
    return { success: true };
  }
}
