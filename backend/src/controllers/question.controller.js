import { db } from "../lib/db.js";
import { questions, options, quizzes } from "../db/schema.js";
import { eq, inArray } from "drizzle-orm";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getQuizQuestions = asyncHandler(async (req, res) => {
  const { quizId } = req.params;

  const [quiz] = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.id, quizId));

  if (!quiz) {
    throw new ApiError(404, "Quiz not found");
  }

  const qList = await db
    .select()
    .from(questions)
    .where(eq(questions.quizId, quizId));

  const questionIds = qList.map((q) => q.id);

  let optsList = [];
  if (questionIds.length > 0) {
    optsList = await db
      .select()
      .from(options)
      .where(inArray(options.questionId, questionIds));
  }

  const structuredQuestions = qList.map((q) => ({
    ...q,
    options: optsList.filter((o) => o.questionId === q.id),
  }));

  res.status(200).json({ success: true, data: structuredQuestions });
});

export const createQuestion = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const {
    questionText,
    marks = 1,
    explanation,
    difficulty = "INTERMEDIATE",
    optionsList,
  } = req.body;

  if (!questionText || questionText.trim() === "") {
    throw new ApiError(400, "Question text is required");
  }

  if (!optionsList || !Array.isArray(optionsList) || optionsList.length < 2) {
    throw new ApiError(400, "At least two options are required");
  }

  const correctOpts = optionsList.filter((o) => o.isCorrect === true || o.isCorrect === "true");
  if (correctOpts.length !== 1) {
    throw new ApiError(400, "Exactly one option must be marked as correct");
  }

  const [quiz] = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.id, quizId));

  if (!quiz) {
    throw new ApiError(404, "Quiz not found");
  }

  const result = await db.transaction(async (tx) => {
    const [newQuestion] = await tx
      .insert(questions)
      .values({
        quizId,
        questionText,
        marks,
        explanation,
        difficulty,
      })
      .returning();

    const formattedOptions = optionsList.map((o) => ({
      questionId: newQuestion.id,
      optionText: o.optionText,
      isCorrect: !!o.isCorrect,
    }));

    const newOptions = await tx
      .insert(options)
      .values(formattedOptions)
      .returning();

    return {
      ...newQuestion,
      options: newOptions,
    };
  });

  res.status(201).json({
    success: true,
    message: "Question created successfully",
    data: result,
  });
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { questionText, marks, explanation, difficulty, optionsList } = req.body;

  const [existingQ] = await db
    .select()
    .from(questions)
    .where(eq(questions.id, id));

  if (!existingQ) {
    throw new ApiError(404, "Question not found");
  }

  if (optionsList) {
    if (!Array.isArray(optionsList) || optionsList.length < 2) {
      throw new ApiError(400, "At least two options are required");
    }
    const correctOpts = optionsList.filter((o) => o.isCorrect === true || o.isCorrect === "true");
    if (correctOpts.length !== 1) {
      throw new ApiError(400, "Exactly one option must be marked as correct");
    }
  }

  const result = await db.transaction(async (tx) => {
    const [updatedQuestion] = await tx
      .update(questions)
      .set({
        ...(questionText && { questionText }),
        ...(marks !== undefined && { marks }),
        ...(explanation !== undefined && { explanation }),
        ...(difficulty && { difficulty }),
      })
      .where(eq(questions.id, id))
      .returning();

    let updatedOptions = [];
    if (optionsList) {
      await tx.delete(options).where(eq(options.questionId, id));

      const formattedOptions = optionsList.map((o) => ({
        questionId: id,
        optionText: o.optionText,
        isCorrect: !!o.isCorrect,
      }));

      updatedOptions = await tx
        .insert(options)
        .values(formattedOptions)
        .returning();
    } else {
      updatedOptions = await tx
        .select()
        .from(options)
        .where(eq(options.questionId, id));
    }

    return {
      ...updatedQuestion,
      options: updatedOptions,
    };
  });

  res.status(200).json({
    success: true,
    message: "Question updated successfully",
    data: result,
  });
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [deletedQuestion] = await db
    .delete(questions)
    .where(eq(questions.id, id))
    .returning();

  if (!deletedQuestion) {
    throw new ApiError(404, "Question not found");
  }

  res.status(200).json({
    success: true,
    message: "Question deleted successfully",
    data: deletedQuestion,
  });
});
