import { ObjectType, Field, ID } from "type-graphql";

@ObjectType()
export class TestCase {
  @Field(() => ID)
  id: string;

  @Field()
  problemId: string;

  @Field()
  input: string;

  @Field()
  expectedOutput: string;

  @Field(() => Date)
  createdAt: Date;
}