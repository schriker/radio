import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { YoutubeModule } from 'src/youtube/youtube.module';
import { BotService } from './bot.service';
import { RateLimiterModule } from 'src/rate-limiter/rate-limiter.module';
import { SongsModule } from 'src/songs/songs.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { BotJobsService } from './bot-jobs.service';
import { BottleneckModule } from 'src/bottleneck/bottleneck.module';

@Module({
  imports: [
    ConfigModule,
    YoutubeModule,
    RateLimiterModule,
    SongsModule,
    NotificationsModule,
    BottleneckModule,
  ],
  exports: [BotService, BotJobsService],
  providers: [BotService, BotJobsService],
})
export class BotModule {}
