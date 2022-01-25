/* eslint-disable @typescript-eslint/no-var-requires */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Song } from 'src/songs/interfaces/songs.interface';
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

  async getLastSong(): Promise<Song[]> {
    const lastSong = await this.client
      .from('songs')
      .select('*')
      .order('id', { ascending: false })
      .limit(1);

    return lastSong.data;
  }

  async getLastSongs(): Promise<Song[]> {
    const lastSongs = await this.client
      .from('songs')
      .select('*')
      .gte('startTime', dayjs().subtract(60, 'minute'));

    return lastSongs.data;
  }

  async saveSong(song: Song): Promise<boolean> {
    const savedSong = await this.client.from('songs').insert([song]);

    if (savedSong.error) {
      throw new Error(savedSong.error.message);
    }

    return true;
  }
}
