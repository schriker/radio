import { Args, Query, Resolver } from '@nestjs/graphql';
import { Song } from './entity/song.entity';
import { SongsService } from './songs.service';

@Resolver(() => Song)
export class SongsResolver {
  constructor(private readonly songsService: SongsService) {}

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
}
