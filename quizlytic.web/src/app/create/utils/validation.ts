import { QuestionType, QuizMode } from "@/lib/types";

export type QuizQuestion = {
  id: number;
  text: string;
  type: QuestionType;
  options: { text: string; isCorrect: boolean }[];
  isComplete: boolean;
};

export const isQuizModeSelected = (quizMode: QuizMode | undefined): boolean => {
  return quizMode !== undefined;
};

export const validateQuestion = (
  question: QuizQuestion,
  hasCorrectAnswers: boolean
): { valid: boolean; message?: string } => {
  if (!question.text.trim()) {
    return { valid: false, message: "Question text is required" };
  }

  if (question.type !== 2) {
    const validOptions = question.options.filter(
      (option) => option.text.trim() !== ""
    );
    if (validOptions.length === 0) {
      return {
        valid: false,
        message: "At least one answer option must be filled in",
      };
    }

    if (hasCorrectAnswers) {
      const hasCorrectAnswer = question.options.some(
        (option) => option.isCorrect
      );
      if (!hasCorrectAnswer) {
        return {
          valid: false,
          message: "At least one answer must be marked as correct",
        };
      }
    }
  }
  return { valid: true };
};

export const isQuizTitleValid = (title: string): boolean => {
  return title.trim() !== "";
};

export const isVisibilitySelected = (isPublic: boolean | null): boolean => {
  return isPublic !== null;
};

export const findIncompleteQuestion = (
  questions: QuizQuestion[],
  hasCorrectAnswers: boolean
): { index: number; message: string } | null => {
  for (let i = 0; i < questions.length; i++) {
    const validation = validateQuestion(questions[i], hasCorrectAnswers);
    if (!validation.valid) {
      return {
        index: i,
        message: validation.message || "Question is incomplete",
      };
    }
  }
  return null;
};

export const validateQuizForm = (
  quizTitle: string,
  isPublic: boolean | null,
  quizMode: QuizMode | undefined,
  questions: QuizQuestion[],
  hasCorrectAnswers: boolean
): string[] => {
  const errors = [];

  if (!isQuizTitleValid(quizTitle)) {
    errors.push("Please enter a quiz title");
  }

  if (!isVisibilitySelected(isPublic)) {
    errors.push("Please choose whether this quiz should be public or private");
  }

  if (!isQuizModeSelected(quizMode)) {
    errors.push(
      "Please select a quiz mode (Real-time Quiz or Self-paced Survey)"
    );
  }

  if (questions.length === 0) {
    errors.push("Please add at least one question to your quiz");
  } else {
    for (let i = 0; i < questions.length; i++) {
      const validation = validateQuestion(questions[i], hasCorrectAnswers);
      if (!validation.valid) {
        errors.push(`Please complete question ${i + 1}: ${validation.message}`);
      }
    }
  }

  return errors;
};
