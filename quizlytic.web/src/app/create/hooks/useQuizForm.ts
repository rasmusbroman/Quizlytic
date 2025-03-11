import { useState, useEffect } from "react";
import { quizApi, questionApi } from "@/lib/api-client";
import { QuizMode } from "@/lib/types";
import {
  QuizQuestion,
  validateQuestion,
  validateQuizForm,
  findIncompleteQuestion,
} from "../utils/validation";

export const useQuizForm = () => {
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [quizMode, setQuizMode] = useState<QuizMode | undefined>(undefined);
  const [hasCorrectAnswers, setHasCorrectAnswers] = useState(false);
  const [isPublic, setIsPublic] = useState<boolean | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      id: 1,
      text: "",
      type: 0,
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
      isComplete: false,
    },
  ]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [nextQuestionId, setNextQuestionId] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);

  useEffect(() => {
    if (
      questions.length > 0 &&
      currentQuestion >= 0 &&
      currentQuestion < questions.length
    ) {
      const updatedQuestions = [...questions];
      const validation = validateQuestion(
        updatedQuestions[currentQuestion],
        hasCorrectAnswers
      );
      updatedQuestions[currentQuestion].isComplete = validation.valid;
      setQuestions(updatedQuestions);
    }
  }, [
    questions[currentQuestion]?.text,
    questions[currentQuestion]?.type,
    JSON.stringify(questions[currentQuestion]?.options),
    hasCorrectAnswers,
    currentQuestion,
  ]);

  useEffect(() => {
    if (hasAttemptedSave && showValidationErrors) {
      const errors = validateQuizForm(
        quizTitle,
        isPublic,
        questions,
        hasCorrectAnswers
      );
      if (errors.length > 0) {
        setError(errors.join(". "));
      } else {
        setError("");
        setShowValidationErrors(false);
      }
    }
  }, [
    quizTitle,
    isPublic,
    questions,
    hasCorrectAnswers,
    hasAttemptedSave,
    showValidationErrors,
  ]);

  const addOption = () => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestion].options.push({
      text: "",
      isCorrect: false,
    });
    setQuestions(updatedQuestions);
  };

  const removeOption = (index: number) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[currentQuestion].options.length > 2) {
      updatedQuestions[currentQuestion].options.splice(index, 1);
      setQuestions(updatedQuestions);
    }
  };

  const handleModeChange = (mode: QuizMode) => {
    setQuizMode(mode);
  };

  const handleQuizTitleChange = (value: string) => {
    setQuizTitle(value);
  };

  const handleQuizDescriptionChange = (value: string) => {
    setQuizDescription(value);
  };

  const handleVisibilityChange = (value: boolean) => {
    setIsPublic(value);
  };

  const handleQuestionChange = (text: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestion].text = text;
    setQuestions(updatedQuestions);
  };

  const handleQuestionTypeChange = (type: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestion].type = type;
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (index: number, text: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestion].options[index].text = text;
    setQuestions(updatedQuestions);
  };

  const handleCorrectToggle = (index: number) => {
    const updatedQuestions = [...questions];
    const currentType = updatedQuestions[currentQuestion].type;

    if (currentType === 0) {
      updatedQuestions[currentQuestion].options.forEach((option) => {
        option.isCorrect = false;
      });
      updatedQuestions[currentQuestion].options[index].isCorrect = true;
    } else {
      updatedQuestions[currentQuestion].options[index].isCorrect =
        !updatedQuestions[currentQuestion].options[index].isCorrect;
    }

    setQuestions(updatedQuestions);
  };

  const handleEducationalToggle = (isEducational: boolean) => {
    setHasCorrectAnswers(isEducational);

    if (!isEducational) {
      const updatedQuestions = questions.map((question) => ({
        ...question,
        options: question.options.map((option) => ({
          ...option,
          isCorrect: false,
        })),
      }));

      setQuestions(updatedQuestions);
    }
  };

  const addQuestion = () => {
    const currentValidation = validateQuestion(
      questions[currentQuestion],
      hasCorrectAnswers
    );
    if (!currentValidation.valid) {
      setError(
        `Please complete the current question: ${currentValidation.message}`
      );
      setShowValidationErrors(true);
      return;
    }

    const incompleteQuestion = findIncompleteQuestion(
      questions,
      hasCorrectAnswers
    );
    if (incompleteQuestion) {
      setCurrentQuestion(incompleteQuestion.index);
      setError(
        `Please complete question ${incompleteQuestion.index + 1}: ${
          incompleteQuestion.message
        }`
      );
      setShowValidationErrors(true);
      return;
    }
    setError("");
    setShowValidationErrors(false);

    const newQuestion = {
      id: nextQuestionId,
      text: "",
      type: 0,
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
      isComplete: false,
    };

    setQuestions([...questions, newQuestion]);
    setCurrentQuestion(questions.length);
    setNextQuestionId(nextQuestionId + 1);
  };

  const deleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      setError("You need at least one question");
      setShowValidationErrors(true);
      return;
    }

    const updatedQuestions = [...questions];
    updatedQuestions.splice(index, 1);
    setQuestions(updatedQuestions);
    if (currentQuestion >= updatedQuestions.length) {
      setCurrentQuestion(updatedQuestions.length - 1);
    }
  };

  const editQuestion = (index: number) => {
    setCurrentQuestion(index);
    setError("");
    setShowValidationErrors(false);
  };

  const saveQuiz = async () => {
    setHasAttemptedSave(true);
    setShowValidationErrors(true);

    const errors = validateQuizForm(
      quizTitle,
      isPublic,
      quizMode,
      questions,
      hasCorrectAnswers
    );
    if (errors.length > 0) {
      setError(errors.join(". "));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return false;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("Creating quiz with title:", quizTitle);
      const quiz = await quizApi.create({
        title: quizTitle,
        description: quizDescription || "",
        hasCorrectAnswers: hasCorrectAnswers,
        isPublic: isPublic || false,
        mode: quizMode!,
      });
      console.log("Quiz created successfully:", quiz);

      for (const question of questions) {
        const validOptions = question.options.filter(
          (option) => option.text.trim() !== ""
        );

        console.log("Adding question:", {
          quizId: quiz.id,
          text: question.text,
          imageUrl: "",
          type: question.type,
          answers: validOptions,
        });

        try {
          await questionApi.create({
            quizId: quiz.id,
            text: question.text,
            imageUrl: "",
            type: question.type,
            answers: validOptions,
          });
          console.log("Question added successfully");
        } catch (questionError) {
          console.error("Error adding question:", questionError);
        }
      }

      return quiz.id;
    } catch (error) {
      console.error("Error creating quiz:", error);
      setError("Could not create quiz. Please try again later.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      validateQuizForm(
        quizTitle,
        isPublic,
        quizMode,
        questions,
        hasCorrectAnswers
      ).length === 0
    );
  };

  return {
    quizTitle,
    quizDescription,
    quizMode,
    hasCorrectAnswers,
    isPublic,
    questions,
    currentQuestion,
    isLoading,
    error,
    showValidationErrors,

    handleModeChange,
    handleQuizTitleChange,
    handleQuizDescriptionChange,
    handleVisibilityChange,
    handleEducationalToggle,
    handleQuestionChange,
    handleQuestionTypeChange,
    handleOptionChange,
    handleCorrectToggle,
    addOption,
    removeOption,
    addQuestion,
    deleteQuestion,
    editQuestion,
    saveQuiz,
    isFormValid,
    setError,
    setShowValidationErrors,
  };
};
