import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}
  record(input: { schoolId?: string | null; userId?: string | null; action: string; entity: string; entityId?: string; metadata?: Record<string, unknown>; ipAddress?: string }) {
    return this.prisma.auditLog.create({ data: { schoolId: input.schoolId ?? null, userId: input.userId ?? null, action: input.action, entity: input.entity, entityId: input.entityId, metadata: input.metadata as any, ipAddress: input.ipAddress } });
  }
  list(schoolId: string, take = 100) { return this.prisma.auditLog.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' }, take }); }
}
