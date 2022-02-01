import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import * as dayjs from 'dayjs';
import { Notification } from 'src/notifications/dto/notification';
import { NotificationsService } from 'src/notifications/notifications.service';
import { RateLimiterService } from 'src/rate-limiter/rate-limiter.service';
import { SongsService } from 'src/songs/songs.service';
import { YoutubeService } from 'src/youtube/youtube.service';
import { CreatedMessage } from './interfaces/bot.interface';

@Processor('song')
export class BotProcessor {
  constructor(
    private youtubeService: YoutubeService,
    private songsService: SongsService,
    private notificationsService: NotificationsService,
    private rateLimiterService: RateLimiterService,
  ) {}

  @Process('addSong')
  async addSong(job: Job<{ link: string; message: CreatedMessage }>) {
    try {
      const data = await this.youtubeService.getData(job.data.link);
      if (!data) {
        await job.progress({
          author: job.data.message.author,
          message: `Tylko bezpośrednie linki do YouTube. Sprawdź poprawność linku.`,
        });
        return;
      }

      if (data.lengthSeconds > 1800 || `${data.lengthSeconds}` === '0') {
        await job.progress({
          author: job.data.message.author,
          message: 'Maksymalna długość utworu to 30min.',
        });
        return;
      }

      const lastSongsLimit = await this.songsService.last(5);
      if (
        lastSongsLimit.length >= 5 &&
        lastSongsLimit.every((song) => song.user === job.data.message.author)
      ) {
        await job.progress({
          author: job.data.message.author,
          message: 'Możesz dodać max. 5 utworów pod rząd.',
        });
        return;
      }

      let startTime = dayjs();
      let endTime = dayjs().add(data.lengthSeconds, 'second');
      const lastSong = await this.songsService.last(1);
      const lastSongs = await this.songsService.last60min();

      if (lastSongs.length) {
        if (lastSongs.some((video) => video.videoId === data.videoId)) {
          await job.progress({
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

      this.rateLimiterService
        .songLimit(job.data.message.author)
        .then(async () => {
          await this.songsService.create({
            ...data,
            user: job.data.message.author,
            userColor: job.data.message.color,
            startTime: startTime as unknown as Date,
            endTime: endTime as unknown as Date,
          });
          await job.progress({
            author: job.data.message.author,
            message: `Utwór został dodany: "${data.title}".`,
          });
        })
        .catch(async () => {
          await job.progress({
            author: job.data.message.author,
            message: `Przekroczyłeś limit utworów. Max 10 utworów w ciagu 2h.`,
          });
        });
    } catch (error) {
      console.log(error);
    }
  }

  @Process('sendNotification')
  async sendNotification(job: Job<{ notification: Notification }>) {
    try {
      this.notificationsService.create(job.data.notification);
    } catch (error) {
      console.log(error);
    }
  }
}
