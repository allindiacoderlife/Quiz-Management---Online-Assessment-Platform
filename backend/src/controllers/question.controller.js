import { db } from "../lib/db.js";
import { questions, options, quizzes, testCases } from "../db/schema.js";
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
  let casesList = [];
  if (questionIds.length > 0) {
    [optsList, casesList] = await Promise.all([
      db.select().from(options).where(inArray(options.questionId, questionIds)),
      db.select().from(testCases).where(inArray(testCases.questionId, questionIds)),
    ]);
  }

  const structuredQuestions = qList.map((q) => ({
    ...q,
    codingTemplate: q.codingTemplate ? JSON.parse(q.codingTemplate) : null,
    options: optsList.filter((o) => o.questionId === q.id),
    testCases: casesList.filter((tc) => tc.questionId === q.id),
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
    type = "MCQ",
    codingTemplate,
    optionsList,
    testCasesList,
  } = req.body;

  if (!questionText || questionText.trim() === "") {
    throw new ApiError(400, "Question text is required");
  }

  if (type === "CODING") {
    if (!testCasesList || !Array.isArray(testCasesList) || testCasesList.length === 0) {
      throw new ApiError(400, "At least one test case is required for coding questions");
    }
  } else {
    if (!optionsList || !Array.isArray(optionsList) || optionsList.length < 2) {
      throw new ApiError(400, "At least two options are required for MCQ questions");
    }
    const correctOpts = optionsList.filter((o) => o.isCorrect === true || o.isCorrect === "true");
    if (correctOpts.length !== 1) {
      throw new ApiError(400, "Exactly one option must be marked as correct");
    }
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
        type,
        codingTemplate: codingTemplate ? JSON.stringify(codingTemplate) : null,
      })
      .returning();

    let newOptions = [];
    let newTestCases = [];

    if (type === "CODING") {
      const formattedTestCases = testCasesList.map((tc) => ({
        questionId: newQuestion.id,
        input: tc.input || "",
        expectedOutput: tc.expectedOutput || "",
        isSample: !!tc.isSample,
      }));

      newTestCases = await tx
        .insert(testCases)
        .values(formattedTestCases)
        .returning();
    } else {
      const formattedOptions = optionsList.map((o) => ({
        questionId: newQuestion.id,
        optionText: o.optionText,
        isCorrect: !!o.isCorrect,
      }));

      newOptions = await tx
        .insert(options)
        .values(formattedOptions)
        .returning();
    }

    return {
      ...newQuestion,
      codingTemplate: newQuestion.codingTemplate ? JSON.parse(newQuestion.codingTemplate) : null,
      options: newOptions,
      testCases: newTestCases,
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
  const { 
    questionText, 
    marks, 
    explanation, 
    difficulty, 
    type,
    codingTemplate,
    optionsList, 
    testCasesList 
  } = req.body;

  const [existingQ] = await db
    .select()
    .from(questions)
    .where(eq(questions.id, id));

  if (!existingQ) {
    throw new ApiError(404, "Question not found");
  }

  const qType = type || existingQ.type;

  if (qType === "CODING") {
    if (testCasesList && (!Array.isArray(testCasesList) || testCasesList.length === 0)) {
      throw new ApiError(400, "At least one test case is required for coding questions");
    }
  } else {
    if (optionsList) {
      if (!Array.isArray(optionsList) || optionsList.length < 2) {
        throw new ApiError(400, "At least two options are required");
      }
      const correctOpts = optionsList.filter((o) => o.isCorrect === true || o.isCorrect === "true");
      if (correctOpts.length !== 1) {
        throw new ApiError(400, "Exactly one option must be marked as correct");
      }
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
        ...(type && { type }),
        codingTemplate: codingTemplate ? JSON.stringify(codingTemplate) : (type === "MCQ" ? null : undefined),
      })
      .where(eq(questions.id, id))
      .returning();

    let updatedOptions = [];
    let updatedTestCases = [];

    if (qType === "CODING") {
      // Clear options and write test cases
      await tx.delete(options).where(eq(options.questionId, id));
      
      if (testCasesList) {
        await tx.delete(testCases).where(eq(testCases.questionId, id));

        const formattedTestCases = testCasesList.map((tc) => ({
          questionId: id,
          input: tc.input || "",
          expectedOutput: tc.expectedOutput || "",
          isSample: !!tc.isSample,
        }));

        updatedTestCases = await tx
          .insert(testCases)
          .values(formattedTestCases)
          .returning();
      } else {
        updatedTestCases = await tx
          .select()
          .from(testCases)
          .where(eq(testCases.questionId, id));
      }
    } else {
      // Clear test cases and write options
      await tx.delete(testCases).where(eq(testCases.questionId, id));

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
    }

    return {
      ...updatedQuestion,
      codingTemplate: updatedQuestion.codingTemplate ? JSON.parse(updatedQuestion.codingTemplate) : null,
      options: updatedOptions,
      testCases: updatedTestCases,
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
