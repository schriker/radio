import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { BotModule } from './bot/bot.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BotService } from './bot/bot.service';
import { SupabaseModule } from './supabase/supabase.module';
import { YoutubeModule } from './youtube/youtube.module';
import { BullModule } from '@nestjs/bull';
import { RateLimiterModule } from './rate-limiter/rate-limiter.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SongsModule } from './songs/songs.module';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
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
        synchronize: false,
        keepConnectionAlive: true,
      }),
      inject: [ConfigService],
    }),
    GraphQLModule.forRoot({
      installSubscriptionHandlers: true,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
    }),
    BotModule,
    SupabaseModule,
    YoutubeModule,
    RateLimiterModule,
    SongsModule,
  ],
  providers: [AppService, BotService],
})
export class AppModule {}
