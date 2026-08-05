import { Router } from "express";
import { z } from "zod";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  getQuizQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "../controllers/question.controller.js";

// Enable mergeParams to access quizId passed from parent router
const router = Router({ mergeParams: true });

// Zod schemas for request validation
const createQuestionSchema = z.object({
  body: z.object({
    questionText: z
      .string({ required_error: "Question text is required" })
      .trim()
      .min(2, "Question text must be at least 2 characters"),
    marks: z
      .number()
      .int()
      .min(1, "Marks must be at least 1")
      .optional(),
    explanation: z.string().optional(),
    difficulty: z.enum(["EASY", "INTERMEDIATE", "HARD"]).optional(),
    optionsList: z
      .array(
        z.object({
          optionText: z
            .string({ required_error: "Option text is required" })
            .trim()
            .min(1, "Option text cannot be empty"),
          isCorrect: z.boolean({ required_error: "isCorrect field is required" }),
        })
      )
      .min(2, "At least two options are required"),
  }),
});

const updateQuestionSchema = z.object({
  body: z.object({
    questionText: z
      .string()
      .trim()
      .min(2, "Question text must be at least 2 characters")
      .optional(),
    marks: z.number().int().min(1, "Marks must be at least 1").optional(),
    explanation: z.string().optional(),
    difficulty: z.enum(["EASY", "INTERMEDIATE", "HARD"]).optional(),
    optionsList: z
      .array(
        z.object({
          optionText: z
            .string({ required_error: "Option text is required" })
            .trim()
            .min(1, "Option text cannot be empty"),
          isCorrect: z.boolean({ required_error: "isCorrect field is required" }),
        })
      )
      .min(2, "At least two options are required")
      .optional(),
  }),
});

// All question routes are admin-only
router.use(protect);
router.use(authorize("ADMIN"));

// Mapped paths (relative to mounting point)
router.get("/", getQuizQuestions);
router.post("/", validate(createQuestionSchema), createQuestion);

// For questions by direct ID
router.put("/:id", validate(updateQuestionSchema), updateQuestion);
router.delete("/:id", deleteQuestion);

export default router;
