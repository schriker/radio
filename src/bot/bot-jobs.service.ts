import { Injectable } from '@nestjs/common';
import { NotificationsService } from 'src/notifications/notifications.service';
import { RateLimiterService } from 'src/rate-limiter/rate-limiter.service';
import { SongsService } from 'src/songs/songs.service';
import { YoutubeService } from 'src/youtube/youtube.service';
import { CreatedMessage } from './interfaces/bot.interface';
import * as dayjs from 'dayjs';
import { NewNotificationInput } from 'src/notifications/dto/new-notification.input';

@Injectable()
export class BotJobsService {
  constructor(
    private youtubeService: YoutubeService,
    private songsService: SongsService,
    private notificationsService: NotificationsService,
    private rateLimiterService: RateLimiterService,
  ) {}

  async addSong(link: string, message: CreatedMessage): Promise<string> {
    try {
      const data = await this.youtubeService.getData(link);
      if (!data) {
        return `Tylko bezpośrednie linki do YouTube. Sprawdź poprawność linku.`;
      }

      if (data.lengthSeconds > 1800 || `${data.lengthSeconds}` === '0') {
        return 'Maksymalna długość utworu to 30min.';
      }

      const lastSongsLimit = await this.songsService.last(10);
      if (
        lastSongsLimit.length >= 10 &&
        lastSongsLimit.every((song) => song.user === message.author)
      ) {
        return 'Możesz dodać max. 5 utworów pod rząd.';
      }

      let startTime = dayjs();
      let endTime = dayjs().add(data.lengthSeconds, 'second');
      const lastSong = await this.songsService.last(1);
      const lastSongs = await this.songsService.last60min();

      if (lastSongs.length) {
        if (lastSongs.some((video) => video.videoId === data.videoId)) {
          return `Utwór był niedawno odtwarzany lub jest w kolejce. Prosze dodaj coś innego.`;
        }
      }
      if (lastSong.length && dayjs(lastSong[0].endTime).isAfter(dayjs())) {
        startTime = dayjs(lastSong[0].endTime);
        endTime = dayjs(startTime).add(data.lengthSeconds, 'second');
      }

      const limit = await this.rateLimiterService.songLimit(message.author);

      if (limit) {
        return `Przekroczyłeś limit utworów. Max 10 utworów w ciagu 2h.`;
      }

      await this.songsService.create({
        ...data,
        user: message.author,
        userColor: message.color,
        startTime: startTime as unknown as Date,
        endTime: endTime as unknown as Date,
      });

      return `Utwór został dodany: "${data.title}".`;
    } catch (error) {
      console.log(error);
      return 'Coś poszło nie tak :(';
    }
  }

  async sendNotification(notification: NewNotificationInput) {
    try {
      this.notificationsService.create(notification);
    } catch (error) {
      console.log(error);
    }
  }
}
