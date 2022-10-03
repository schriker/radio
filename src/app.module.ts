import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { BotModule } from './bot/bot.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BotService } from './bot/bot.service';
import { YoutubeModule } from './youtube/youtube.module';
import { RateLimiterModule } from './rate-limiter/rate-limiter.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SongsModule } from './songs/songs.module';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { PubSubModule } from './pub-sub/pub-sub.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DateScalar } from './scalars/date.scalar';
import { BottleneckModule } from './bottleneck/bottleneck.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: +configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrationsTableName: 'custom_migration_table',
        migrations: ['dist/migration/*{.ts,.js}'],
        cli: {
          migrationsDir: 'migration',
        },
        logging: false,
        synchronize: false,
        keepConnectionAlive: true,
      }),
      inject: [ConfigService],
    }),
    GraphQLModule.forRoot({
      installSubscriptionHandlers: true,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: true,
      sortSchema: true,
    }),
    BotModule,
    YoutubeModule,
    RateLimiterModule,
    SongsModule,
    PubSubModule,
    BottleneckModule,
    NotificationsModule,
  ],
  providers: [AppService, BotService, DateScalar],
})
export class AppModule {}
