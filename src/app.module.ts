import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { BotModule } from './bot/bot.module';
import { ConfigModule } from '@nestjs/config';
import { BotService } from './bot/bot.service';
import { SongsModule } from './songs/songs.module';
import { SupabaseModule } from './supabase/supabase.module';
import { YoutubeModule } from './youtube/youtube.module';

@Module({
  imports: [
    BotModule,
    ConfigModule.forRoot({ isGlobal: true }),
    SongsModule,
    SupabaseModule,
    YoutubeModule,
  ],
  providers: [AppService, BotService],
})
export class AppModule {}
