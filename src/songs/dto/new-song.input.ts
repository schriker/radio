import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class NewSongInput {
  @Field()
  author: string;

  @Field()
  title: string;

  @Field()
  lengthSeconds: number;

  @Field()
  videoId: string;

  @Field()
  channelId: string;

  @Field()
  viewCount: number;

  @Field()
  user: string;

  @Field()
  userColor: string;

  @Field()
  startTime: Date;

  @Field()
  endTime: Date;
}
