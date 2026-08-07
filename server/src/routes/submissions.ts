import { Router } from "express";
import { prisma } from "../prisma";
import { submissionQueue } from "../queues/submissionQueue";

const router = Router();

router.post("/submissions", async (req, res) => {
  try {
    const { problemId, code, language, userId } = req.body;

    if (!problemId || !code || !language) {
      return res.status(400).json({ 
        error: "Missing required fields: problemId, code, language" 
      });
    }

    // If no userId is sent from the frontend yet, find or create a default test user
    let targetUserId = userId;
    if (!targetUserId) {
      let defaultUser = await prisma.user.findFirst();
      if (!defaultUser) {
        defaultUser = await prisma.user.create({
          data: {
            email: "coder@example.com",
            username: "default_coder",
            password: "placeholder_password",
          },
        });
      }
      targetUserId = defaultUser.id;
    }

    // 1. Create the submission record using Prisma relation connect syntax
    const submission = await prisma.submission.create({
      data: {
        code,
        language,
        status: "PENDING",
        problem: {
          connect: { id: problemId },
        },
        user: {
          connect: { id: targetUserId },
        },
      },
    });

    // 2. Add the job to the BullMQ queue (passes all data needed by your worker)
    await submissionQueue.add("grade", {
      submissionId: submission.id,
      problemId,
      language,
      code,
    });

    // 3. Return the submission ID to the frontend
    return res.status(201).json({
      message: "Submission received and queued for grading",
      submissionId: submission.id,
      status: "PENDING",
    });
  } catch (error) {
    console.error("Error creating submission:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/submissions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await prisma.submission.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        language: true,
        createdAt: true,
        problemId: true,
      },
    });

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    return res.json(submission);
  } catch (error) {
    console.error("Error fetching submission status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;