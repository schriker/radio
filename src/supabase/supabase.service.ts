/* eslint-disable @typescript-eslint/no-var-requires */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Song } from 'src/supabase/interfaces/songs.interface';
import { Admin } from './interfaces/admin.interface';
const { createClient } = require('@supabase/supabase-js');
const dayjs = require('dayjs');

@Injectable()
export class SupabaseService {
  private client;

  constructor(private configService: ConfigService) {
    this.client = createClient(
      this.configService.get<string>('DB_URL'),
      this.configService.get<string>('DB_SECRET'),
    );
  }

  async getAdmins(): Promise<Admin[]> {
    const admins = await this.client.from('admins').select('*');
    return admins.data;
  }

  async skipSong(): Promise<void> {
    const [currentSong, ...songs] = await this.getCurrentPlaylist();
    await this.client.from('songs').delete().match({ id: currentSong.id });

    if (!songs) return;

    const updatedSongs = songs.reduce<Song[]>(
      (prevValue, currentSong, index) => {
        return [
          ...prevValue,
          {
            ...currentSong,
            startTime:
              index === 0 ? dayjs() : dayjs(prevValue[index - 1].endTime),
            endTime:
              index === 0
                ? dayjs().add(currentSong.lengthSeconds, 'second')
                : dayjs(dayjs(prevValue[index - 1].endTime)).add(
                    currentSong.lengthSeconds,
                    'second',
                  ),
          },
        ];
      },
      [],
    );

    await this.client.from('songs').upsert(updatedSongs);
  }

  async deleteSong(id: number): Promise<void> {
    const songs = await this.client
      .from('songs')
      .select('*')
      .gte('id', id)
      .order('id', { ascending: true });

    const [songToDelete, ...rest]: Song[] = songs.data;

    await this.client.from('songs').delete().match({ id: songToDelete.id });

    if (!songs) return;

    const updatedSongs = rest.reduce<Song[]>(
      (prevValue, currentSong, index) => {
        return [
          ...prevValue,
          {
            ...currentSong,
            startTime:
              index === 0 ? dayjs() : dayjs(prevValue[index - 1].endTime),
            endTime:
              index === 0
                ? dayjs().add(currentSong.lengthSeconds, 'second')
                : dayjs(dayjs(prevValue[index - 1].endTime)).add(
                    currentSong.lengthSeconds,
                    'second',
                  ),
          },
        ];
      },
      [],
    );

    await this.client.from('songs').upsert(updatedSongs);
  }

  async getLastSong(): Promise<Song[]> {
    const lastSong = await this.client
      .from('songs')
      .select('*')
      .order('id', { ascending: false })
      .limit(1);

    return lastSong.data;
  }

  async getCurrentSong(): Promise<Song[]> {
    const lastSong = await this.client
      .from('songs')
      .select('*')
      .order('id', { ascending: true })
      .limit(1);

    return lastSong.data;
  }

  async getLastSongs(): Promise<Song[]> {
    const lastSongs = await this.client
      .from('songs')
      .select('*')
      .gte('startTime', dayjs().subtract(60, 'minute'))
      .order('id', { ascending: true });

    return lastSongs.data;
  }

  async getCurrentPlaylist(): Promise<Song[]> {
    const playlist = await this.client
      .from('songs')
      .select('*')
      .gt('endTime', dayjs().toISOString())
      .order('id', { ascending: true });

    return playlist.data;
  }

  async saveSong(song: Song): Promise<boolean> {
    const savedSong = await this.client.from('songs').insert([song]);

    if (savedSong.error) {
      throw new Error(savedSong.error.message);
    }

    return true;
  }
}
