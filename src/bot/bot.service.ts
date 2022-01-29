/* eslint-disable @typescript-eslint/no-var-requires */
import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { ParsedIrcMessage } from 'src/poorchat/interfaces/poorchat.interface';
import { Poorchat } from 'src/poorchat/poorchat';
import { Admin } from 'src/supabase/interfaces/admin.interface';
import { SupabaseService } from 'src/supabase/supabase.service';
import { YoutubeService } from 'src/youtube/youtube.service';
import { CreatedMessage } from './interfaces/bot.interface';
const ora = require('ora');
const chalk = require('chalk');

@Injectable()
export class BotService {
  private readonly client: Poorchat;
  private readonly logger = new Logger(BotService.name);
  private job: boolean;
  private admins: Admin[];
  private skipsArray: string[] = [];
  private currentSongId = 0;
  private skipingSong: boolean;
  private numberToskip: number;

  constructor(
    private configService: ConfigService,
    private youtubeService: YoutubeService,
    private supabaseService: SupabaseService,
    @InjectQueue('message') private readonly messageQueue: Queue,
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
    await this.supabaseService.skipSong();
    this.skipingSong = false;
    this.skipsArray = [];
  }

  async handleCommand(message: CreatedMessage) {
    const isAdmin = this.admins.some((admin) => admin.name === message.author);
    const isComand = message.body.trim().match(/^\!(\b\w+\b)(\s+\b\d+\b)?/);

    if (isComand) {
      switch (isComand[1]) {
        case 'skip': {
          if (this.skipingSong) {
            this.client.pm(message.author, 'Pomijam utwór...');
            return;
          }
          if (isAdmin) {
            this.skipSong();
          } else {
            const currentSong = await this.supabaseService.getCurrentSong();

            if (currentSong[0].id !== this.currentSongId) {
              this.currentSongId = currentSong[0].id;
              this.skipsArray = [];
            }

            if (!this.skipsArray.includes(message.author)) {
              this.skipsArray.push(message.author);
              await this.messageQueue.add(
                'sendNotification',
                {
                  notification: `${message.author} zagłosował za pominięciem utworu.`,
                },
                {
                  delay: 2000,
                },
              );
              this.logger.log(
                `${message.author} skipuje: ${currentSong[0].title}`,
              );
            }
            if (this.skipsArray.length > this.numberToskip) {
              this.skipSong();
            }
          }
          this.client.pm(message.author, 'Zagłosowałeś za pominięciem utworu.');
          break;
        }
        case 'delete': {
          if (isAdmin) {
            await this.supabaseService.deleteSong(parseInt(isComand[2]));
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
        const lastSongs = await this.supabaseService.getLastFiveSongs();
        if (lastSongs.every((song) => song.user === message.author)) {
          this.client.pm(
            message.author,
            'Możesz dodać max. 5 utworów pod rząd.',
          );
          return;
        }
        this.client.pm(message.author, 'Pobieram...');
        const job = await this.messageQueue.add(
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
      this.client.pm(message.author, 'Coś poszło nie tak :(');
    }
  }

  async run() {
    await this.client.connect();
    this.admins = await this.supabaseService.getAdmins();
    ora(chalk.black.bgYellow('[IRC]: Listening \n')).start();
    this.client.on('priv', this.messageHandler.bind(this));
  }
}
