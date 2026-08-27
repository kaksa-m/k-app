import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';

// Plain, unauthenticated endpoint for host-level health checks
// (Render, uptime monitors, load balancers) — deliberately does no
// DB work so it can't report "unhealthy" just because the database
// connection pool is momentarily busy.
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return { status: 'ok', service: 'kaksam-api', time: new Date().toISOString() };
  }
}
