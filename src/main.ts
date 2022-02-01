/* eslint-disable @typescript-eslint/no-var-requires */
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppService } from './app.service';
const ora = require('ora');
const chalk = require('chalk');

async function bootstrap() {
  const bot = await NestFactory.createApplicationContext(AppModule);
  const app = await NestFactory.create(AppModule);
  const botService = bot.get(AppService);
  // await app.listen(3000);
  // ora(
  //   chalk.black.bgGreen(
  //     `[APP]: Application is running on: ${await app.getUrl()}`,
  //   ),
  // ).succeed();

  app.useGlobalPipes(new ValidationPipe());
  botService.start();
}
bootstrap();
