import { Queue } from "bullmq";

// Reuse your Redis connection connection config here
const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

export const submissionQueue = new Queue("submissionQueue", {
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 200,
    attempts: 1,
  },
});