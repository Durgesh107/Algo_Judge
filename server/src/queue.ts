import { Queue } from "bullmq";
import { connection } from "./redis.js";

// Create a new queue named "submission-queue"
export const submissionQueue = new Queue("submission-queue", {
  connection,
});


