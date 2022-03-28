import { Module } from '@nestjs/common';
import { RedisModule } from 'src/redis/redis.module';
import { RateLimiterService } from './rate-limiter.service';

@Module({
  imports: [RedisModule],
  exports: [RateLimiterService],
  providers: [RateLimiterService],
})
export class RateLimiterModule {}
