"use client";

import { useState } from "react";
import { Loader, CheckCircle, XCircle } from "lucide-react";
import { QuizResult, AnswerEvaluation, ShortAnswerForEvaluation } from "@/lib/types";

interface EvaluateShortAnswersViewProps {
  result: QuizResult;
  shortAnswers: ShortAnswerForEvaluation[];
  onEvaluated: (result: QuizResult) => void;
  onBackToDashboard: () => void;
}

export function EvaluateShortAnswersView({
  result,
  shortAnswers,
  onEvaluated,
  onBackToDashboard
}: EvaluateShortAnswersViewProps) {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluations, setEvaluations] = useState<AnswerEvaluation[]>([]);
  const [hasEvaluated, setHasEvaluated] = useState(false);

  const handleEvaluate = async () => {
    setIsEvaluating(true);
    try {
      const response = await fetch("/api/batch-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: shortAnswers })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Evaluation failed");
      }

      setEvaluations(data.evaluations);
      setHasEvaluated(true);

      // Calculate new correct count
      const newCorrectCount =
        result.correct + data.evaluations.filter((e: AnswerEvaluation) => e.isCorrect).length;
      const newIncorrectCount = result.total - newCorrectCount;

      // Update result with evaluations
      const updatedResult: QuizResult = {
        ...result,
        correct: newCorrectCount,
        incorrect: newIncorrectCount,
        evaluations: data.evaluations
      };

      // Update answers with evaluation results
      updatedResult.answers = result.answers.map((answer) => {
        const evaluation = data.evaluations.find((e: AnswerEvaluation) => e.cardId === answer.cardId);
        if (evaluation) {
          return {
            ...answer,
            isCorrect: evaluation.isCorrect
          };
        }
        return answer;
      });

      onEvaluated(updatedResult);
    } catch (error) {
      console.error("Batch evaluation error:", error);
      alert("Failed to evaluate answers. Please try again or review them manually.");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="inline-flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Loader className="text-blue-500 animate-spin" size={24} />
          Evaluate Short Answers
        </h2>
        <p className="mt-2 text-slate-700">Review and evaluate your essay-style answers</p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Answers to Evaluate ({shortAnswers.length})
        </h3>
        <div className="space-y-4">
          {shortAnswers.map((answer, index) => {
            const evaluation = evaluations.find((e) => e.cardId === answer.cardId);
            const isCorrect = evaluation?.isCorrect;

            return (
              <div
                key={answer.cardId}
                className={`rounded-lg p-4 ring-1 ${
                  evaluation === undefined
                    ? "bg-blue-50 ring-blue-100"
                    : isCorrect
                    ? "bg-emerald-50 ring-emerald-100"
                    : "bg-rose-50 ring-rose-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  {evaluation === undefined ? (
                    <Loader size={16} className="text-blue-600 animate-spin mt-1 flex-shrink-0" />
                  ) : isCorrect ? (
                    <CheckCircle size={16} className="text-emerald-600 mt-1 flex-shrink-0" />
                  ) : (
                    <XCircle size={16} className="text-rose-600 mt-1 flex-shrink-0" />
                  )}
                  <div className="flex-grow">
                    <p className="text-xs uppercase tracking-wide text-slate-600 font-semibold mb-1">
                      Answer {index + 1}
                    </p>
                    <p className="font-semibold text-slate-900 mb-2">Q: {answer.question}</p>
                    <div className="bg-white rounded p-2 mb-2 ring-1 ring-slate-200">
                      <p className="text-sm text-slate-700">
                        <span className="font-semibold">Your answer:</span> {answer.studentAnswer}
                      </p>
                    </div>
                    {evaluation && (
                      <>
                        <div className={`bg-white rounded p-2 mb-2 ring-1 ${
                          isCorrect ? "ring-emerald-200" : "ring-rose-200"
                        }`}>
                          <p className="text-sm text-slate-700">
                            <span className="font-semibold">Expected:</span> {answer.expectedAnswer}
                          </p>
                        </div>
                        <div className={`text-sm ${isCorrect ? "text-emerald-800" : "text-rose-800"}`}>
                          <p className="font-semibold mb-1">
                            {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                          </p>
                          <p>{evaluation.feedback}</p>
                          <p className="text-xs opacity-75 mt-1">
                            Confidence: {evaluation.confidence}%
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!hasEvaluated ? (
        <div className="rounded-2xl bg-blue-50 p-6 ring-1 ring-blue-200">
          <p className="text-sm text-blue-900 mb-4">
            Click the button below to have these answers evaluated using AI. This helps ensure fair grading for complex, essay-style responses.
          </p>
          <button
            onClick={handleEvaluate}
            disabled={isEvaluating}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isEvaluating ? (
              <>
                <Loader size={16} className="animate-spin" />
                Evaluating...
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                Evaluate All Answers
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-emerald-50 p-6 ring-1 ring-emerald-200">
          <p className="text-sm text-emerald-900 mb-4">Evaluation complete! Review your results below.</p>
          <button
            onClick={onBackToDashboard}
            className="rounded-lg border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
          >
            Back to Dashboard
          </button>
        </div>
      )}
    </section>
  );
}
