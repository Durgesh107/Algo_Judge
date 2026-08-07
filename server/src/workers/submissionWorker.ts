import { Worker, Job } from "bullmq";
import { prisma } from "../prisma";
import { getIO } from "../socket"; // Assuming you have a helper to access your socket instance

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

interface SubmissionJobData {
  submissionId: string;
  problemId: string;
  language: string;
  code: string;
}

const worker = new Worker<SubmissionJobData>(
  "submissionQueue",
  async (job: Job<SubmissionJobData>) => {
    const { submissionId, problemId, code, language } = job.data;
    console.log(`⚙️ Processing grading job ${job.id} for submission ${submissionId}`);

    try {
      // 1. Update status to running/evaluating if needed
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: "RUNNING" },
      });

      // TODO: Execute your Docker container code compilation and testing logic here
      // Example placeholder logic:
      const isAccepted = true; // Replace with actual test execution result
      const finalStatus = isAccepted ? "ACCEPTED" : "WRONG_ANSWER";

      // 2. Update database with final verdict
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: finalStatus },
      });

      // 3. Broadcast real-time update via WebSockets
      const io = getIO();
      if (io) {
        io.to(submissionId).emit("submission-update", {
          submissionId,
          status: finalStatus,
        });
        io.emit("submission-update", { submissionId, status: finalStatus }); // Global fallback broadcast
      }

      console.log(`✨ [Job ${job.id}] Finished! Database updated to: ${finalStatus}`);
    } catch (error) {
      console.error(`❌ [Job ${job.id}] Failed processing:`, error);

      // Handle worker crashes gracefully by marking submission as ERROR
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: "ERROR" },
      }).catch(() => {});

      throw error; // Let BullMQ log the failure
    }
  },
  {
    connection,
    concurrency: 4, // 👈 Limits concurrent docker execution containers running at once
  }
);

// Worker Lifecycle Event Listeners
worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} successfully executed.`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed with error: ${err.message}`);
});

export default worker;