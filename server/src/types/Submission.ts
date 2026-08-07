import { ObjectType, Field, ID } from "type-graphql";

@ObjectType()
export class Submission {
  @Field(() => ID)
  id: string;

  @Field()
  problemId: string;

  @Field()
  userId: string;

  @Field()
  language: string;

  @Field()
  code: string;

  @Field()
  status: string; // e.g., "PENDING", "ACCEPTED", "WRONG_ANSWER"

  @Field(() => Date)
  createdAt: Date;
}