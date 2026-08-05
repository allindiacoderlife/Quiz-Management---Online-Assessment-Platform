import { Router } from "express";
import { z } from "zod";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  getQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  publishQuiz,
} from "../controllers/quiz.controller.js";
import { startAttempt, submitAttempt } from "../controllers/attempt.controller.js";

const router = Router();

// Zod validation schemas
const createQuizSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: "Quiz title is required" })
      .trim()
      .min(2, "Title must be at least 2 characters"),
    description: z.string().optional(),
    categoryId: z
      .string({ required_error: "Category ID is required" })
      .uuid("Category ID must be a valid UUID"),
    difficulty: z.enum(["EASY", "INTERMEDIATE", "HARD"]).optional(),
    duration: z
      .number({ required_error: "Duration is required" })
      .int()
      .min(1, "Duration must be at least 1 minute"),
    passingScore: z
      .number({ required_error: "Passing score is required" })
      .int()
      .min(1, "Passing score must be at least 1%")
      .max(100, "Passing score cannot exceed 100%"),
    maxAttempts: z
      .number()
      .int()
      .min(1, "Maximum attempts must be at least 1")
      .optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "UNPUBLISHED"]).optional(),
  }),
});

const updateQuizSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(2, "Title must be at least 2 characters")
      .optional(),
    description: z.string().optional(),
    categoryId: z.string().uuid("Category ID must be a valid UUID").optional(),
    difficulty: z.enum(["EASY", "INTERMEDIATE", "HARD"]).optional(),
    duration: z.number().int().min(1, "Duration must be at least 1 minute").optional(),
    passingScore: z
      .number()
      .int()
      .min(1, "Passing score must be at least 1%")
      .max(100, "Passing score cannot exceed 100%")
      .optional(),
    maxAttempts: z.number().int().min(1, "Maximum attempts must be at least 1").optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "UNPUBLISHED"]).optional(),
  }),
});

const publishQuizSchema = z.object({
  body: z.object({
    status: z.enum(["DRAFT", "PUBLISHED", "UNPUBLISHED"], {
      required_error: "Status is required",
    }),
  }),
});

const submitAttemptSchema = z.object({
  body: z.object({
    attemptId: z
      .string({ required_error: "Attempt ID is required" })
      .uuid("Attempt ID must be a valid UUID"),
    answers: z.array(
      z.object({
        questionId: z
          .string({ required_error: "Question ID is required" })
          .uuid("Question ID must be a valid UUID"),
        selectedOptionId: z
          .string()
          .uuid("Option ID must be a valid UUID")
          .nullable()
          .optional(),
      })
    ),
  }),
});

// All quiz routes require authentication
router.use(protect);

router.get("/", getQuizzes);
router.get("/:id", getQuizById);

// Attempt start & submit endpoints (Students/Admins)
router.post("/:quizId/start", startAttempt);
router.post("/:quizId/submit", validate(submitAttemptSchema), submitAttempt);

// Admin-only CRUD operations
router.post("/", authorize("ADMIN"), validate(createQuizSchema), createQuiz);
router.put("/:id", authorize("ADMIN"), validate(updateQuizSchema), updateQuiz);
router.delete("/:id", authorize("ADMIN"), deleteQuiz);
router.patch("/:id/publish", authorize("ADMIN"), validate(publishQuizSchema), publishQuiz);

export default router;
