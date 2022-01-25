/* eslint-disable @typescript-eslint/no-var-requires */
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { SupabaseService } from 'src/supabase/supabase.service';
import { YoutubeService } from 'src/youtube/youtube.service';
import { CreatedMessage } from './interfaces/bot.interface';
const dayjs = require('dayjs');

@Processor('message')
export class BotProcessor {
  constructor(
    private youtubeService: YoutubeService,
    private supabaseService: SupabaseService,
  ) {}

  @Process('addSong')
  async addSong(job: Job<{ link: string; message: CreatedMessage }>) {
    const data = await this.youtubeService.getData(job.data.link);
    if (data.lengthSeconds > 1800) {
      job.progress({
        author: job.data.message.author,
        message: 'Maksymalna długość utworu to 30min.',
      });
      return;
    }

    let startTime = dayjs();
    let endTime = dayjs().add(data.lengthSeconds, 'second');
    const lastSong = await this.supabaseService.getLastSong();
    const lastSongs = await this.supabaseService.getLastSongs();

    if (lastSongs.length) {
      if (lastSongs.some((video) => video.videoId === data.videoId)) {
        job.progress({
          author: job.data.message.author,
          message: `Utwór był niedawno odtwarzany lub jest w kolejce. Prosze dodaj coś innego.`,
        });
        return;
      }
    }

    if (lastSong.length && dayjs(lastSong[0].endTime).isAfter(dayjs())) {
      startTime = dayjs(lastSong[0].endTime);
      endTime = dayjs(startTime).add(data.lengthSeconds, 'second');
    }

    await this.supabaseService.saveSong({
      ...data,
      user: job.data.message.author,
      userColor: job.data.message.color,
      startTime,
      endTime,
    });
    job.progress({
      author: job.data.message.author,
      message: `Utwór został dodany: "${data.title}".`,
    });
  }
}
