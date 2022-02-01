import { Module } from '@nestjs/common';
import { SongsService } from './songs.service';
import { SongsResolver } from './songs.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Song } from './entity/song.entity';
import { PubSubModule } from 'src/pub-sub/pub-sub.module';

@Module({
  exports: [SongsService],
  imports: [TypeOrmModule.forFeature([Song]), PubSubModule],
  providers: [SongsService, SongsResolver],
})
export class SongsModule {}
