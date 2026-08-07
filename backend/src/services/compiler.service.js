import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_DIR = path.join(__dirname, "../temp_exec");

// Ensure temp execution directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Execute code inside a secure local subprocess
 * @param {string} language - python, javascript, java, c, cpp
 * @param {string} code - source code string
 * @param {string} input - input passed to standard input (stdin)
 * @param {number} timeoutMs - execution time limit in milliseconds
 * @returns {Promise<{ output: string, error: string, timeout: boolean }>}
 */
export const executeCode = (language, code, input = "", timeoutMs = 4000) => {
  return new Promise((resolve) => {
    const runId = crypto.randomUUID();
    const subDir = path.join(TEMP_DIR, runId);
    fs.mkdirSync(subDir, { recursive: true });

    let sourceFilePath = "";
    let compileCmd = "";
    let compileArgs = [];
    let runCmd = "";
    let runArgs = [];

    const langLower = language.toLowerCase();

    // Setup compile/run params based on language type
    switch (langLower) {
      case "python":
      case "python3":
        sourceFilePath = path.join(subDir, "solution.py");
        runCmd = process.platform === "win32" ? "python" : "python3";
        runArgs = [sourceFilePath];
        break;

      case "javascript":
      case "js":
        sourceFilePath = path.join(subDir, "solution.js");
        runCmd = "node";
        runArgs = [sourceFilePath];
        break;

      case "cpp":
      case "c++":
        sourceFilePath = path.join(subDir, "solution.cpp");
        const exePathCpp = path.join(subDir, process.platform === "win32" ? "solution.exe" : "solution.out");
        compileCmd = "g++";
        compileArgs = [sourceFilePath, "-o", exePathCpp];
        runCmd = exePathCpp;
        runArgs = [];
        break;

      case "c":
        sourceFilePath = path.join(subDir, "solution.c");
        const exePathC = path.join(subDir, process.platform === "win32" ? "solution.exe" : "solution.out");
        compileCmd = "gcc";
        compileArgs = [sourceFilePath, "-o", exePathC];
        runCmd = exePathC;
        runArgs = [];
        break;

      case "java":
        // Java requires file name to match the public class (typically Main)
        sourceFilePath = path.join(subDir, "Main.java");
        compileCmd = "javac";
        compileArgs = [sourceFilePath];
        runCmd = "java";
        runArgs = ["-cp", subDir, "Main"];
        break;

      default:
        resolve({
          output: "",
          error: `Unsupported language: ${language}`,
          timeout: false,
        });
        cleanUpDir(subDir);
        return;
    }

    try {
      // Write source code file
      fs.writeFileSync(sourceFilePath, code);
    } catch (writeErr) {
      resolve({
        output: "",
        error: `System write error: ${writeErr.message}`,
        timeout: false,
      });
      cleanUpDir(subDir);
      return;
    }

    // Helper: Execute the run command
    const startRunning = () => {
      let stdoutData = "";
      let stderrData = "";
      let isTimedOut = false;

      const child = spawn(runCmd, runArgs, { cwd: subDir });

      // Handle standard input (stdin)
      if (input) {
        child.stdin.write(input);
        child.stdin.end();
      } else {
        child.stdin.end();
      }

      // Handle standard output (stdout)
      child.stdout.on("data", (data) => {
        stdoutData += data.toString();
      });

      // Handle standard error (stderr)
      child.stderr.on("data", (data) => {
        stderrData += data.toString();
      });

      // Set timeout threshold
      const timeout = setTimeout(() => {
        isTimedOut = true;
        child.kill("SIGKILL");
      }, timeoutMs);

      child.on("close", (code) => {
        clearTimeout(timeout);
        cleanUpDir(subDir);

        if (isTimedOut) {
          resolve({
            output: "",
            error: "Time Limit Exceeded (TLE)",
            timeout: true,
          });
        } else {
          resolve({
            output: stdoutData,
            error: stderrData || (code !== 0 ? `Execution failed with exit code ${code}` : ""),
            timeout: false,
          });
        }
      });

      child.on("error", (err) => {
        clearTimeout(timeout);
        cleanUpDir(subDir);
        resolve({
          output: "",
          error: `Execution command error: ${err.message}. Make sure the interpreter/runtime is installed on the host system.`,
          timeout: false,
        });
      });
    };

    // Compile if necessary, then run
    if (compileCmd) {
      const compiler = spawn(compileCmd, compileArgs, { cwd: subDir });
      let compileErrors = "";

      compiler.stderr.on("data", (data) => {
        compileErrors += data.toString();
      });

      compiler.on("close", (code) => {
        if (code !== 0) {
          cleanUpDir(subDir);
          resolve({
            output: "",
            error: `Compilation Error:\n${compileErrors}`,
            timeout: false,
          });
        } else {
          // Compiled successfully, proceed to execution
          startRunning();
        }
      });

      compiler.on("error", (err) => {
        cleanUpDir(subDir);
        resolve({
          output: "",
          error: `Compiler command error: ${err.message}. Make sure compiler tools (${compileCmd}) are installed.`,
          timeout: false,
        });
      });
    } else {
      // Non-compiled language, run immediately
      startRunning();
    }
  });
};

/**
 * Remove directory recursively
 */
const cleanUpDir = (dirPath) => {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch (err) {
    console.error("Cleanup error:", err);
  }
};
