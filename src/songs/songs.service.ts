import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as dayjs from 'dayjs';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { NewSongInput } from './dto/new-song.input';
import { Song } from './entity/song.entity';

@Injectable()
export class SongsService {
  constructor(
    @InjectRepository(Song)
    private readonly songsRepository: Repository<Song>,
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

  // async create(newSongData: NewSongInput): Promise<Song> {
  //   return this.songsRepository.find();
  // }
}
