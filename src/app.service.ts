import { Injectable } from '@nestjs/common';
import { BotService } from './bot/bot.service';

@Injectable()
export class AppService {
  constructor(private botService: BotService) {}

  start() {
    this.botService.run();
  }
}
