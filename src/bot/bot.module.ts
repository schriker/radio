import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { YoutubeModule } from 'src/youtube/youtube.module';
import { BotService } from './bot.service';
import { BullModule } from '@nestjs/bull';
import { BotProcessor } from './bot.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'message',
    }),
    ConfigModule,
    YoutubeModule,
    SupabaseModule,
  ],
  exports: [BullModule],
  providers: [BotService, BotProcessor],
})
export class BotModule {}
