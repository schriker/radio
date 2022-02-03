import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Dayjs } from 'dayjs';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@ObjectType()
@Entity('song')
export class Song {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field()
  @Column()
  author: string;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column()
  lengthSeconds: number;

  @Field()
  @Column()
  videoId: string;

  @Field()
  @Column()
  channelId: string;

  @Field()
  @Column()
  viewCount: string;

  @Field()
  @Column()
  user: string;

  @Field()
  @Column()
  userColor: string;

  @Field()
  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Field()
  @Column({ type: 'timestamptz' })
  endTime: Date;
}
