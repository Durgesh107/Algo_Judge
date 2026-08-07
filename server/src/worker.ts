import "dotenv/config";
import { Worker, Job } from "bullmq";
import { connection } from "./redis.js";
import { prisma } from "./prisma.js";
import { executeCpp } from "./execute.js";

console.log(" Worker is listening to Redis for new submissions...");

const worker = new Worker(
  "submission-queue",
  async (job: Job) => {
    const { submissionId, problemId, language, code } = job.data;
    console.log(`\n [Job ${job.id}] Evaluating ${language} submission: ${submissionId}`);
    
    let finalStatus = "ACCEPTED";

    try {
      const testCases = await prisma.testCase.findMany({
        where: { problemId },
      });

      if (testCases.length === 0) {
        console.log(" No test cases found for this problem!");
        finalStatus = "WRONG_ANSWER";
      } else {
        for (let i = 0; i < testCases.length; i++) {
          const tc = testCases[i];
          console.log(` Running Test Case ${i + 1}/${testCases.length}...`);

          const actualOutput = await executeCpp(code, tc.input);
          
          const normalizedActual = actualOutput.trim();
          const normalizedExpected = tc.expectedOutput.trim();

          if (normalizedActual !== normalizedExpected) {
            console.log(` Test Case ${i + 1} Failed!`);
            console.log(`   Expected: "${normalizedExpected}"`);
            console.log(`   Got:      "${normalizedActual}"`);
            finalStatus = "WRONG_ANSWER";
            break;
          } else {
            console.log(` Test Case ${i + 1} Passed!`);
          }
        }
      }

    } catch (err: any) {
      const errorMessage = err.message.trim();
      console.error(` Execution Error:`, errorMessage);

      // Intelligent error mapping
      if (errorMessage === "TIME_LIMIT_EXCEEDED") {
        finalStatus = "TIME_LIMIT_EXCEEDED";
      } else if (errorMessage.includes("error:") || errorMessage.includes("g++")) {
        finalStatus = "COMPILATION_ERROR";
      } else {
        finalStatus = "WRONG_ANSWER";
      }
    }

    // Update PostgreSQL with the categorized status
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: finalStatus },
    });

    console.log(` [Job ${job.id}] Finished! Database updated to: ${finalStatus}`);
  },
  { connection }
);

worker.on("failed", (job, err) => {
  console.error(`[Job ${job?.id}] Queue Error:`, err.message);
});