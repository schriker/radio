import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as dayjs from 'dayjs';
import { MoreThan, MoreThanOrEqual, Repository } from 'typeorm';
import { NewSongInput } from './dto/new-song.input';
import { Song } from './entity/song.entity';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { SongHistoryInput } from './dto/song-history.input';
import { getRandomIntInclusive } from 'src/utils/random';

@Injectable()
export class SongsService {
  constructor(
    @InjectRepository(Song)
    private songsRepository: Repository<Song>,
    @Inject('PUB_SUB')
    private pubSub: RedisPubSub,
  ) {}

  async songs(): Promise<Song[]> {
    return await this.songsRepository
      .createQueryBuilder('song')
      .where('song.endTime > :value', { value: dayjs().toISOString() })
      .orderBy('song.startTime', 'ASC')
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(DISTINCT song_count.id)')
          .from(Song, 'song_count')
          .where('song_count.videoId = song.videoId');
      }, 'song_count')

      .groupBy('song.id')
      .getMany();
  }

  async random(): Promise<Song> {
    const count = await this.songsRepository.count();
    const randomId = getRandomIntInclusive(1, count);
    return await this.songsRepository
      .createQueryBuilder('song')
      .where('song.id = :id', {
        id: randomId,
      })
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(DISTINCT song_count.id)')
          .from(Song, 'song_count')
          .where('song_count.videoId = song.videoId');
      }, 'song_count')
      .groupBy('song.id')
      .getOne();
  }

  async history({ endTime, user }: SongHistoryInput): Promise<Song[]> {
    const where = user
      ? 'song.endTime < :value AND song.user ilike :user'
      : 'song.endTime < :value';

    return await this.songsRepository
      .createQueryBuilder('song')
      .where(where, {
        value: endTime ? endTime : dayjs().toISOString(),
        user: `${user}%`,
      })
      .orderBy('song.startTime', 'DESC')
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(DISTINCT song_count.id)')
          .from(Song, 'song_count')
          .where('song_count.videoId = song.videoId');
      }, 'song_count')

      .groupBy('song.id')
      .take(50)
      .getMany();
  }

  async current(): Promise<Song[]> {
    return this.songsRepository.find({
      where: {
        endTime: MoreThan(dayjs().toISOString()),
      },
      order: {
        startTime: 'ASC',
      },
      take: 1,
    });
  }

  async last(take: number): Promise<Song[]> {
    return this.songsRepository.find({
      order: {
        startTime: 'DESC',
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

      if (!songs.length) {
        this.pubSub.publish('songSkipped', {
          songSkipped: songToDelete,
        });
        return true;
      }

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
      this.pubSub.publish('songSkipped', {
        songSkipped: songToDelete,
      });
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async create(newSongData: NewSongInput): Promise<Song> {
    const song = await this.songsRepository.save(newSongData);

    const count = await this.songsRepository
      .createQueryBuilder('song')
      .where('song.videoId = :value', { value: song.videoId })
      .select('COUNT(DISTINCT song.id)', 'count')
      .getRawOne();

    this.pubSub.publish('songAdded', {
      songAdded: {
        ...song,
        count: count.count,
      },
    });

    return song;
  }
}
