import { Module } from '@nestjs/common';
import { SongsService } from './songs.service';
import { SongsResolver } from './songs.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Song } from './entity/song.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Song])],
  providers: [SongsService, SongsResolver],
})
export class SongsModule {}
