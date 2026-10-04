import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { Role } from '@prisma/client';

function audienceWhere(audience: any, schoolId: string, sectionId?: string) {
  if (audience === 'STAFF_ONLY') return { schoolId, isActive: true, role: { in: ['SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT'] } };
  if (audience === 'SECTION') return { schoolId, isActive: true, OR: [{ role: 'SCHOOL_ADMIN' }, { role: 'TEACHER' }, { student: { sectionId } }, { parent: { students: { some: { sectionId } } } }] };
  return { schoolId, isActive: true };
}

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService, private audit: AuditLogService) {}

  async create(schoolId: string, dto: CreateAnnouncementDto, actorUserId?: string) {
    if (dto.sectionId) {
      const section = await this.prisma.section.findFirst({ where: { id: dto.sectionId, schoolId }, select: { id: true } });
      if (!section) throw new ForbiddenException('Section does not belong to your school.');
    }
    if (dto.audience === 'SECTION' && !dto.sectionId) throw new ForbiddenException('Section announcements require a sectionId.');
    if (dto.audience !== 'SECTION' && dto.sectionId) throw new ForbiddenException('sectionId is only valid for SECTION announcements.');
    const announcement = await this.prisma.announcement.create({ data: { schoolId, title: dto.title.trim(), body: dto.body.trim(), audience: dto.audience, sectionId: dto.sectionId } });
    const userWhere: any = audienceWhere(dto.audience, schoolId, dto.sectionId);
    const users = await this.prisma.user.findMany({ where: userWhere, select: { id: true } });
    await this.notifications.createForUsers(users.map((u) => u.id), { schoolId, type: 'ANNOUNCEMENT', title: announcement.title, body: announcement.body });
    await this.audit.record({ schoolId, userId: actorUserId, action: 'CREATE', entity: 'Announcement', entityId: announcement.id, metadata: { audience: dto.audience, sectionId: dto.sectionId } });
    return announcement;
  }

  async findAll(schoolId: string, role: Role, userId: string) {
    if (role === Role.SCHOOL_ADMIN || role === Role.SUPER_ADMIN) {
      return this.prisma.announcement.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' }, take: 50 });
    }
    let sectionIds: string[] = [];
    if (role === Role.STUDENT) {
      const student = await this.prisma.student.findFirst({ where: { userId, schoolId }, select: { sectionId: true } });
      sectionIds = student?.sectionId ? [student.sectionId] : [];
    } else if (role === Role.PARENT) {
      const parent = await this.prisma.parent.findFirst({ where: { userId, schoolId }, include: { students: { select: { sectionId: true } } } });
      sectionIds = [...new Set((parent?.students ?? []).map((s) => s.sectionId).filter((x): x is string => Boolean(x)))];
    } else if (role === Role.TEACHER) {
      const teacher = await this.prisma.teacher.findFirst({ where: { userId, schoolId }, include: { classSessions: { select: { sectionId: true }, distinct: ['sectionId'] } } });
      sectionIds = [...new Set((teacher?.classSessions ?? []).map((s) => s.sectionId))];
    }
    const audience = role === Role.TEACHER || role === Role.ACCOUNTANT ? ['SCHOOL_WIDE', 'STAFF_ONLY'] : ['SCHOOL_WIDE'];
    return this.prisma.announcement.findMany({ where: { schoolId, OR: [{ audience: { in: audience as any } }, ...(sectionIds.length ? [{ audience: 'SECTION' as any, sectionId: { in: sectionIds } }] : [])] }, orderBy: { createdAt: 'desc' }, take: 50 });
  }

  async remove(schoolId: string, id: string, actorUserId?: string) {
    const record = await this.prisma.announcement.findFirst({ where: { id, schoolId } });
    if (!record) throw new NotFoundException('Announcement not found.');
    await this.prisma.announcement.delete({ where: { id } });
    await this.audit.record({ schoolId, userId: actorUserId, action: 'DELETE', entity: 'Announcement', entityId: id });
    return { success: true };
  }
}
