import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('song')
export class Song {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column()
  author: string;

  @Column()
  title: string;

  @Column()
  lengthSecond: number;

  @Column()
  videoId: string;

  @Column()
  channelId: string;

  @Column()
  viewCount: number;

  @Column()
  user: string;

  @Column()
  userColor: string;

  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Column({ type: 'timestamptz' })
  endTime: Date;
}
