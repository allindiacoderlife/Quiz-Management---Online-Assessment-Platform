import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { eq } from "drizzle-orm";

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

console.log("Environment variables initialized...");

// Dynamically import database client & schemas to ensure env variables are loaded first
const { db } = await import("../lib/db.js");
const { categories, quizzes, questions, options } = await import("./schema.js");

const sampleData = [
  {
    categoryName: "JavaScript",
    categoryDescription: "Assessments covering fundamentals, ES6+ features, async programming, and scope in JS.",
    quizzes: [
      {
        title: "JavaScript Basics",
        description: "Test your core knowledge on JS syntax, basic operators, data types, and standard scopes.",
        difficulty: "EASY",
        duration: 10,
        passingScore: 60,
        maxAttempts: 3,
        status: "PUBLISHED",
        questions: [
          {
            questionText: "What is the output of 'typeof null' in JavaScript?",
            marks: 1,
            explanation: "'typeof null' returns 'object' due to a historical bug in the first implementation of JavaScript where values were stored in 32-bit units with type tags.",
            difficulty: "EASY",
            options: [
              { optionText: "null", isCorrect: false },
              { optionText: "object", isCorrect: true },
              { optionText: "undefined", isCorrect: false },
              { optionText: "string", isCorrect: false }
            ]
          },
          {
            questionText: "Which keyword is used to declare block-scoped variables in JS?",
            marks: 1,
            explanation: "'let' and 'const' are block-scoped declarations, whereas 'var' is function-scoped.",
            difficulty: "EASY",
            options: [
              { optionText: "var", isCorrect: false },
              { optionText: "let", isCorrect: true },
              { optionText: "function", isCorrect: false },
              { optionText: "define", isCorrect: false }
            ]
          },
          {
            questionText: "Which array method is used to add one or more elements to the end of an array?",
            marks: 1,
            explanation: "push() adds one or more elements to the end of an array, while unshift() adds to the beginning.",
            difficulty: "EASY",
            options: [
              { optionText: "pop()", isCorrect: false },
              { optionText: "push()", isCorrect: true },
              { optionText: "shift()", isCorrect: false },
              { optionText: "unshift()", isCorrect: false }
            ]
          }
        ]
      },
      {
        title: "Advanced JavaScript",
        description: "Focuses on prototype chains, closures, execution context, event loop, and performance design.",
        difficulty: "HARD",
        duration: 15,
        passingScore: 70,
        maxAttempts: 2,
        status: "PUBLISHED",
        questions: [
          {
            questionText: "What is a closure in JavaScript?",
            marks: 2,
            explanation: "A closure is the combination of a function bundled together with references to its surrounding lexical state (variables).",
            difficulty: "HARD",
            options: [
              { optionText: "A method to close browser tabs", isCorrect: false },
              { optionText: "An inner function that has access to the outer function's scope", isCorrect: true },
              { optionText: "A way to lock database tables", isCorrect: false },
              { optionText: "The end of a loop block", isCorrect: false }
            ]
          },
          {
            questionText: "Which of the following is true regarding JavaScript event loop?",
            marks: 2,
            explanation: "The call stack executes first, and microtasks (like Promise callbacks) are executed before macrotasks (like setTimeout).",
            difficulty: "HARD",
            options: [
              { optionText: "setTimeout callbacks are run before Promise.then callbacks", isCorrect: false },
              { optionText: "Promise.then callbacks are executed as microtasks before macrotasks", isCorrect: true },
              { optionText: "The event loop runs on a separate CPU thread in standard browsers", isCorrect: false },
              { optionText: "Microtasks are executed in the macro-task queue", isCorrect: false }
            ]
          }
        ]
      }
    ]
  },
  {
    categoryName: "React",
    categoryDescription: "Assessments covering components lifecycle, state management, hook rules, and performance tweaks.",
    quizzes: [
      {
        title: "React Hooks in Practice",
        description: "Tests your comprehension of React Hooks (useState, useEffect, useMemo, etc.) and state updates.",
        difficulty: "INTERMEDIATE",
        duration: 12,
        passingScore: 60,
        maxAttempts: 2,
        status: "PUBLISHED",
        questions: [
          {
            questionText: "Which hook is used to perform side effects in functional components?",
            marks: 1,
            explanation: "useEffect is used to execute side effects like API requests, subscriptions, and DOM mutations in functional components.",
            difficulty: "INTERMEDIATE",
            options: [
              { optionText: "useState", isCorrect: false },
              { optionText: "useEffect", isCorrect: true },
              { optionText: "useContext", isCorrect: false },
              { optionText: "useReducer", isCorrect: false }
            ]
          },
          {
            questionText: "What is a core rule of React Hooks?",
            marks: 1,
            explanation: "Hooks must only be called at the top level of React function components or custom hooks, never inside conditionals, loops, or nested functions.",
            difficulty: "INTERMEDIATE",
            options: [
              { optionText: "Hooks can be executed conditionally inside if blocks", isCorrect: false },
              { optionText: "Hooks must be called at the top level of React functions", isCorrect: true },
              { optionText: "Hooks can be defined inside JavaScript loop constructs", isCorrect: false },
              { optionText: "Hooks can be run inside traditional class components", isCorrect: false }
            ]
          }
        ]
      }
    ]
  }
];

async function seed() {
  console.log("Seeding process started...");

  try {
    for (const group of sampleData) {
      console.log(`Seeding Category: ${group.categoryName}...`);
      
      // Insert category
      let categoryId;
      const [existingCategory] = await db.select().from(categories).where(eq(categories.name, group.categoryName));

      if (existingCategory) {
        categoryId = existingCategory.id;
        console.log(`Category "${group.categoryName}" already exists. ID: ${categoryId}`);
      } else {
        const [newCat] = await db.insert(categories).values({
          name: group.categoryName,
          description: group.categoryDescription
        }).returning();
        categoryId = newCat.id;
        console.log(`Inserted Category: ${group.categoryName}. ID: ${categoryId}`);
      }

      // Insert quizzes
      for (const quizData of group.quizzes) {
        console.log(`  Seeding Quiz: ${quizData.title}...`);
        
        // Check if quiz already exists
        const [existingQuiz] = await db.select().from(quizzes).where(eq(quizzes.title, quizData.title));

        let quizId;
        if (existingQuiz) {
          quizId = existingQuiz.id;
          console.log(`  Quiz "${quizData.title}" already exists. Skipping insertion.`);
        } else {
          const [newQuiz] = await db.insert(quizzes).values({
            title: quizData.title,
            description: quizData.description,
            categoryId: categoryId,
            difficulty: quizData.difficulty,
            duration: quizData.duration,
            passingScore: quizData.passingScore,
            maxAttempts: quizData.maxAttempts,
            status: quizData.status
          }).returning();
          quizId = newQuiz.id;
          console.log(`  Inserted Quiz: ${quizData.title}. ID: ${quizId}`);

          // Insert questions for new quiz
          for (const qData of quizData.questions) {
            const [newQ] = await db.insert(questions).values({
              quizId: quizId,
              questionText: qData.questionText,
              marks: qData.marks,
              explanation: qData.explanation,
              difficulty: qData.difficulty
            }).returning();

            // Insert options for question
            for (const oData of qData.options) {
              await db.insert(options).values({
                questionId: newQ.id,
                optionText: oData.optionText,
                isCorrect: oData.isCorrect
              });
            }
          }
          console.log(`    Seeded ${quizData.questions.length} questions and answers successfully.`);
        }
      }
    }

    console.log("🟢 Seeding database completed successfully!");
  } catch (error) {
    console.error("🔴 Database seeding failed:", error);
  } finally {
    process.exit(0);
  }
}

seed();
