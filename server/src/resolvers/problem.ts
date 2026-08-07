import { Resolver, Query, Mutation, Arg, Ctx, FieldResolver, Root } from "type-graphql";
import { Problem } from "../types/Problem.js";
import { TestCase } from "../types/TestCase.js";
import { CreateProblemInput, CreateTestCaseInput } from "../inputs/ProblemInput.js";
import { PrismaClient } from "@prisma/client";

interface Context {
  prisma: PrismaClient;
}

@Resolver(() => Problem)
export class ProblemResolver {
  // 1. Fetch all problems
  @Query(() => [Problem])
  async problems(@Ctx() { prisma }: Context): Promise<Problem[]> {
    return prisma.problem.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  // 2. Fetch a single problem by ID
  @Query(() => Problem, { nullable: true })
  async problem(
    @Arg("id") id: string,
    @Ctx() { prisma }: Context
  ): Promise<Problem | null> {
    return prisma.problem.findUnique({
      where: { id },
    });
  }

  // 👈 Field resolver to fetch test cases associated with the problem
  @FieldResolver(() => [TestCase])
  async testCases(
    @Root() problem: Problem,
    @Ctx() { prisma }: Context
  ): Promise<TestCase[]> {
    return prisma.testCase.findMany({
      where: { problemId: problem.id },
    });
  }

  // 3. Create a new problem
  @Mutation(() => Problem)
  async createProblem(
    @Arg("input") input: CreateProblemInput,
    @Ctx() { prisma }: Context
  ): Promise<Problem> {
    return prisma.problem.create({
      data: {
        title: input.title,
        description: input.description,
        difficulty: input.difficulty,
        timeLimit: input.timeLimit,
        memoryLimit: input.memoryLimit,
      },
    });
  }

  // 4. Create a new test case
  @Mutation(() => TestCase)
  async createTestCase(
    @Arg("input") input: CreateTestCaseInput,
    @Ctx() { prisma }: Context
  ): Promise<TestCase> {
    return prisma.testCase.create({
      data: {
        problemId: input.problemId,
        input: input.input,
        expectedOutput: input.expectedOutput,
      },
    });
  }
}