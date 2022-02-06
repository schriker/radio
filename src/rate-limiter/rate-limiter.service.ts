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
      points: 15,
      duration: 60 * 60 * 2,
    });

    this.skipRateLimiter = new RateLimiterRedis({
      keyPrefix: 'rlflxskips',
      storeClient: redisClient,
      points: 10,
      duration: 60 * 60 * 1,
    });
  }

  async songLimit(user: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      this.songRateLimiter
        .consume(user)
        .then(() => resolve(false))
        .catch(() => resolve(true));
    });
  }

  async skipLimit(user: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      this.skipRateLimiter
        .consume(user)
        .then(() => resolve(false))
        .catch(() => resolve(true));
    });
  }
}
