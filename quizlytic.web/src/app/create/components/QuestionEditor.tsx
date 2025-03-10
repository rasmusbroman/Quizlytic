import React from "react";
import { IoAdd, IoClose } from "react-icons/io5";
import { QuizQuestion } from "../utils/validation";

interface QuestionEditorProps {
  currentQuestion: number;
  questions: QuizQuestion[];
  hasCorrectAnswers: boolean;
  onQuestionChange: (text: string) => void;
  onQuestionTypeChange: (type: number) => void;
  onOptionChange: (index: number, text: string) => void;
  onCorrectToggle: (index: number) => void;
  addOption: () => void;
  removeOption: (index: number) => void;
}

export default function QuestionEditor({
  currentQuestion,
  questions,
  hasCorrectAnswers,
  onQuestionChange,
  onQuestionTypeChange,
  onOptionChange,
  onCorrectToggle,
  addOption,
  removeOption,
}: QuestionEditorProps) {
  const question = questions[currentQuestion];

  if (!question) return null;

  return (
    <div className="bg-card rounded-lg border border-border mb-8">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Question {currentQuestion + 1}
          </h2>
          <div className="flex items-center">
            <select
              id="questionType"
              className="border border-border rounded-md px-3 py-2"
              value={question.type || 0}
              onChange={(e) => onQuestionTypeChange(Number(e.target.value))}
            >
              <option value={0}>Single Choice</option>
              <option value={1}>Multiple Choice</option>
              <option value={2}>Free Text</option>
            </select>
          </div>
        </div>

        <div className="bg-accent rounded-md p-6 mb-6">
          <textarea
            placeholder="Enter your question"
            className="w-full border border-border rounded-md px-4 py-3 mb-4"
            rows={2}
            value={question.text || ""}
            onChange={(e) => onQuestionChange(e.target.value)}
          />

          {question.type !== 2 && (
            <>
              {hasCorrectAnswers && (
                <div className="text-sm font-medium text-foreground mb-3">
                  Mark if answer is correct
                </div>
              )}

              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <div key={index} className="flex items-center">
                    {hasCorrectAnswers && (
                      <input
                        type={question.type === 0 ? "radio" : "checkbox"}
                        name={`correctAnswer-${currentQuestion}`}
                        checked={option.isCorrect}
                        onChange={() => onCorrectToggle(index)}
                        className="mr-3"
                      />
                    )}
                    <input
                      type="text"
                      placeholder={`Option ${index + 1}`}
                      className="flex-grow border border-border rounded-md px-4 py-2"
                      value={option.text}
                      onChange={(e) => onOptionChange(index, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="ml-2 text-text-secondary hover:text-red-500 h-8 w-8 flex items-center justify-center"
                      disabled={question.options.length <= 2}
                    >
                      <IoClose className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addOption}
                className="text-primary text-sm mt-4 flex items-center"
              >
                <IoAdd className="h-5 w-5 mr-1" />
                Add Option
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
