import { Resolver, Mutation, Query, Arg, Ctx } from "type-graphql";
import { Submission } from "../types/Submission.js";
import { CreateSubmissionInput } from "../inputs/SubmissionInput.js";
import { PrismaClient } from "@prisma/client";
import { submissionQueue } from "../queue.js";

interface Context {
  prisma: PrismaClient;
}

@Resolver(() => Submission)
export class SubmissionResolver {
  
  // 1. Create a new submission
  @Mutation(() => Submission)
  async createSubmission(
    @Arg("input") input: CreateSubmissionInput,
    @Ctx() { prisma }: Context
  ): Promise<Submission> {
    
    // Save the submission to the database with a "PENDING" status
    const submission = await prisma.submission.create({
      data: {
        problemId: input.problemId,
        userId: input.userId,
        language: input.language,
        code: input.code,
        status: "PENDING",
      },
    });

    await submissionQueue.add("evaluate-code", {
      submissionId: submission.id,
      problemId: submission.problemId,
      language: submission.language,
      code: submission.code,
    });

    return submission;
  }

  // 2. Fetch all submissions
  @Query(() => [Submission])
  async submissions(@Ctx() { prisma }: Context): Promise<Submission[]> {
    return prisma.submission.findMany({
      orderBy: { createdAt: "desc" },
    });
  }
}