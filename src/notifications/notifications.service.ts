import { Inject, Injectable } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { NewNotificationInput } from './dto/new-notification.input';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject('PUB_SUB')
    private pubSub: RedisPubSub,
  ) {}

  async create(notification: NewNotificationInput): Promise<void> {
    this.pubSub.publish('newNotification', {
      newNotification: notification,
    });
  }
}
