/**
 * Execute code inside a secure sandbox using public Judge0 Community Edition API
 * @param {string} language - python, javascript, java, c, cpp
 * @param {string} code - source code string
 * @param {string} input - input passed to standard input (stdin)
 * @returns {Promise<{ output: string, error: string, timeout: boolean }>}
 */
export const executeCode = async (language, code, input = "") => {
  const langLower = language.toLowerCase();
  let languageId = 71; // Default to Python (3.8.1)

  switch (langLower) {
    case "python":
    case "python3":
    case "py":
      languageId = 71;
      break;
    case "javascript":
    case "js":
    case "node":
      languageId = 93; // Node.js 18.15.0
      break;
    case "cpp":
    case "c++":
      languageId = 54; // C++ (GCC 9.2.0)
      break;
    case "c":
      languageId = 50; // C (GCC 9.2.0)
      break;
    case "java":
      languageId = 62; // Java (OpenJDK 13.0.1)
      break;
  }

  try {
    const response = await fetch("https://ce.judge0.com/submissions?wait=true&base64_encoded=false", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_code: code,
        language_id: languageId,
        stdin: input,
      }),
    });

    if (!response.ok) {
      throw new Error(`Execution sandbox API returned status ${response.status}`);
    }

    const data = await response.json();

    const stdout = data.stdout || "";
    const stderr = data.stderr || "";
    const compileOutput = data.compile_output || "";
    
    // Status ID 5 is Time Limit Exceeded (TLE) in Judge0
    const statusId = data.status?.id;
    const isTimeout = statusId === 5;
    
    let errorMsg = compileOutput || stderr;
    if (statusId !== 3 && !errorMsg && data.status?.description) {
      if (statusId !== 1 && statusId !== 2) { // 1 = In Queue, 2 = Processing
        errorMsg = data.status.description;
      }
    }

    return {
      output: stdout,
      error: errorMsg,
      timeout: isTimeout,
    };
  } catch (err) {
    return {
      output: "",
      error: `Code execution service error: ${err.message}`,
      timeout: false,
    };
  }
};
