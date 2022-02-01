import { Module } from '@nestjs/common';
import { PubSubModule } from 'src/pub-sub/pub-sub.module';
import { NotificationsResolver } from './notifications.resolver';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [PubSubModule],
  exports: [NotificationsService],
  providers: [NotificationsResolver, NotificationsService],
})
export class NotificationsModule {}
