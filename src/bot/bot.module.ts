import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { YoutubeModule } from 'src/youtube/youtube.module';
import { BotService } from './bot.service';

@Module({
  imports: [ConfigModule, YoutubeModule, SupabaseModule],
  providers: [BotService],
})
export class BotModule {}
