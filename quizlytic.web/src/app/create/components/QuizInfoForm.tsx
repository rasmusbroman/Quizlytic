import React from "react";
import { QuizMode } from "@/lib/types";

interface QuizInfoFormProps {
  quizTitle: string;
  quizDescription: string;
  isPublic: boolean | null;
  hasCorrectAnswers: boolean;
  quizMode: QuizMode | undefined;
  allowAnonymous: boolean;
  onQuizTitleChange: (value: string) => void;
  onQuizDescriptionChange: (value: string) => void;
  onVisibilityChange: (value: boolean) => void;
  onEducationalToggle: (value: boolean) => void;
  onModeChange: (value: QuizMode) => void;
  onAllowAnonymousChange: (value: boolean) => void;
  isQuizTitleValid: () => boolean;
}

export default function QuizInfoForm({
  quizTitle,
  quizDescription,
  isPublic,
  hasCorrectAnswers,
  quizMode,
  allowAnonymous,
  onQuizTitleChange,
  onQuizDescriptionChange,
  onVisibilityChange,
  onEducationalToggle,
  onModeChange,
  onAllowAnonymousChange,
  isQuizTitleValid,
}: QuizInfoFormProps) {
  return (
    <div className="bg-card rounded-lg shadow mb-8">
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4 text-foreground">
          Quiz Information
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-foreground mb-2">
              Quiz Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter a title for your quiz"
              className={`w-full border ${
                !isQuizTitleValid() && quizTitle !== ""
                  ? "border-red-500"
                  : "border-border"
              } rounded-md px-4 py-3`}
              value={quizTitle}
              onChange={(e) => onQuizTitleChange(e.target.value)}
            />
            {!isQuizTitleValid() && quizTitle !== "" && (
              <p className="text-red-500 text-sm mt-1">
                A title is required for your quiz
              </p>
            )}
          </div>

          <div>
            <label className="block text-foreground mb-2">
              Quiz Description
            </label>
            <textarea
              placeholder="Enter a description for your quiz (optional)"
              className="w-full border border-border rounded-md px-4 py-3"
              rows={3}
              value={quizDescription}
              onChange={(e) => onQuizDescriptionChange(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-foreground mb-2">
              Quiz Mode <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-6">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="modeRealTime"
                  name="quizMode"
                  checked={quizMode === QuizMode.RealTime}
                  onChange={() => onModeChange(QuizMode.RealTime)}
                  className="mr-2"
                />
                <label htmlFor="modeRealTime" className="text-foreground">
                  Real-time Quiz{" "}
                  <span className="text-text-secondary text-sm">
                    (host controls question progression)
                  </span>
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="modeSelfPaced"
                  name="quizMode"
                  checked={quizMode === QuizMode.SelfPaced}
                  onChange={() => onModeChange(QuizMode.SelfPaced)}
                  className="mr-2"
                />
                <label htmlFor="modeSelfPaced" className="text-foreground">
                  Self-paced Survey{" "}
                  <span className="text-text-secondary text-sm">
                    (participants complete at their own pace)
                  </span>
                </label>
              </div>
            </div>
          </div>
          {quizMode === QuizMode.SelfPaced && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowAnonymous"
                checked={allowAnonymous}
                onChange={(e) => onAllowAnonymousChange(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="allowAnonymous" className="text-foreground">
                Allow anonymous participation (no name required)
              </label>
            </div>
          )}
          <div>
            <label className="block text-foreground mb-2">
              Quiz Visibility <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-6">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="visibilityPublic"
                  name="visibility"
                  checked={isPublic === true}
                  onChange={() => onVisibilityChange(true)}
                  className="mr-2"
                />
                <label htmlFor="visibilityPublic" className="text-foreground">
                  Public{" "}
                  <span className="text-text-secondary text-sm">
                    (visible to everyone)
                  </span>
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="visibilityPrivate"
                  name="visibility"
                  checked={isPublic === false}
                  onChange={() => onVisibilityChange(false)}
                  className="mr-2"
                />
                <label htmlFor="visibilityPrivate" className="text-foreground">
                  Private{" "}
                  <span className="text-text-secondary text-sm">
                    (accessible only with PIN or QR-code)
                  </span>
                </label>
              </div>
            </div>
            {isPublic === null && (
              <p className="text-text-secondary text-sm mt-1">
                Please select whether this quiz should be public or private
              </p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasCorrectAnswers"
              checked={hasCorrectAnswers}
              onChange={(e) => onEducationalToggle(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="hasCorrectAnswers" className="text-foreground">
              This quiz has correct answers (educational quiz)
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
