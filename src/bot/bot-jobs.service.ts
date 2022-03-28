import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from 'src/notifications/notifications.service';
import { RateLimiterService } from 'src/rate-limiter/rate-limiter.service';
import { SongsService } from 'src/songs/songs.service';
import { YoutubeService } from 'src/youtube/youtube.service';
import { CreatedMessage } from './interfaces/bot.interface';
import * as dayjs from 'dayjs';
import { NewNotificationInput } from 'src/notifications/dto/new-notification.input';
import { BotService } from './bot.service';

@Injectable()
export class BotJobsService {
  private logger = new Logger(BotJobsService.name);
  constructor(
    private youtubeService: YoutubeService,
    private songsService: SongsService,
    @Inject(forwardRef(() => BotService))
    private botService: BotService,
    private notificationsService: NotificationsService,
    private rateLimiterService: RateLimiterService,
  ) {}

  async addSong(link: string, message: CreatedMessage): Promise<string> {
    try {
      const data = await this.youtubeService.getData(link);
      if (data.playabilityStatus !== 'OK') {
        return `To video ma nałożone ograniczenia wiekowe.`;
      }
      const isAdmin = this.botService.admins.includes(message.author);
      if (!data) {
        return `Tylko bezpośrednie linki do YouTube. Sprawdź poprawność linku.`;
      }

      if (!isAdmin) {
        if (data.lengthSeconds > 1800 || `${data.lengthSeconds}` === '0') {
          return 'Maksymalna długość utworu to 30min.';
        }
      }

      if (!isAdmin) {
        const lastSongsLimit = await this.songsService.last(10);
        if (
          lastSongsLimit.length >= 20 &&
          lastSongsLimit.every((song) => song.user === message.author)
        ) {
          return 'Możesz dodać max. 20 utworów pod rząd.';
        }
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

      if (!isAdmin) {
        const limit = await this.rateLimiterService.songLimit(message.author);

        if (limit) {
          return `Przekroczyłeś limit utworów. Max 25 utworów w ciagu 2h.`;
        }
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

  async getRandomSong(): Promise<boolean> {
    try {
      const message: CreatedMessage = {
        author: 'RadioPancernik',
        body: '',
        channel: '#poorchat',
        color: '#ffffff',
        subscription: 0,
        subscriptionBadge: 0,
        subscriptiongifter: 0,
        week_position: 0,
        type: '',
      };

      const playlist = await this.songsService.songs();
      if (playlist[1]) return true;

      const randomSong = await this.songsService.random();
      if (!randomSong) {
        return false;
      }
      if (randomSong.lengthSeconds < 60) {
        return false;
      }

      const result = await this.addSong(randomSong.videoId, message);
      this.logger.log(result);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}
