import { Thumbnail } from './thumbnail.interface';

export interface YouTubeVideo {
  author: string;
  title: string;
  lengthSeconds: number;
  videoId: string;
  channelId: string;
  viewCount: string;
  playabilityStatus: string;
  embed: boolean;
  thumbnail: {
    thumbnails: Thumbnail[];
  };
}
