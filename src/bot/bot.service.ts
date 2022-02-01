import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { ParsedIrcMessage } from 'src/poorchat/interfaces/poorchat.interface';
import { Poorchat } from 'src/poorchat/poorchat';
import { RateLimiterService } from 'src/rate-limiter/rate-limiter.service';
import { Admin } from 'src/supabase/interfaces/admin.interface';
import { YoutubeService } from 'src/youtube/youtube.service';
import { CreatedMessage } from './interfaces/bot.interface';
import * as ora from 'ora';
import * as chalk from 'chalk';
import { SongsService } from 'src/songs/songs.service';

@Injectable()
export class BotService {
  public readonly client: Poorchat;
  private logger = new Logger(BotService.name);
  private job: boolean;
  private admins: Admin[];
  private skipsArray: string[] = [];
  private currentSongId = 0;
  private skipingSong: boolean;
  private numberToskip: number;

  constructor(
    private configService: ConfigService,
    private youtubeService: YoutubeService,
    private songsService: SongsService,
    private rateLimiterService: RateLimiterService,
    @InjectQueue('song') private songQueue: Queue,
  ) {
    this.job = false;
    this.numberToskip = 5;
    this.client = new Poorchat({
      websocket: this.configService.get<string>('IRC_WS'),
      irc: this.configService.get<string>('IRC'),
      channel: this.configService.get<string>('IRC_CHANNEL'),
      login: this.configService.get<string>('USER_LOGIN'),
      password: this.configService.get<string>('USER_PASSWORD'),
      cap: [
        'CAP REQ :batch',
        'CAP REQ :cap-notify',
        'CAP REQ :echo-message',
        'CAP REQ :server-time',
        'CAP REQ :msgid',
        'CAP REQ :poorchat.net/blocks',
        'CAP REQ :poorchat.net/clear',
        'CAP REQ :poorchat.net/embed',
        'CAP REQ :poorchat.net/color',
        'CAP REQ :poorchat.net/subscription',
        'CAP REQ :poorchat.net/subscriptiongifter',
        'CAP REQ :multi-prefix',
      ],
      debug: false,
    });
  }

  messageCreator = (IRCMessage: ParsedIrcMessage): CreatedMessage => {
    const messageBody = IRCMessage.params[1];
    const messageChannel = IRCMessage.params[0];
    let subscription = 0;
    let subscriptionBadge = null;
    let subscriptiongifter = 0;
    let week_position = null;

    const author =
      IRCMessage.command === 'PRIVMSG'
        ? IRCMessage.prefix.split('!')[0]
        : 'irc.poorchat.net';

    if (IRCMessage.tags['poorchat.net/subscription']) {
      subscription = JSON.parse(
        IRCMessage.tags['poorchat.net/subscription'].replace(/\\s/g, ''),
      ).months;
      subscriptionBadge = JSON.parse(
        IRCMessage.tags['poorchat.net/subscription'].replace(/\\s/g, ''),
      ).badge;
    }

    if (IRCMessage.tags['poorchat.net/subscriptiongifter']) {
      subscriptiongifter = JSON.parse(
        IRCMessage.tags['poorchat.net/subscriptiongifter'].replace(/\\s/g, ''),
      ).months;
      week_position = JSON.parse(
        IRCMessage.tags['poorchat.net/subscriptiongifter'].replace(/\\s/g, ''),
      ).week_position;
    }

    const messageData = {
      type: IRCMessage.command,
      channel: messageChannel,
      author: author,
      body: messageBody,
      color: IRCMessage.tags['poorchat.net/color'] || '',
      subscription: subscription,
      subscriptionBadge: subscriptionBadge,
      subscriptiongifter: subscriptiongifter,
      week_position: week_position,
    };

    return messageData;
  };

  async skipSong() {
    this.skipingSong = true;
    await this.songsService.skip();
    this.skipingSong = false;
    this.skipsArray = [];
  }

  async handleCommand(message: CreatedMessage) {
    const isAdmin = this.admins.some((admin) => admin.name === message.author);
    const isComand = message.body.trim().match(/^\!(\b\w+\b)(\s+\b\d+\b)?/);

    if (isComand) {
      switch (isComand[1]) {
        case 'next': {
          if (isAdmin) {
            this.skipSong();
          }
          break;
        }
        case 'skip': {
          if (this.skipingSong) {
            this.client.pm(message.author, 'Pomijam utwór...');
            return;
          }
          try {
            await this.rateLimiterService.skipLimit(message.author);
          } catch (error) {
            this.client.pm(
              message.author,
              'Przekroczyłeś limit. Max 10 w ciagu 1h.',
            );
          }
          const currentSong = await this.songsService.current();

          if (!currentSong) {
            this.client.pm(message.author, 'Nic teraz nie gramy :(');
            return;
          }

          if (currentSong[0].id !== this.currentSongId) {
            this.currentSongId = currentSong[0].id;
            this.skipsArray = [];
          }

          if (!this.skipsArray.includes(message.author)) {
            this.skipsArray.push(message.author);
            await this.songQueue.add('sendNotification', {
              notification: {
                text: `${message.author} zagłosował za pominięciem utworu.`,
              },
            });
            this.logger.log(
              `${message.author} skipuje: ${currentSong[0].title}`,
            );
          }
          if (this.skipsArray.length > this.numberToskip) {
            this.skipSong();
          }
          this.client.pm(message.author, 'Zagłosowałeś za pominięciem utworu.');
          break;
        }
        case 'delete': {
          if (isAdmin) {
            // TODO Write method to delete single song
            this.client.pm(message.author, 'Utwór został usunięty.');
          }
          break;
        }
        default:
          return;
      }
    }
  }

  async messageHandler(IRCmessage: ParsedIrcMessage) {
    const message = this.messageCreator(IRCmessage);
    const link = message.body.trim().split(' ')[0].trim();
    this.logger.log(`${message.author}: ${message.body}`);
    try {
      if (this.youtubeService.validateLink(link)) {
        this.client.pm(message.author, 'Pobieram...');
        const job = await this.songQueue.add(
          'addSong',
          {
            link: link,
            message: message,
          },
          {
            delay: 2000,
          },
        );
        if (!this.job) {
          job.queue.on('progress', (_, data) => {
            this.client.pm(data.author, data.message);
          });
          this.job = true;
        }
      } else {
        this.handleCommand(message);
      }
    } catch (error) {
      console.log(error);
      if (typeof error === 'string') {
        this.client.pm(message.author, error);
      }
    }
  }

  async run() {
    await this.client.connect();
    // TODO Store admins in database
    this.admins = [{ name: 'schriker' }];
    ora(chalk.black.bgYellow('[IRC]: Listening \n')).start();
    this.client.on('priv', this.messageHandler.bind(this));
  }
}
