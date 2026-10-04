import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 });
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, readAt: null } }).then((count) => ({ count }));
  }

  async markRead(userId: string, id: string) {
    const n = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!n) throw new NotFoundException('Notification not found.');
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  async createForUsers(userIds: string[], input: { schoolId?: string | null; type?: NotificationType; title: string; body: string }) {
    if (!userIds.length) return { count: 0 };
    return this.prisma.notification.createMany({ data: userIds.map((userId) => ({ userId, schoolId: input.schoolId ?? null, type: input.type ?? NotificationType.SYSTEM, title: input.title, body: input.body })) });
  }
}
