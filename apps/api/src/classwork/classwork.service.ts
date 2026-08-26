import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateClassworkDto } from './dto/create-classwork.dto';

@Injectable()
export class ClassworkService {
  constructor(private prisma: PrismaService) {}

  async create(schoolId: string, dto: CreateClassworkDto) {
    const session = await this.prisma.classSession.findFirst({
      where: { id: dto.classSessionId, section: { schoolId } },
    });
    if (!session) throw new ForbiddenException('Class session does not belong to your school.');

    return this.prisma.classwork.create({
      data: { ...dto, date: new Date(dto.date) },
    });
  }

  forSession(schoolId: string, classSessionId: string) {
    return this.prisma.classwork.findMany({
      where: { classSessionId, classSession: { section: { schoolId } } },
      orderBy: { date: 'desc' },
    });
  }

  async remove(schoolId: string, id: string) {
    const record = await this.prisma.classwork.findFirst({
      where: { id, classSession: { section: { schoolId } } },
    });
    if (!record) throw new NotFoundException('Classwork entry not found.');
    await this.prisma.classwork.delete({ where: { id } });
    return { success: true };
  }
}
