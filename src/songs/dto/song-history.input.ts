import { InputType, Field } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsOptional, MinLength } from 'class-validator';

@InputType()
export class SongHistoryInput {
  @MinLength(3)
  @IsOptional()
  @Transform(({ value }) => value.trim())
  @Field({ nullable: true })
  user?: string;

  @Field({ nullable: true })
  endTime?: string;
}
