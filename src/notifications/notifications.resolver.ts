import { Resolver, Subscription } from '@nestjs/graphql';
import { NewNotificationInput } from './dto/new-notification.input';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { Inject } from '@nestjs/common';

@Resolver(() => NewNotificationInput)
export class NotificationsResolver {
  constructor(
    @Inject('PUB_SUB')
    private pubSub: RedisPubSub,
  ) {}

  @Subscription(() => NewNotificationInput)
  newNotification() {
    return this.pubSub.asyncIterator('newNotification');
  }
}
