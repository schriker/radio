import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { YouTubeVideo } from './interfaces/youtube.interface';

@Injectable()
export class YoutubeService {
  validateLink(link: string): false | string {
    const match = link.match(
      /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be|music.youtube\.com))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/,
    );
    if (match && !match.includes('/embed/')) {
      return match[5];
    } else {
      return false;
    }
  }

  async getData(id: string): Promise<YouTubeVideo> {
    try {
      const page = await axios.get(`https://www.youtube.com/watch?v=${id}`);
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
        playabilityStatus: pageMetadataObject.playabilityStatus.status,
      };
    } catch (error) {
      console.log(error);
    }
  }
}
