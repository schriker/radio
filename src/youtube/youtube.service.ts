import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { YouTubeVideo } from './interfaces/youtube.interface';

@Injectable()
export class YoutubeService {
  validateLink(link: string): boolean {
    const match = link.match(
      /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/,
    );
    if (match && !match.includes('/embed/')) {
      return true;
    } else {
      return false;
    }
  }

  async getData(link: string): Promise<YouTubeVideo> {
    try {
      const page = await axios.get(link);
      const pageMetadata = page.data
        .split('ytInitialPlayerResponse = ')
        .pop()
        .split(';</script>')[0];
      const pageMetadataObject = JSON.parse(pageMetadata);
      const {
        author,
        title,
        lengthSeconds,
        videoId,
        channelId,
        viewCount,
        thumbnail,
      } = pageMetadataObject.videoDetails;

      return {
        author,
        title,
        lengthSeconds,
        videoId,
        channelId,
        viewCount,
        thumbnail,
      };
    } catch (error) {
      console.log(error);
    }
  }
}
