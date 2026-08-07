import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api.js";
import Editor from "@monaco-editor/react";
import { 
  Plus, 
  ArrowLeft, 
  Pencil, 
  Trash2, 
  X, 
  AlertCircle, 
  Check, 
  HelpCircle, 
  Code2, 
  Eye, 
  ChevronRight,
  Terminal,
  Settings
} from "lucide-react";

const DEFAULT_TEMPLATES = {
  python: `import sys

def solve():
    # Read input from standard input
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    
    # Write logic here (e.g. return double of n)
    print(n * 2)

if __name__ == '__main__':
    solve()`,
  javascript: `const fs = require('fs');

function solve() {
    // Read input from standard input
    const input = fs.readFileSync(0, 'utf-8').trim();
    if (!input) return;
    const n = parseInt(input, 10);
    
    // Write logic here
    console.log(n * 2);
}

solve();`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    int n;
    if (cin >> n) {
        // Write logic here
        cout << n * 2 << endl;
    }
    return 0;
}`,
  c: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) == 1) {
        // Write logic here
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
            // Write logic here
            System.out.println(n * 2);
        }
    }
}`
};

export const AdminQuestions = () => {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Question Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("CREATE"); // "CREATE" or "EDIT"
  const [questionId, setQuestionId] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [marks, setMarks] = useState(1);
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState("INTERMEDIATE");
  const [type, setType] = useState("MCQ"); // "MCQ" or "CODING"
  const [modalError, setModalError] = useState("");
  const [saving, setSaving] = useState(false);

  // Dynamic Options (for MCQ)
  const [optionsList, setOptionsList] = useState([
    { optionText: "", isCorrect: false },
    { optionText: "", isCorrect: false },
  ]);

  // Coding Templates config
  const [codingTemplate, setCodingTemplate] = useState(DEFAULT_TEMPLATES);
  const [templateLangTab, setTemplateLangTab] = useState("python");

  // Test Cases list (for CODING)
  const [testCasesList, setTestCasesList] = useState([
    { input: "", expectedOutput: "", isSample: true },
  ]);

  useEffect(() => {
    fetchData();
  }, [quizId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [quizRes, questionsRes] = await Promise.all([
        api.get(`/quizzes/${quizId}`),
        api.get(`/quizzes/${quizId}/questions`),
      ]);
      setQuiz(quizRes.data);
      setQuestions(questionsRes.data);
    } catch (err) {
      setError(err.message || "Failed to load question details");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setModalMode("CREATE");
    setQuestionId("");
    setQuestionText("");
    setMarks(1);
    setExplanation("");
    setDifficulty("INTERMEDIATE");
    setType("MCQ");
    setOptionsList([
      { optionText: "", isCorrect: false },
      { optionText: "", isCorrect: false },
    ]);
    setCodingTemplate(DEFAULT_TEMPLATES);
    setTemplateLangTab("python");
    setTestCasesList([
      { input: "", expectedOutput: "", isSample: true },
    ]);
    setModalError("");
    setShowModal(true);
  };

  const handleOpenEdit = (q) => {
    setModalMode("EDIT");
    setQuestionId(q.id);
    setQuestionText(q.questionText);
    setMarks(q.marks);
    setExplanation(q.explanation || "");
    setDifficulty(q.difficulty);
    setType(q.type);

    if (q.type === "CODING") {
      setCodingTemplate(q.codingTemplate || DEFAULT_TEMPLATES);
      setTemplateLangTab("python");
      setTestCasesList(
        q.testCases && q.testCases.length > 0
          ? q.testCases.map((tc) => ({
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              isSample: tc.isSample,
            }))
          : [{ input: "", expectedOutput: "", isSample: true }]
      );
    } else {
      setOptionsList(
        q.options.map((o) => ({
          optionText: o.optionText,
          isCorrect: o.isCorrect,
        }))
      );
    }
    setModalError("");
    setShowModal(true);
  };

  // Option actions (MCQ)
  const handleOptionTextChange = (index, value) => {
    const updated = [...optionsList];
    updated[index].optionText = value;
    setOptionsList(updated);
  };

  const handleMarkCorrect = (index) => {
    setOptionsList(
      optionsList.map((o, idx) => ({
        ...o,
        isCorrect: idx === index,
      }))
    );
  };

  // Test Case actions (CODING)
  const handleTestCaseChange = (index, field, value) => {
    const updated = [...testCasesList];
    updated[index][field] = value;
    setTestCasesList(updated);
  };

  const handleAddTestCase = () => {
    setTestCasesList([...testCasesList, { input: "", expectedOutput: "", isSample: false }]);
  };

  const handleRemoveTestCase = (index) => {
    if (testCasesList.length <= 1) return;
    setTestCasesList(testCasesList.filter((_, idx) => idx !== index));
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setModalError("");
    setSaving(true);

    const payload = {
      questionText: questionText.trim(),
      marks: parseInt(marks, 10),
      explanation: explanation.trim(),
      difficulty,
      type,
    };

    if (type === "CODING") {
      const emptyTestCase = testCasesList.some((tc) => !tc.expectedOutput.trim());
      if (emptyTestCase) {
        setModalError("Expected output is required for all test cases.");
        setSaving(false);
        return;
      }
      payload.codingTemplate = codingTemplate;
      payload.testCasesList = testCasesList;
    } else {
      if (optionsList.length < 2) {
        setModalError("Please specify at least 2 options.");
        setSaving(false);
        return;
      }
      const emptyOption = optionsList.some((o) => !o.optionText.trim());
      if (emptyOption) {
        setModalError("All option text fields must be filled.");
        setSaving(false);
        return;
      }
      const hasCorrect = optionsList.some((o) => o.isCorrect);
      if (!hasCorrect) {
        setModalError("Please check one correct option.");
        setSaving(false);
        return;
      }
      payload.optionsList = optionsList;
    }

    try {
      if (modalMode === "CREATE") {
        await api.post(`/quizzes/${quizId}/questions`, payload);
      } else {
        await api.put(`/questions/${questionId}`, payload);
      }
      fetchData(); // reload
      setShowModal(false);
    } catch (err) {
      setModalError(err.message || "Failed to save question data");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return;
    }
    try {
      await api.delete(`/questions/${qId}`);
      setQuestions(questions.filter((q) => q.id !== qId));
    } catch (err) {
      alert(err.message || "Failed to delete question");
    }
  };

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case "EASY":
        return "bg-green-100 text-green-800 border-green-200";
      case "HARD":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-600">
        {error || "Quiz question bank details could not be found."}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Back button */}
      <div>
        <Link to="/admin/quizzes" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Quizzes</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">{quiz.title}</h1>
          <p className="text-xs text-slate-500 mt-1">Configure multiple choice options or compilation test cases.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Question</span>
        </button>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <HelpCircle className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-bold text-slate-800">No Questions Defined</h3>
          <p className="mt-2 text-sm text-slate-500">Create a question to activate the assessment quiz</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {questions.map((q, index) => {
            const isCodingQ = q.type === "CODING";
            return (
              <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-4">
                
                {/* Meta header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-3 text-xs font-semibold text-slate-500">
                  <span className="font-bold text-slate-850">Question {index + 1}</span>
                  <div className="flex items-center gap-3">
                    <span className="rounded bg-indigo-50 px-2 py-0.5 text-indigo-700 font-bold">{q.type}</span>
                    <span>Marks: {q.marks}</span>
                    <span className={`rounded border px-2 py-0.5 text-[10px] uppercase font-bold ${getDifficultyColor(q.difficulty)}`}>
                      {q.difficulty}
                    </span>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                      <button
                        onClick={() => handleOpenEdit(q)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                        title="Edit Question"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete Question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-display font-bold text-slate-900 leading-relaxed">{q.questionText}</h3>

                {/* Options vs Test Cases preview */}
                {isCodingQ ? (
                  <div className="flex flex-col gap-2.5">
                    <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Terminal className="h-4 w-4 text-indigo-500" />
                      <span>Test Cases Preview ({q.testCases?.length || 0})</span>
                    </span>
                    <div className="grid gap-2 border border-slate-150 rounded-xl p-3 bg-slate-50 text-xs">
                      {q.testCases && q.testCases.map((tc, tcIdx) => (
                        <div key={tc.id} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between py-1.5 border-b border-slate-200/50 last:border-b-0">
                          <span className="text-slate-600">
                            TC {tcIdx + 1}: Input: <strong className="text-slate-900">{tc.input || "<none>"}</strong> Expected: <strong className="text-slate-900">{tc.expectedOutput}</strong>
                          </span>
                          {tc.isSample && (
                            <span className="rounded bg-indigo-150 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700">
                              SAMPLE
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {q.options.map((option) => (
                      <div
                        key={option.id}
                        className={`flex items-start gap-2.5 rounded-xl border p-4 text-sm font-semibold ${
                          option.isCorrect
                            ? "border-green-300 bg-green-50 text-green-950"
                            : "border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        <div className={`mt-0.5 h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 ${
                          option.isCorrect ? "border-green-600 bg-green-600 text-white" : "border-slate-300 bg-white"
                        }`}>
                          {option.isCorrect && <Check className="h-3 w-3" />}
                        </div>
                        <span>{option.optionText}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Explanation block */}
                {q.explanation && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600 leading-relaxed">
                    <strong>Explanation: </strong>
                    <span>{q.explanation}</span>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Question Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-lg font-bold text-slate-900 font-display">
                {modalMode === "CREATE" ? "New Assessment Question" : "Edit Question Details"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-600 font-semibold flex items-start gap-1.5 animate-shake">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveQuestion} className="flex flex-col gap-4 overflow-y-auto pr-1">
              
              {/* Question Text */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Question Content</label>
                <textarea
                  placeholder="Enter the question query details here..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  rows={2}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  required
                  disabled={saving}
                />
              </div>

              {/* Specs parameters row */}
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Question Type Toggle */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Question Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none cursor-pointer"
                    disabled={saving || modalMode === "EDIT"} // lock type edit to prevent relational conflicts
                  >
                    <option value="MCQ">Multiple Choice (MCQ)</option>
                    <option value="CODING">Coding Task / Compiler</option>
                  </select>
                </div>

                {/* Marks */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Marks</label>
                  <input
                    type="number"
                    min={1}
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                    required
                    disabled={saving}
                  />
                </div>

                {/* Difficulty */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none cursor-pointer"
                    disabled={saving}
                  >
                    <option value="EASY">Easy</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Type rendering */}
              {type === "CODING" ? (
                /* Coding tasks configuration details */
                <div className="flex flex-col gap-4 border-t border-slate-100 pt-3">
                  
                  {/* Language tab configuration panel */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Language Templates</label>
                    <div className="flex border-b border-slate-200 pb-1.5 gap-2">
                      {["python", "javascript", "java", "c", "cpp"].map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setTemplateLangTab(lang)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors capitalize ${
                            templateLangTab === lang
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {lang === "cpp" ? "C++" : lang}
                        </button>
                      ))}
                    </div>

                    {/* Monaco template editor */}
                    <div className="rounded-lg overflow-hidden border border-slate-200 mt-1.5">
                      <Editor
                        height="180px"
                        language={templateLangTab === "cpp" ? "cpp" : templateLangTab === "javascript" ? "javascript" : templateLangTab}
                        value={codingTemplate[templateLangTab]}
                        onChange={(val) => setCodingTemplate(prev => ({ ...prev, [templateLangTab]: val }))}
                        theme="vs-dark"
                        options={{
                          minimap: { enabled: false },
                          fontSize: 12,
                          automaticLayout: true,
                        }}
                      />
                    </div>
                  </div>

                  {/* Test Cases Panel */}
                  <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Test Cases</label>
                      <button
                        type="button"
                        onClick={handleAddTestCase}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                      >
                        + Add Test Case
                      </button>
                    </div>

                    <div className="flex flex-col gap-3">
                      {testCasesList.map((tc, idx) => (
                        <div key={idx} className="rounded-xl border border-slate-150 p-3 bg-slate-50/60 flex flex-col gap-2.5 relative">
                          <div className="grid gap-3 sm:grid-cols-2">
                            {/* Input */}
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-500 font-bold uppercase">Stdin Input</span>
                              <textarea
                                placeholder="e.g. 5"
                                value={tc.input}
                                onChange={(e) => handleTestCaseChange(idx, "input", e.target.value)}
                                rows={2}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-850 placeholder-slate-400 focus:outline-none"
                              />
                            </div>

                            {/* Output */}
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-500 font-bold uppercase">Expected Output (Stdout)</span>
                              <textarea
                                placeholder="e.g. 10"
                                value={tc.expectedOutput}
                                onChange={(e) => handleTestCaseChange(idx, "expectedOutput", e.target.value)}
                                rows={2}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-850 placeholder-slate-400 focus:outline-none"
                                required
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-200/50 pt-2 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-semibold select-none">
                              <input
                                type="checkbox"
                                checked={tc.isSample}
                                onChange={(e) => handleTestCaseChange(idx, "isSample", e.target.checked)}
                                className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                              <span>Is Sample Test Case (Shown to Students)</span>
                            </label>

                            {testCasesList.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveTestCase(idx)}
                                className="text-red-500 hover:text-red-700 font-bold"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                /* MCQ options configured */
                <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Multiple Choice Options</label>
                    {optionsList.length < 6 && (
                      <button
                        type="button"
                        onClick={() => setOptionsList([...optionsList, { optionText: "", isCorrect: false }])}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                      >
                        + Add Option
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {optionsList.map((option, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleMarkCorrect(idx)}
                          className={`h-7 w-7 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                            option.isCorrect
                              ? "border-green-600 bg-green-600 text-white shadow-sm"
                              : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"
                          }`}
                          title="Mark as correct answer"
                        >
                          <Check className="h-4.5 w-4.5" />
                        </button>

                        <input
                          type="text"
                          placeholder={`Option ${idx + 1} text`}
                          value={option.optionText}
                          onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                          className={`flex-1 rounded-lg border px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none ${
                            option.isCorrect ? "border-green-300 focus:border-green-500" : "border-slate-200 focus:border-indigo-500"
                          }`}
                          required
                          disabled={saving}
                        />

                        {optionsList.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setOptionsList(optionsList.filter((_, oIdx) => oIdx !== idx))}
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-red-650"
                            title="Remove option"
                          >
                            <X className="h-4.5 w-4.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanation textarea */}
              <div className="flex flex-col gap-1 border-t border-slate-100 pt-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Correct Answer Explanation</label>
                <textarea
                  placeholder="Summarize the core concepts / details why this solution is correct..."
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  rows={2}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  disabled={saving}
                />
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !questionText.trim()}
                  className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 disabled:bg-slate-400 flex items-center justify-center"
                >
                  {saving ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    "Save Question"
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminQuestions;
