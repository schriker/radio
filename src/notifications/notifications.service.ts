import { Inject, Injectable } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { Notification } from './dto/notification';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject('PUB_SUB')
    private pubSub: RedisPubSub,
  ) {}

  async create(notification: Notification): Promise<void> {
    this.pubSub.publish('newNotification', {
      newNotification: notification,
    });
  }
}
