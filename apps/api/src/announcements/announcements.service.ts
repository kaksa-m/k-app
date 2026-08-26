import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  create(schoolId: string, dto: CreateAnnouncementDto) {
    return this.prisma.announcement.create({ data: { ...dto, schoolId } });
  }

  findAll(schoolId: string) {
    return this.prisma.announcement.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async remove(schoolId: string, id: string) {
    const record = await this.prisma.announcement.findFirst({ where: { id, schoolId } });
    if (!record) throw new NotFoundException('Announcement not found.');
    await this.prisma.announcement.delete({ where: { id } });
    return { success: true };
  }
}
