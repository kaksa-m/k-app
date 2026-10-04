import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  async create(schoolId: string, dto: CreateAnnouncementDto) {
    if (dto.sectionId) {
      const section = await this.prisma.section.findFirst({ where: { id: dto.sectionId, schoolId }, select: { id: true } });
      if (!section) throw new ForbiddenException('Section does not belong to your school.');
    }
    if (dto.audience === 'SECTION' && !dto.sectionId) {
      throw new ForbiddenException('Section announcements require a sectionId.');
    }
    if (dto.audience !== 'SECTION' && dto.sectionId) {
      throw new ForbiddenException('sectionId is only valid for SECTION announcements.');
    }
    return this.prisma.announcement.create({ data: { ...dto, schoolId } });
  }

  findAll(schoolId: string) {
    return this.prisma.announcement.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' }, take: 50 });
  }

  async remove(schoolId: string, id: string) {
    const record = await this.prisma.announcement.findFirst({ where: { id, schoolId } });
    if (!record) throw new NotFoundException('Announcement not found.');
    await this.prisma.announcement.delete({ where: { id } });
    return { success: true };
  }
}
