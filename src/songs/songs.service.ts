import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as dayjs from 'dayjs';
import { LessThan, MoreThan, MoreThanOrEqual, Repository } from 'typeorm';
import { NewSongInput } from './dto/new-song.input';
import { Song } from './entity/song.entity';
import { RedisPubSub } from 'graphql-redis-subscriptions';

@Injectable()
export class SongsService {
  constructor(
    @InjectRepository(Song)
    private readonly songsRepository: Repository<Song>,
    @Inject('PUB_SUB')
    private pubSub: RedisPubSub,
  ) {}

  async songs(): Promise<Song[]> {
    return this.songsRepository.find({
      where: {
        endTime: MoreThan(dayjs().toISOString()),
      },
    });
  }

  async history(endTime?: string): Promise<Song[]> {
    return this.songsRepository.find({
      where: {
        endTime: endTime ? LessThan(endTime) : LessThan(dayjs().toISOString()),
      },
      take: 100,
      order: {
        id: 'DESC',
      },
    });
  }

  async current(): Promise<Song> {
    return this.songsRepository.find({
      order: {
        id: 'DESC',
      },
      take: 1,
    })[0];
  }

  async last(take: number): Promise<Song[]> {
    return this.songsRepository.find({
      order: {
        id: 'DESC',
      },
      take: take,
    });
  }

  async last60min(): Promise<Song[]> {
    return this.songsRepository.find({
      where: {
        startTime: MoreThanOrEqual(dayjs().subtract(60, 'minute')),
      },
    });
  }

  async skip(): Promise<boolean> {
    try {
      const [songToDelete, ...songs] = await this.songs();

      await this.songsRepository.delete(songToDelete.id);

      if (!songs.length) return true;

      const updatedSongs = songs.reduce<Song[]>(
        (prevValue, currentSong, index) => {
          return [
            ...prevValue,
            {
              ...currentSong,
              startTime:
                index === 0
                  ? (dayjs() as unknown as Date)
                  : (dayjs(prevValue[index - 1].endTime) as unknown as Date),
              endTime:
                index === 0
                  ? (dayjs().add(
                      currentSong.lengthSeconds,
                      'second',
                    ) as unknown as Date)
                  : (dayjs(dayjs(prevValue[index - 1].endTime)).add(
                      currentSong.lengthSeconds,
                      'second',
                    ) as unknown as Date),
            },
          ];
        },
        [],
      );

      await this.songsRepository.save(updatedSongs);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async create(newSongData: NewSongInput): Promise<Song> {
    const song = await this.songsRepository.save(newSongData);
    this.pubSub.publish('songAdded', {
      songAdded: song,
    });
    return song;
  }
}
