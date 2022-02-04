import { Inject } from '@nestjs/common';
import { Args, Query, Resolver, Subscription } from '@nestjs/graphql';
import { Song } from './entity/song.entity';
import { SongsService } from './songs.service';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { SongHistoryInput } from './dto/song-history.input';

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
    @Args('songHistoryInput', { nullable: true })
    songHistoryInput?: SongHistoryInput,
  ): Promise<Song[]> {
    return this.songsService.history(songHistoryInput);
  }

  @Subscription(() => Song)
  songAdded() {
    return this.pubSub.asyncIterator('songAdded');
  }

  @Subscription(() => Song)
  songSkipped() {
    return this.pubSub.asyncIterator('songSkipped');
  }
}
