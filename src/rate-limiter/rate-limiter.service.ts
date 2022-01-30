/* eslint-disable @typescript-eslint/no-var-requires */
import { Injectable } from '@nestjs/common';
const Redis = require('ioredis');
const redisClient = new Redis({ enableOfflineQueue: false });
const { RateLimiterRedis } = require('rate-limiter-flexible');

@Injectable()
export class RateLimiterService {
  private client: typeof RateLimiterRedis;

  constructor() {
    this.client = new RateLimiterRedis({
      storeClient: redisClient,
      points: 10,
      duration: 60 * 60 * 2,
    });
  }

  async songLimit(user: string) {
    try {
      await this.client.consume(user);
    } catch (error) {
      throw new Error(
        'Przekroczyłeś limit utworów. Max 10 utworów w ciagu 2h.',
      );
    }
  }
}
