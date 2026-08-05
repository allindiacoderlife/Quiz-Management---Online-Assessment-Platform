import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ==========================================
// ENUMS
// ==========================================

export const roleEnum = pgEnum("role", ["ADMIN", "STUDENT"]);
export const userStatusEnum = pgEnum("user_status", ["ACTIVE", "INACTIVE"]);
export const quizStatusEnum = pgEnum("quiz_status", [
  "DRAFT",
  "PUBLISHED",
  "UNPUBLISHED",
]);
export const difficultyEnum = pgEnum("difficulty", [
  "EASY",
  "INTERMEDIATE",
  "HARD",
]);
export const attemptStatusEnum = pgEnum("attempt_status", [
  "PASSED",
  "FAILED",
  "IN_PROGRESS",
]);

// ==========================================
// TABLES
// ==========================================

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").default("STUDENT").notNull(),
  status: userStatusEnum("status").default("ACTIVE").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quizzes = pgTable("quizzes", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  difficulty: difficultyEnum("difficulty").default("INTERMEDIATE").notNull(),
  duration: integer("duration").notNull(), // in minutes
  passingScore: integer("passing_score").notNull(), // percentage (e.g., 60)
  maxAttempts: integer("max_attempts").default(1).notNull(),
  status: quizStatusEnum("status").default("DRAFT").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  quizId: uuid("quiz_id")
    .references(() => quizzes.id, { onDelete: "cascade" })
    .notNull(),
  questionText: text("question_text").notNull(),
  marks: integer("marks").default(1).notNull(),
  explanation: text("explanation"),
  difficulty: difficultyEnum("difficulty").default("INTERMEDIATE").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const options = pgTable("options", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id")
    .references(() => questions.id, { onDelete: "cascade" })
    .notNull(),
  optionText: text("option_text").notNull(),
  isCorrect: boolean("is_correct").default(false).notNull(),
});

export const attempts = pgTable("attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  quizId: uuid("quiz_id")
    .references(() => quizzes.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  score: integer("score").notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  incorrectAnswers: integer("incorrect_answers").notNull(),
  unanswered: integer("unanswered").notNull(),
  timeTaken: integer("time_taken").notNull(), // in seconds
  status: attemptStatusEnum("status").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const answers = pgTable("answers", {
  id: uuid("id").defaultRandom().primaryKey(),
  attemptId: uuid("attempt_id")
    .references(() => attempts.id, { onDelete: "cascade" })
    .notNull(),
  questionId: uuid("question_id")
    .references(() => questions.id, { onDelete: "cascade" })
    .notNull(),
  // selectedOptionId is nullable because a user might skip an answer (leave it unanswered)
  selectedOptionId: uuid("selected_option_id").references(() => options.id, {
    onDelete: "set null",
  }),
  isCorrect: boolean("is_correct").notNull(),
});

// ==========================================
// RELATIONS (For Drizzle Queries)
// ==========================================

export const usersRelations = relations(users, ({ many }) => ({
  attempts: many(attempts),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  quizzes: many(quizzes),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  category: one(categories, {
    fields: [quizzes.categoryId],
    references: [categories.id],
  }),
  questions: many(questions),
  attempts: many(attempts),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  quiz: one(quizzes, {
    fields: [questions.quizId],
    references: [quizzes.id],
  }),
  options: many(options),
}));

export const optionsRelations = relations(options, ({ one }) => ({
  question: one(questions, {
    fields: [options.questionId],
    references: [questions.id],
  }),
}));

export const attemptsRelations = relations(attempts, ({ one, many }) => ({
  user: one(users, {
    fields: [attempts.userId],
    references: [users.id],
  }),
  quiz: one(quizzes, {
    fields: [attempts.quizId],
    references: [quizzes.id],
  }),
  answers: many(answers),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  attempt: one(attempts, {
    fields: [answers.attemptId],
    references: [attempts.id],
  }),
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
  selectedOption: one(options, {
    fields: [answers.selectedOptionId],
    references: [options.id],
  }),
}));
