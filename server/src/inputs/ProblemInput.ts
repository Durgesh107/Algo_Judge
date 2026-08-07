import { InputType, Field, Float, Int } from "type-graphql";

@InputType()
export class CreateProblemInput {
  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  difficulty: string; // e.g., "Easy", "Medium", "Hard"

  @Field(() => Float)
  timeLimit: number; // in seconds (e.g., 2.0)

  @Field(() => Int)
  memoryLimit: number; // in MB (e.g., 256)
}

@InputType()
export class CreateTestCaseInput {
  @Field()
  problemId: string;

  @Field()
  input: string;

  @Field()
  expectedOutput: string;
}