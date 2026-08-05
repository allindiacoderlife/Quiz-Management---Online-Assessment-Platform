import { db } from "../lib/db.js";
import { attempts, quizzes, users, questions, options, answers } from "../db/schema.js";
import { eq, sql, inArray } from "drizzle-orm";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAllAttempts = asyncHandler(async (req, res) => {
  const list = await db
    .select({
      id: attempts.id,
      score: attempts.score,
      percentage: attempts.percentage,
      correctAnswers: attempts.correctAnswers,
      incorrectAnswers: attempts.incorrectAnswers,
      unanswered: attempts.unanswered,
      timeTaken: attempts.timeTaken,
      status: attempts.status,
      startedAt: attempts.startedAt,
      completedAt: attempts.completedAt,
      quizTitle: quizzes.title,
      userName: users.name,
      userEmail: users.email,
    })
    .from(attempts)
    .innerJoin(quizzes, eq(attempts.quizId, quizzes.id))
    .innerJoin(users, eq(attempts.userId, users.id))
    .orderBy(sql`${attempts.startedAt} desc`);

  res.status(200).json({ success: true, data: list });
});

export const getAttemptDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [attempt] = await db
    .select({
      id: attempts.id,
      quizId: attempts.quizId,
      score: attempts.score,
      percentage: attempts.percentage,
      correctAnswers: attempts.correctAnswers,
      incorrectAnswers: attempts.incorrectAnswers,
      unanswered: attempts.unanswered,
      timeTaken: attempts.timeTaken,
      status: attempts.status,
      startedAt: attempts.startedAt,
      completedAt: attempts.completedAt,
      quizTitle: quizzes.title,
      userName: users.name,
      userEmail: users.email,
    })
    .from(attempts)
    .innerJoin(quizzes, eq(attempts.quizId, quizzes.id))
    .innerJoin(users, eq(attempts.userId, users.id))
    .where(eq(attempts.id, id));

  if (!attempt) {
    throw new ApiError(404, "Attempt details not found");
  }

  const dbQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.quizId, attempt.quizId));

  const questionIds = dbQuestions.map((q) => q.id);

  let dbOptions = [];
  if (questionIds.length > 0) {
    dbOptions = await db
      .select()
      .from(options)
      .where(inArray(options.questionId, questionIds));
  }

  const userAnswers = await db
    .select()
    .from(answers)
    .where(eq(answers.attemptId, id));

  const questionsReview = dbQuestions.map((q) => {
    const questionOptions = dbOptions.filter((o) => o.questionId === q.id);
    const userAnswer = userAnswers.find((a) => a.questionId === q.id);

    return {
      id: q.id,
      questionText: q.questionText,
      marks: q.marks,
      explanation: q.explanation,
      difficulty: q.difficulty,
      options: questionOptions,
      selectedOptionId: userAnswer ? userAnswer.selectedOptionId : null,
      isCorrect: userAnswer ? userAnswer.isCorrect : false,
    };
  });

  res.status(200).json({
    success: true,
    data: {
      attempt,
      questions: questionsReview,
    },
  });
});

export const getAnalytics = asyncHandler(async (req, res) => {
  // 1. Total students (role = STUDENT)
  const [studentsCount] = await db
    .select({ count: sql`count(*)::int` })
    .from(users)
    .where(eq(users.role, "STUDENT"));

  // 2. Total quizzes by status
  const quizzesCount = await db
    .select({
      status: quizzes.status,
      count: sql`count(*)::int`,
    })
    .from(quizzes)
    .groupBy(quizzes.status);

  // 3. Total questions count
  const [questionsCount] = await db
    .select({ count: sql`count(*)::int` })
    .from(questions);

  // 4. Total attempts
  const [attemptsCount] = await db
    .select({ count: sql`count(*)::int` })
    .from(attempts);

  // 5. Avg percentage score
  const [avgScore] = await db
    .select({ avg: sql`avg(${attempts.percentage})::decimal(5,2)` })
    .from(attempts)
    .where(sql`${attempts.status} != 'IN_PROGRESS'`);

  // 6. Pass/Fail counts
  const passFailBreakdown = await db
    .select({
      status: attempts.status,
      count: sql`count(*)::int`,
    })
    .from(attempts)
    .where(sql`${attempts.status} != 'IN_PROGRESS'`)
    .groupBy(attempts.status);

  // 7. Popular quizzes (top 5 by attempts count)
  const popularQuizzes = await db
    .select({
      quizId: quizzes.id,
      quizTitle: quizzes.title,
      attemptsCount: sql`count(${attempts.id})::int`,
    })
    .from(quizzes)
    .innerJoin(attempts, eq(quizzes.id, attempts.quizId))
    .groupBy(quizzes.id)
    .orderBy(sql`count(${attempts.id}) desc`)
    .limit(5);

  res.status(200).json({
    success: true,
    data: {
      totalStudents: studentsCount ? studentsCount.count : 0,
      quizzesBreakdown: quizzesCount,
      totalQuestions: questionsCount ? questionsCount.count : 0,
      totalAttempts: attemptsCount ? attemptsCount.count : 0,
      averagePercentage: avgScore ? avgScore.avg || "0.00" : "0.00",
      passFailBreakdown,
      popularQuizzes,
    },
  });
});

export const getLeaderboard = asyncHandler(async (req, res) => {
  // Top users ranked by average percentage score (among completed/passed quizzes)
  const ranks = await db
    .select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      averagePercentage: sql`avg(${attempts.percentage})::decimal(5,2)`,
      quizzesAttempted: sql`count(${attempts.id})::int`,
      quizzesPassed: sql`sum(case when ${attempts.status} = 'PASSED' then 1 else 0 end)::int`,
    })
    .from(users)
    .innerJoin(attempts, eq(users.id, attempts.userId))
    .where(sql`${attempts.status} != 'IN_PROGRESS'`)
    .groupBy(users.id)
    .orderBy(sql`avg(${attempts.percentage}) desc`)
    .limit(20);

  res.status(200).json({ success: true, data: ranks });
});
