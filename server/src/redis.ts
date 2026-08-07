import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

// maxRetriesPerRequest: null is required by BullMQ
export const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

// Alias it as `redis` so you can use it cleanly for your caching logic too
export const redis = connection;

connection.on("connect", () => {
  console.log(" Connected to Redis successfully");
});

connection.on("error", (err) => {
  console.error("Redis connection error:", err);
});