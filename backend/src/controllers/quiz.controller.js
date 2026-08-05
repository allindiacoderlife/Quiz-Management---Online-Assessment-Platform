import { db } from "../lib/db.js";
import { quizzes, categories, questions } from "../db/schema.js";
import { eq, and, like, sql } from "drizzle-orm";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getQuizzes = asyncHandler(async (req, res) => {
  const { role } = req.user;
  const { search, categoryId, difficulty, status } = req.query;

  let query = db
    .select({
      id: quizzes.id,
      title: quizzes.title,
      description: quizzes.description,
      categoryId: quizzes.categoryId,
      categoryName: categories.name,
      difficulty: quizzes.difficulty,
      duration: quizzes.duration,
      passingScore: quizzes.passingScore,
      maxAttempts: quizzes.maxAttempts,
      status: quizzes.status,
      createdAt: quizzes.createdAt,
      updatedAt: quizzes.updatedAt,
      questionCount: sql`count(${questions.id})::int`,
    })
    .from(quizzes)
    .leftJoin(categories, eq(quizzes.categoryId, categories.id))
    .leftJoin(questions, eq(quizzes.id, questions.quizId))
    .groupBy(quizzes.id, categories.name);

  const conditions = [];

  if (role === "STUDENT") {
    conditions.push(eq(quizzes.status, "PUBLISHED"));
  } else if (status) {
    conditions.push(eq(quizzes.status, status));
  }

  if (categoryId) {
    conditions.push(eq(quizzes.categoryId, categoryId));
  }
  if (difficulty) {
    conditions.push(eq(quizzes.difficulty, difficulty));
  }
  if (search) {
    conditions.push(like(quizzes.title, `%${search}%`));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const list = await query;
  res.status(200).json({ success: true, data: list });
});

export const getQuizById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;

  const [quiz] = await db
    .select({
      id: quizzes.id,
      title: quizzes.title,
      description: quizzes.description,
      categoryId: quizzes.categoryId,
      categoryName: categories.name,
      difficulty: quizzes.difficulty,
      duration: quizzes.duration,
      passingScore: quizzes.passingScore,
      maxAttempts: quizzes.maxAttempts,
      status: quizzes.status,
      createdAt: quizzes.createdAt,
      updatedAt: quizzes.updatedAt,
      questionCount: sql`count(${questions.id})::int`,
    })
    .from(quizzes)
    .leftJoin(categories, eq(quizzes.categoryId, categories.id))
    .leftJoin(questions, eq(quizzes.id, questions.quizId))
    .where(eq(quizzes.id, id))
    .groupBy(quizzes.id, categories.name);

  if (!quiz) {
    throw new ApiError(404, "Quiz not found");
  }

  if (role === "STUDENT" && quiz.status !== "PUBLISHED") {
    throw new ApiError(403, "You are not authorized to access this quiz");
  }

  res.status(200).json({ success: true, data: quiz });
});

export const createQuiz = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    categoryId,
    difficulty = "INTERMEDIATE",
    duration,
    passingScore,
    maxAttempts = 1,
    status = "DRAFT",
  } = req.body;

  if (categoryId) {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId));
    if (!category) {
      throw new ApiError(400, "Invalid category ID");
    }
  }

  const [newQuiz] = await db
    .insert(quizzes)
    .values({
      title,
      description,
      categoryId,
      difficulty,
      duration,
      passingScore,
      maxAttempts,
      status,
    })
    .returning();

  res.status(201).json({
    success: true,
    message: "Quiz created successfully",
    data: newQuiz,
  });
});

export const updateQuiz = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    categoryId,
    difficulty,
    duration,
    passingScore,
    maxAttempts,
    status,
  } = req.body;

  if (categoryId) {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId));
    if (!category) {
      throw new ApiError(400, "Invalid category ID");
    }
  }

  const [updatedQuiz] = await db
    .update(quizzes)
    .set({
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(categoryId !== undefined && { categoryId }),
      ...(difficulty && { difficulty }),
      ...(duration !== undefined && { duration }),
      ...(passingScore !== undefined && { passingScore }),
      ...(maxAttempts !== undefined && { maxAttempts }),
      ...(status && { status }),
      updatedAt: new Date(),
    })
    .where(eq(quizzes.id, id))
    .returning();

  if (!updatedQuiz) {
    throw new ApiError(404, "Quiz not found");
  }

  res.status(200).json({
    success: true,
    message: "Quiz updated successfully",
    data: updatedQuiz,
  });
});

export const deleteQuiz = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [deletedQuiz] = await db
    .delete(quizzes)
    .where(eq(quizzes.id, id))
    .returning();

  if (!deletedQuiz) {
    throw new ApiError(404, "Quiz not found");
  }

  res.status(200).json({
    success: true,
    message: "Quiz deleted successfully",
    data: deletedQuiz,
  });
});

export const publishQuiz = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !["DRAFT", "PUBLISHED", "UNPUBLISHED"].includes(status)) {
    throw new ApiError(
      400,
      "Invalid status. Must be DRAFT, PUBLISHED, or UNPUBLISHED."
    );
  }

  if (status === "PUBLISHED") {
    const qCount = await db
      .select({ count: sql`count(*)::int` })
      .from(questions)
      .where(eq(questions.quizId, id));

    if (!qCount[0] || qCount[0].count === 0) {
      throw new ApiError(
        400,
        "Cannot publish a quiz with no questions. Please add questions first."
      );
    }
  }

  const [updatedQuiz] = await db
    .update(quizzes)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(quizzes.id, id))
    .returning();

  if (!updatedQuiz) {
    throw new ApiError(404, "Quiz not found");
  }

  res.status(200).json({
    success: true,
    message: `Quiz status updated to ${status} successfully`,
    data: updatedQuiz,
  });
});
