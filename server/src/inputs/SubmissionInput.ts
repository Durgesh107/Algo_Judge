import { InputType, Field } from "type-graphql";

@InputType()
export class CreateSubmissionInput {
  @Field()
  problemId: string;

  @Field()
  userId: string; // Note: We will eventually extract this from the JWT securely!

  @Field()
  language: string; // e.g., "cpp", "python"

  @Field()
  code: string;
}