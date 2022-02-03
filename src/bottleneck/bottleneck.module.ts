import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Bottleneck from 'bottleneck';

@Module({
  providers: [
    {
      provide: 'BOTTLENECK',
      inject: [ConfigService],
      useFactory: () => {
        return new Bottleneck({
          id: 'radio',
          maxConcurrent: 1,
          minTime: 3000,
        });
      },
    },
  ],
  exports: ['BOTTLENECK'],
})
export class BottleneckModule {}
