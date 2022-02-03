import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class NewNotificationInput {
  @Field()
  text: string;
}
