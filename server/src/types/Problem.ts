import { ObjectType, Field, ID, Float, Int } from "type-graphql";
import { TestCase } from "./TestCase"; // Adjust path as needed

@ObjectType()
export class Problem {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field()
  description!: string;

  @Field()
  difficulty!: string;

  @Field(() => Float)
  timeLimit!: number;

  @Field(() => Int)
  memoryLimit!: number;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => [TestCase], { nullable: true })
  testCases?: TestCase[];
}