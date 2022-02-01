import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppService } from './app.service';
import * as ora from 'ora';
import * as chalk from 'chalk';

async function bootstrap() {
  const bot = await NestFactory.createApplicationContext(AppModule);
  const app = await NestFactory.create(AppModule);
  const botService = bot.get(AppService);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  await app.listen(4000);
  ora(
    chalk.black.bgGreen(
      `[APP]: Application is running on: ${await app.getUrl()}`,
    ),
  ).succeed();

  botService.start();
}
bootstrap();
