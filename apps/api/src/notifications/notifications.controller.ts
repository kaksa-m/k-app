import { Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private service: NotificationsService) {}
  @Get() list(@CurrentUser() user: AuthenticatedUser) { return this.service.list(user.userId); }
  @Get('unread-count') unread(@CurrentUser() user: AuthenticatedUser) { return this.service.unreadCount(user.userId); }
  @Post(':id/read') read(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return this.service.markRead(user.userId, id); }
}
