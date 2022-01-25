import { Module } from '@nestjs/common';
import { SongsService } from './songs.service';

@Module({
  exports: [SongsService],
  providers: [SongsService],
})
export class SongsModule {}
