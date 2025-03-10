import React from "react";
import { QuizQuestion, validateQuestion } from "../utils/validation";

interface QuestionsListProps {
  questions: QuizQuestion[];
  currentQuestion: number;
  hasCorrectAnswers: boolean;
  onEditQuestion: (index: number) => void;
  onDeleteQuestion: (index: number) => void;
}

export default function QuestionsList({
  questions,
  currentQuestion,
  hasCorrectAnswers,
  onEditQuestion,
  onDeleteQuestion,
}: QuestionsListProps) {
  if (questions.length === 0) {
    return <p className="text-text-secondary">No questions added yet</p>;
  }

  return (
    <div className="space-y-3">
      {questions.map((question, index) => {
        const validation = validateQuestion(question, hasCorrectAnswers);
        return (
          <div
            key={question.id}
            className={`border rounded-md p-4 ${
              currentQuestion === index
                ? "border-primary bg-accent"
                : validation.valid
                ? "border-border"
                : "border-yellow-400 bg-yellow-50"
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="flex-1 truncate">
                <span className="font-medium mr-2 text-foreground">
                  Question {index + 1}:
                </span>
                <span className="text-foreground">
                  {question.text || "Untitled question"}
                  {!validation.valid && (
                    <span className="text-yellow-600 ml-1">
                      ({validation.message})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => onEditQuestion(index)}
                  className="text-primary hover:text-primary-hover"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteQuestion(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="text-sm text-text-secondary mt-2">
              {question.type === 0
                ? "Single Choice"
                : question.type === 1
                ? "Multiple Choice"
                : "Free Text"}{" "}
              •
              {question.type !== 2 &&
                ` ${
                  question.options.filter((o) => o.text.trim()).length
                } options`}
              {hasCorrectAnswers &&
                question.type !== 2 &&
                ` • ${
                  question.options.filter((o) => o.isCorrect).length
                } correct`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
