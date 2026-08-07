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
const { categories, quizzes, questions, testCases } = await import("./schema.js");

const CODING_TEMPLATES = {
  python: `import sys

def solve():
    # Read input from standard input
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    
    # Write logic here to print double of n
    print(n * 2)

if __name__ == '__main__':
    solve()`,
  javascript: `const fs = require('fs');

function solve() {
    // Read input from standard input
    const input = fs.readFileSync(0, 'utf-8').trim();
    if (!input) return;
    const n = parseInt(input, 10);
    
    // Write logic here to print double of n
    console.log(n * 2);
}

solve();`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    int n;
    if (cin >> n) {
        // Write logic here to print double of n
        cout << n * 2 << endl;
    }
    return 0;
}`,
  c: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) == 1) {
        // Write logic here to print double of n
        printf("%d\\n", n * 2);
    }
    return 0;
}`,
  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (scanner.hasNextInt()) {
            int n = scanner.nextInt();
            // Write logic here to print double of n
            System.out.println(n * 2);
        }
    }
}`
};

const codingData = {
  categoryName: "Data Structures & Algorithms",
  categoryDescription: "Practical coding challenges focusing on algorithmic efficiency, compilation correctness, and edge cases.",
  quiz: {
    title: "DSA Coding Challenge",
    description: "Submit written code in Python, JS, C++, C, or Java. Solutions are compiled and evaluated against hidden test cases.",
    difficulty: "INTERMEDIATE",
    duration: 30,
    passingScore: 100, // requires passing all questions
    maxAttempts: 5,
    status: "PUBLISHED",
    questions: [
      {
        questionText: "Write a program that reads an integer N from standard input (stdin) and prints its double (N * 2) to standard output (stdout).",
        marks: 10,
        explanation: "The solution reads the input number using standard input methods for the chosen language, multiplies it by 2, and prints the output.",
        difficulty: "EASY",
        type: "CODING",
        codingTemplate: JSON.stringify(CODING_TEMPLATES),
        testCases: [
          { input: "5", expectedOutput: "10", isSample: true },
          { input: "12", expectedOutput: "24", isSample: true },
          { input: "-3", expectedOutput: "-6", isSample: false },
          { input: "0", expectedOutput: "0", isSample: false }
        ]
      }
    ]
  }
};

async function seedCoding() {
  console.log("Seeding coding data started...");

  try {
    // 1. Insert/Get Category
    let categoryId;
    const [existingCategory] = await db
      .select()
      .from(categories)
      .where(eq(categories.name, codingData.categoryName));

    if (existingCategory) {
      categoryId = existingCategory.id;
      console.log(`Category "${codingData.categoryName}" already exists. ID: ${categoryId}`);
    } else {
      const [newCat] = await db.insert(categories).values({
        name: codingData.categoryName,
        description: codingData.categoryDescription
      }).returning();
      categoryId = newCat.id;
      console.log(`Inserted Category: ${codingData.categoryName}. ID: ${categoryId}`);
    }

    // 2. Insert Quiz
    const [existingQuiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.title, codingData.quiz.title));

    if (existingQuiz) {
      console.log(`Quiz "${codingData.quiz.title}" already exists. Skipping.`);
    } else {
      const [newQuiz] = await db.insert(quizzes).values({
        title: codingData.quiz.title,
        description: codingData.quiz.description,
        categoryId: categoryId,
        difficulty: codingData.quiz.difficulty,
        duration: codingData.quiz.duration,
        passingScore: codingData.quiz.passingScore,
        maxAttempts: codingData.quiz.maxAttempts,
        status: codingData.quiz.status
      }).returning();
      console.log(`Inserted Quiz: ${codingData.quiz.title}. ID: ${newQuiz.id}`);

      // 3. Insert Coding Questions & Test Cases
      for (const qData of codingData.quiz.questions) {
        const [newQ] = await db.insert(questions).values({
          quizId: newQuiz.id,
          questionText: qData.questionText,
          marks: qData.marks,
          explanation: qData.explanation,
          difficulty: qData.difficulty,
          type: qData.type,
          codingTemplate: qData.codingTemplate
        }).returning();
        console.log(`  Inserted Coding Question. ID: ${newQ.id}`);

        // Insert Test Cases
        for (const tcData of qData.testCases) {
          await db.insert(testCases).values({
            questionId: newQ.id,
            input: tcData.input,
            expectedOutput: tcData.expectedOutput,
            isSample: tcData.isSample
          });
        }
        console.log(`    Seeded ${qData.testCases.length} compilation test cases.`);
      }
    }

    console.log("🟢 Seeding coding questions completed successfully!");
  } catch (error) {
    console.error("🔴 Seeding coding questions failed:", error);
  } finally {
    process.exit(0);
  }
}

seedCoding();
