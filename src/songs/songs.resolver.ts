import { Inject } from '@nestjs/common';
import { Args, Query, Resolver, Subscription } from '@nestjs/graphql';
import { Song } from './entity/song.entity';
import { SongsService } from './songs.service';
import { RedisPubSub } from 'graphql-redis-subscriptions';

@Resolver(() => Song)
export class SongsResolver {
  constructor(
    private songsService: SongsService,
    @Inject('PUB_SUB')
    private pubSub: RedisPubSub,
  ) {}

  @Query(() => [Song])
  songs(): Promise<Song[]> {
    return this.songsService.songs();
  }

  @Query(() => [Song])
  songsHistory(
    @Args('endTime', { nullable: true }) endTime?: string,
  ): Promise<Song[]> {
    return this.songsService.history(endTime);
  }

  @Subscription(() => Song)
  songAdded() {
    return this.pubSub.asyncIterator('songAdded');
  }
}
