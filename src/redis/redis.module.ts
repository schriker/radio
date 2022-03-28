import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Module({
  providers: [
    {
      provide: 'REDIS',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const options = {
          host: configService.get<string>('REDIS_HOST'),
          port: parseInt(configService.get<string>('REDIS_PORT')),
          retryStrategy: (times: number) => {
            return Math.min(times * 50, 2000);
          },
        };

        return new Redis(options);
      },
    },
  ],
  exports: ['REDIS'],
})
export class RedisModule {}
