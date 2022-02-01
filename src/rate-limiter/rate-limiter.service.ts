/* eslint-disable @typescript-eslint/no-var-requires */
import { Injectable } from '@nestjs/common';
const Redis = require('ioredis');
export const redisClient = new Redis({ enableOfflineQueue: false });
const { RateLimiterRedis } = require('rate-limiter-flexible');

@Injectable()
export class RateLimiterService {
  private songRateLimiter: typeof RateLimiterRedis;
  private skipRateLimiter: typeof RateLimiterRedis;

  constructor() {
    this.songRateLimiter = new RateLimiterRedis({
      keyPrefix: 'rlflxsongs',
      storeClient: redisClient,
      points: 10,
      duration: 60 * 60 * 2,
    });

    this.skipRateLimiter = new RateLimiterRedis({
      keyPrefix: 'rlflxskips',
      storeClient: redisClient,
      points: 10,
      duration: 60 * 60 * 1,
    });
  }

  async songLimit(user: string) {
    try {
      await this.songRateLimiter.consume(user);
    } catch (error) {
      throw new Error(
        'Przekroczyłeś limit utworów. Max 10 utworów w ciagu 2h.',
      );
    }
  }

  async skipLimit(user: string) {
    try {
      await this.skipRateLimiter.consume(user);
    } catch (error) {
      throw new Error('Przekroczyłeś limit. Max 10 w ciagu 1h.');
    }
  }
}
