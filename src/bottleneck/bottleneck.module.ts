import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Bottleneck from 'bottleneck';

@Module({
  providers: [
    {
      provide: 'BOTTLENECK',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new Bottleneck({
          id: 'radio',
          maxConcurrent: 1,
          minTime: 3000,
          datastore: 'ioredis',
          clearDatastore: false,
          clientOptions: {
            host: configService.get<string>('REDIS_HOST'),
            port: parseInt(configService.get<string>('REDIS_PORT')),
          },
        });
      },
    },
  ],
  exports: ['BOTTLENECK'],
})
export class BottleneckModule {}
