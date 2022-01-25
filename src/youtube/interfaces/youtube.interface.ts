import { Thumbnail } from 'src/songs/interfaces/songs.interface';

export interface YouTubeVideo {
  author: string;
  title: string;
  lengthSeconds: number;
  videoId: string;
  channelId: string;
  viewCount: number;
  thumbnail: {
    thumbnails: Thumbnail[];
  };
}
