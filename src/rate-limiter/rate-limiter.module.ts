import { Module } from '@nestjs/common';
import { RateLimiterService } from './rate-limiter.service';

@Module({
  exports: [RateLimiterService],
  providers: [RateLimiterService],
})
export class RateLimiterModule {}
