import { Resolver, Subscription } from '@nestjs/graphql';
import { Notification } from './dto/notification';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { Inject } from '@nestjs/common';

@Resolver(() => Notification)
export class NotificationsResolver {
  constructor(
    @Inject('PUB_SUB')
    private pubSub: RedisPubSub,
  ) {}

  @Subscription(() => Notification)
  newNotification() {
    return this.pubSub.asyncIterator('newNotification');
  }
}
