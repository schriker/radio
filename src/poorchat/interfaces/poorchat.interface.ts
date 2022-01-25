import ReconnectingWebSocket from 'reconnecting-websocket';

export interface PoorchatOptions {
  websocket: string;
  irc: string;
  login: string;
  password: string;
  cap: string[];
  channel: string;
  debug: boolean;
}

export interface PoorchatProperties extends PoorchatOptions {
  ws: ReconnectingWebSocket;
  pongInterval: number;
}

export interface ParsedIrcMessage {
  raw: string;
  tags: unknown;
  prefix: string;
  command: string;
  params: string[];
}
