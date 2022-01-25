/* eslint-disable @typescript-eslint/no-var-requires */
import {
  ParsedIrcMessage,
  PoorchatOptions,
  PoorchatProperties,
} from './interfaces/poorchat.interface';
const ora = require('ora');
const chalk = require('chalk');
const WebSocket = require('ws');
const parse = require('irc-message').parse;
const EventEmitter = require('events');
const ReconnectingWebSocket = require('reconnecting-websocket');

export class Poorchat extends EventEmitter {
  private properties: PoorchatProperties = {
    ws: null,
    login: '',
    password: '',
    cap: [],
    channel: '',
    debug: false,
    pongInterval: null,
    websocket: '',
    irc: null,
  };

  constructor(poorchatOptions: PoorchatOptions) {
    super();
    this.properties.ws = new ReconnectingWebSocket(
      poorchatOptions.websocket,
      ['base64'],
      {
        WebSocket: WebSocket,
      },
    );
    this.properties.login = poorchatOptions.login;
    this.properties.password = poorchatOptions.password;
    this.properties.cap = poorchatOptions.cap;
    this.properties.channel = poorchatOptions.channel;
    this.properties.debug = poorchatOptions.debug;
    this.properties.pongInterval = null;
  }

  messageEncode(data: string) {
    return Buffer.from(`${data}\r\n`).toString('base64');
  }

  messageDecode(data: string) {
    return Buffer.from(data, 'base64').toString('utf-8');
  }

  sendMessage(message: string) {
    const encodedMessage = this.messageEncode(message);
    this.properties.ws.send(encodedMessage);
  }

  readMessage(data: string): ParsedIrcMessage {
    const decodedMessage = this.messageDecode(data);
    return parse(decodedMessage);
  }

  say(data: string) {
    const encodedMessage = this.messageEncode(
      `PRIVMSG ${this.properties.channel} :${data}`,
    );
    this.properties.ws.send(encodedMessage);
  }

  pm(channel: string, data: string) {
    const encodedMessage = this.messageEncode(`PRIVMSG ${channel} :${data}`);
    this.properties.ws.send(encodedMessage);
  }

  connect(): Promise<void> {
    return new Promise((resolve) => {
      const spinner = ora(chalk.black.bgBlue('[IRC]: Connecting')).start();
      this.properties.ws.addEventListener('open', () => {
        this.sendMessage(`NICK ${this.properties.login}`);
        this.sendMessage(
          `USER ${this.properties.login} ${this.properties.irc} Poorchat ${this.properties.login}`,
        );
        for (const cap of this.properties.cap) {
          this.sendMessage(cap);
        }
        this.sendMessage('CAP END');
      });
      this.properties.ws.addEventListener('message', ({ data }) => {
        const message = this.readMessage(data);

        if (message.command === '422') {
          this.sendMessage(
            `PRIVMSG Poorchat :LOGIN ${this.properties.login} ${this.properties.password}`,
          );
          this.sendMessage(`JOIN ${this.properties.channel}`);
        }

        if (
          message.command === 'JOIN' &&
          message.prefix.split('!')[0] === this.properties.login
        ) {
          clearInterval(this.properties.pongInterval);
          setInterval(() => {
            this.sendMessage(`PONG irc.poorchat.net`);
          }, 30000);
          spinner.succeed(chalk.black.bgGreen('[IRC]: Connected'));
          resolve();
        }

        this.messageHandler(message);
        if (this.properties.debug) {
          console.log(message);
        }
      });
    });
  }

  messageHandler(message: ParsedIrcMessage) {
    switch (message.command) {
      case 'PING':
        this.sendMessage(`PONG ${message.params[0]}`);
        break;
      case 'PRIVMSG':
        this.emit('priv', message);
        break;
      case 'JOIN':
        this.emit('join', message);
        break;
      case 'PART':
        this.emit('part', message);
        break;
      case 'EMBED':
        this.emit('message', message);
        break;
      case 'NOTICE':
        this.emit('message', message);
        break;
      case 'MODE':
        this.emit('mode', message);
      default:
        if (this.properties.debug) {
          console.log(message.raw);
        }
    }
  }
}
