import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { BotModule } from './bot/bot.module';
import { ConfigModule } from '@nestjs/config';
import { BotService } from './bot/bot.service';
import { SupabaseModule } from './supabase/supabase.module';
import { YoutubeModule } from './youtube/youtube.module';
import { BullModule } from '@nestjs/bull';
import { RateLimiterModule } from './rate-limiter/rate-limiter.module';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BotModule,
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    YoutubeModule,
    RateLimiterModule,
  ],
  providers: [AppService, BotService],
})
export class AppModule {}
