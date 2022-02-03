import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppService } from './app.service';
import * as ora from 'ora';
import * as chalk from 'chalk';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const botService = app.get(AppService);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  await app.listen(4001);
  ora(
    chalk.black.bgGreen(`[APP]: Running on: ${await app.getUrl()}`),
  ).succeed();
  botService.start();
}
bootstrap();
