import { Router } from "express";
import { prisma } from "../prisma";
import { redis } from "../redis";

const router = Router();

// Get all problems (for the problem dashboard)
router.get("/problems", async (req, res) => {
  try {
    const cacheKey = "problems:all";

    // 1. Check if problem list is cached
    const cachedProblems = await redis.get(cacheKey);
    if (cachedProblems) {
      return res.json(JSON.parse(cachedProblems));
    }

    // 2. Fetch from DB if cache miss
    const problems = await prisma.problem.findMany({
      select: {
        id: true,
        title: true,
        difficulty: true,
      },
    });

    // 3. Cache the list for 1 hour (3600 seconds)
    await redis.setex(cacheKey, 3600, JSON.stringify(problems));

    return res.json(problems);
  } catch (error) {
    console.error("Error fetching problems:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get a single problem with description and sample test cases (Cached)
router.get("/problems/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `problem:${id}`;

    // 1. Check Redis cache
    const cachedProblem = await redis.get(cacheKey);
    if (cachedProblem) {
      console.log(`⚡ Cache hit for problem ID: ${id}`);
      return res.json(JSON.parse(cachedProblem));
    }

    // 2. Fetch from PostgreSQL if cache miss
    console.log(`🐢 Cache miss for problem ID: ${id}. Querying DB...`);
    const problem = await prisma.problem.findUnique({
      where: { id },
      include: {
        testCases: {
          select: {
            id: true,
            input: true,
            expectedOutput: true,
          },
        },
      },
    });

    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    // 3. Save result into Redis cache with a 1-hour expiration
    await redis.setex(cacheKey, 3600, JSON.stringify(problem));

    return res.json(problem);
  } catch (error) {
    console.error("Error fetching problem details:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;