import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// A single shared Prisma client, injected wherever a module needs DB access.
// Multi-tenancy is enforced per-query (every resource service filters by
// schoolId taken from the authenticated user) rather than via separate
// databases — see the README for the reasoning.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
