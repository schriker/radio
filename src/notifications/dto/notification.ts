import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Notification {
  @Field()
  text: string;
}
