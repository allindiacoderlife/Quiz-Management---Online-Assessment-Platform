import { db } from "../lib/db.js";
import {
  attempts,
  quizzes,
  questions,
  options,
  answers,
  categories,
  testCases,
} from "../db/schema.js";
import { eq, and, sql, inArray } from "drizzle-orm";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { executeCode } from "../services/compiler.service.js";

export const startAttempt = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user.id;

  // 1. Verify quiz exists and is PUBLISHED
  const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, quizId));

  if (!quiz) {
    throw new ApiError(404, "Quiz not found");
  }

  if (quiz.status !== "PUBLISHED") {
    throw new ApiError(403, "This quiz is currently unavailable");
  }

  // 2. Verify attempts limit
  const [attemptsCount] = await db
    .select({ count: sql`count(*)::int` })
    .from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.quizId, quizId)));

  if (attemptsCount && attemptsCount.count >= quiz.maxAttempts) {
    throw new ApiError(
      400,
      `You have reached the maximum allowed attempts (${quiz.maxAttempts}) for this quiz.`,
    );
  }

  // 3. Fetch questions and options
  const qList = await db
    .select()
    .from(questions)
    .where(eq(questions.quizId, quizId));

  const questionIds = qList.map((q) => q.id);

  let optsList = [];
  if (questionIds.length > 0) {
    optsList = await db
      .select({
        id: options.id,
        questionId: options.questionId,
        optionText: options.optionText,
      })
      .from(options)
      .where(inArray(options.questionId, questionIds));
  }

  // 4. Create new attempt record in database
  const [newAttempt] = await db
    .insert(attempts)
    .values({
      quizId,
      userId,
      score: 0,
      percentage: "0.00",
      correctAnswers: 0,
      incorrectAnswers: 0,
      unanswered: 0,
      timeTaken: 0,
      status: "IN_PROGRESS",
      startedAt: new Date(),
    })
    .returning();

  // 5. Structure questions list, stripping answers and explanations for security
  const structuredQuestions = qList.map((q) => ({
    id: q.id,
    questionText: q.questionText,
    marks: q.marks,
    difficulty: q.difficulty,
    type: q.type,
    codingTemplate: q.codingTemplate ? JSON.parse(q.codingTemplate) : null,
    options:
      q.type === "MCQ" ? optsList.filter((o) => o.questionId === q.id) : [],
  }));

  res.status(201).json({
    success: true,
    message: "Quiz attempt started successfully",
    data: {
      attemptId: newAttempt.id,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        duration: quiz.duration,
        passingScore: quiz.passingScore,
      },
      questions: structuredQuestions,
    },
  });
});

export const submitAttempt = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const { attemptId, answers: submittedAnswers } = req.body;
  const userId = req.user.id;

  if (!attemptId || !submittedAnswers || !Array.isArray(submittedAnswers)) {
    throw new ApiError(400, "Attempt ID and answers list are required");
  }

  // 1. Fetch attempt and confirm it is active
  const [attempt] = await db
    .select()
    .from(attempts)
    .where(
      and(
        eq(attempts.id, attemptId),
        eq(attempts.userId, userId),
        eq(attempts.status, "IN_PROGRESS"),
      ),
    );

  if (!attempt) {
    throw new ApiError(404, "Active quiz attempt not found");
  }

  // 2. Fetch quiz details
  const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, quizId));

  if (!quiz) {
    throw new ApiError(404, "Quiz associated with attempt not found");
  }

  // 3. Fetch questions and options with correct key mappings
  const dbQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.quizId, quizId));

  const questionIds = dbQuestions.map((q) => q.id);

  let dbOptions = [];
  if (questionIds.length > 0) {
    dbOptions = await db
      .select()
      .from(options)
      .where(inArray(options.questionId, questionIds));
  }

  // 4. Evaluate responses
  let totalMarks = 0;
  let obtainedMarks = 0;
  let correctAnswers = 0;
  let incorrectAnswers = 0;
  let unanswered = 0;
  const answersToInsert = [];

  for (const q of dbQuestions) {
    totalMarks += q.marks;

    const answer = submittedAnswers.find((ans) => ans.questionId === q.id);

    if (q.type === "CODING") {
      const code = answer?.submittedCode;
      const language = answer?.submittedLanguage;

      if (!code || !language) {
        unanswered++;
        answersToInsert.push({
          attemptId,
          questionId: q.id,
          isCorrect: false,
          submittedCode: null,
          submittedLanguage: null,
          passedCount: 0,
          totalCount: 0,
        });
      } else {
        // Fetch test cases for coding evaluation
        const qTestCases = await db
          .select()
          .from(testCases)
          .where(eq(testCases.questionId, q.id));

        if (qTestCases.length === 0) {
          // If no test cases defined, default to correct
          correctAnswers++;
          obtainedMarks += q.marks;
          answersToInsert.push({
            attemptId,
            questionId: q.id,
            isCorrect: true,
            submittedCode: code,
            submittedLanguage: language,
            passedCount: 0,
            totalCount: 0,
          });
        } else {
          // Run execution in parallel
          const runPromises = qTestCases.map(async (tc) => {
            try {
              const runRes = await executeCode(language, code, tc.input);
              const passed =
                !runRes.error &&
                runRes.output.trim() === tc.expectedOutput.trim();
              return passed;
            } catch (err) {
              return false;
            }
          });

          const results = await Promise.all(runPromises);
          const passedCount = results.filter(Boolean).length;
          const isCorrect = passedCount === qTestCases.length;

          if (isCorrect) {
            correctAnswers++;
            obtainedMarks += q.marks;
          } else {
            incorrectAnswers++;
          }

          answersToInsert.push({
            attemptId,
            questionId: q.id,
            isCorrect,
            submittedCode: code,
            submittedLanguage: language,
            passedCount,
            totalCount: qTestCases.length,
          });
        }
      }
    } else {
      // Standard MCQ Evaluation
      const selectedOptionId = answer ? answer.selectedOptionId : null;

      if (!selectedOptionId) {
        unanswered++;
        answersToInsert.push({
          attemptId,
          questionId: q.id,
          selectedOptionId: null,
          isCorrect: false,
        });
      } else {
        const qOptions = dbOptions.filter((o) => o.questionId === q.id);
        const chosenOption = qOptions.find((o) => o.id === selectedOptionId);

        if (!chosenOption) {
          incorrectAnswers++;
          answersToInsert.push({
            attemptId,
            questionId: q.id,
            selectedOptionId,
            isCorrect: false,
          });
        } else {
          const isCorrect = chosenOption.isCorrect;
          if (isCorrect) {
            correctAnswers++;
            obtainedMarks += q.marks;
          } else {
            incorrectAnswers++;
          }

          answersToInsert.push({
            attemptId,
            questionId: q.id,
            selectedOptionId,
            isCorrect,
          });
        }
      }
    }
  }

  const percentage =
    totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(2) : "0.00";
  const status =
    parseFloat(percentage) >= quiz.passingScore ? "PASSED" : "FAILED";
  const timeTaken = Math.round(
    (new Date() - new Date(attempt.startedAt)) / 1000,
  ); // in seconds

  // 5. Save all records (No transactions over neon-http driver)
  if (answersToInsert.length > 0) {
    await db.insert(answers).values(answersToInsert);
  }

  // Update attempt record
  const [updatedAttempt] = await db
    .update(attempts)
    .set({
      score: obtainedMarks,
      percentage,
      correctAnswers,
      incorrectAnswers,
      unanswered,
      timeTaken,
      status,
      completedAt: new Date(),
    })
    .where(eq(attempts.id, attemptId))
    .returning();

  const result = updatedAttempt;

  res.status(200).json({
    success: true,
    message: "Quiz attempt submitted successfully",
    data: result,
  });
});

export const getAttempts = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const list = await db
    .select({
      id: attempts.id,
      score: attempts.score,
      percentage: attempts.percentage,
      status: attempts.status,
      timeTaken: attempts.timeTaken,
      startedAt: attempts.startedAt,
      completedAt: attempts.completedAt,
      quizTitle: quizzes.title,
      quizDifficulty: quizzes.difficulty,
    })
    .from(attempts)
    .innerJoin(quizzes, eq(attempts.quizId, quizzes.id))
    .where(eq(attempts.userId, userId))
    .orderBy(sql`${attempts.startedAt} desc`);

  res.status(200).json({ success: true, data: list });
});

export const getAttemptById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  // 1. Fetch attempt and verify ownership (unless user is ADMIN)
  let conditions = eq(attempts.id, id);
  if (userRole !== "ADMIN") {
    conditions = and(conditions, eq(attempts.userId, userId));
  }

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
      quizDescription: quizzes.description,
      categoryName: categories.name,
      passingScore: quizzes.passingScore,
    })
    .from(attempts)
    .innerJoin(quizzes, eq(attempts.quizId, quizzes.id))
    .leftJoin(categories, eq(quizzes.categoryId, categories.id))
    .where(conditions);

  if (!attempt) {
    throw new ApiError(404, "Quiz attempt not found or unauthorized");
  }

  // 2. Fetch questions and options
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

  // 3. Fetch user submitted answers
  const userAnswers = await db
    .select()
    .from(answers)
    .where(eq(answers.attemptId, id));

  // 4. Map questions with options and highlight user selections
  const questionsReview = dbQuestions.map((q) => {
    const questionOptions =
      q.type === "MCQ" ? dbOptions.filter((o) => o.questionId === q.id) : [];
    const userAnswer = userAnswers.find((a) => a.questionId === q.id);

    return {
      id: q.id,
      questionText: q.questionText,
      marks: q.marks,
      explanation: q.explanation,
      difficulty: q.difficulty,
      type: q.type,
      codingTemplate: q.codingTemplate ? JSON.parse(q.codingTemplate) : null,
      options: questionOptions,
      selectedOptionId: userAnswer ? userAnswer.selectedOptionId : null,
      isCorrect: userAnswer ? userAnswer.isCorrect : false,
      submittedCode: userAnswer ? userAnswer.submittedCode : null,
      submittedLanguage: userAnswer ? userAnswer.submittedLanguage : null,
      passedCount: userAnswer ? userAnswer.passedCount : null,
      totalCount: userAnswer ? userAnswer.totalCount : null,
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

export const runCodeAgainstSamples = asyncHandler(async (req, res) => {
  const { questionId, code, language } = req.body;

  if (!questionId || !code || !language) {
    throw new ApiError(
      400,
      "Question ID, code, and language parameters are required",
    );
  }

  // 1. Verify question exists and is CODING type
  const [question] = await db
    .select()
    .from(questions)
    .where(eq(questions.id, questionId));

  if (!question) {
    throw new ApiError(404, "Question details not found");
  }

  if (question.type !== "CODING") {
    throw new ApiError(400, "This question does not support code execution");
  }

  // 2. Fetch sample test cases
  const sampleTestCases = await db
    .select()
    .from(testCases)
    .where(
      and(eq(testCases.questionId, questionId), eq(testCases.isSample, true)),
    );

  if (sampleTestCases.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No sample test cases configured for this question",
      results: [],
    });
  }

  // 3. Execute code in parallel against sample test cases
  const executionPromises = sampleTestCases.map(async (tc) => {
    const execRes = await executeCode(language, code, tc.input);
    const passed =
      !execRes.error && execRes.output.trim() === tc.expectedOutput.trim();

    return {
      input: tc.input,
      expected: tc.expectedOutput,
      output: execRes.output,
      error: execRes.error,
      passed,
      timeout: execRes.timeout,
    };
  });

  const runResults = await Promise.all(executionPromises);

  res.status(200).json({
    success: true,
    message: "Code execution finished",
    results: runResults,
  });
});
