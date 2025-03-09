"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { quizApi, questionApi } from "@/lib/api-client";
import { IoArrowBack, IoAdd, IoClose } from "react-icons/io5";

export default function CreateQuizPage() {
  const router = useRouter();
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [hasCorrectAnswers, setHasCorrectAnswers] = useState(false);
  const [isPublic, setIsPublic] = useState<boolean | null>(null);
  const [questions, setQuestions] = useState<
    {
      id: number;
      text: string;
      type: number;
      options: { text: string; isCorrect: boolean }[];
      isComplete: boolean;
    }[]
  >([
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

  const validateQuestion = (
    question: (typeof questions)[0]
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

  const validationErrors = () => {
    const errors = [];

    if (!isQuizTitleValid()) {
      errors.push("Please enter a quiz title");
    }

    if (!isVisibilitySelected()) {
      errors.push(
        "Please choose whether this quiz should be public or private"
      );
    }

    if (questions.length === 0) {
      errors.push("Please add at least one question to your quiz");
    }

    const incompleteQuestion = findIncompleteQuestion();
    if (incompleteQuestion) {
      errors.push(
        `Please complete question ${incompleteQuestion.index + 1}: ${
          incompleteQuestion.message
        }`
      );
    }

    return errors;
  };
  const isFormValid = () => {
    return validationErrors().length === 0;
  };

  useEffect(() => {
    if (hasAttemptedSave && showValidationErrors) {
      const errors = validationErrors();
      if (errors.length > 0) {
        setError(errors.join(". "));
      } else {
        setError("");
        setShowValidationErrors(false);
      }
    }
  }, [quizTitle, isPublic, questions, hasCorrectAnswers, hasAttemptedSave]);

  useEffect(() => {
    if (
      questions.length > 0 &&
      currentQuestion >= 0 &&
      currentQuestion < questions.length
    ) {
      const updatedQuestions = [...questions];
      const validation = validateQuestion(updatedQuestions[currentQuestion]);
      updatedQuestions[currentQuestion].isComplete = validation.valid;
      setQuestions(updatedQuestions);
    }
  }, [
    questions[currentQuestion]?.text,
    questions[currentQuestion]?.type,
    JSON.stringify(questions[currentQuestion]?.options),
    hasCorrectAnswers,
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

  const isQuizTitleValid = (): boolean => {
    return quizTitle.trim() !== "";
  };

  const isVisibilitySelected = (): boolean => {
    return isPublic !== null;
  };

  const findIncompleteQuestion = (): {
    index: number;
    message: string;
  } | null => {
    for (let i = 0; i < questions.length; i++) {
      const validation = validateQuestion(questions[i]);
      if (!validation.valid) {
        return {
          index: i,
          message: validation.message || "Question is incomplete",
        };
      }
    }
    return null;
  };

  const addQuestion = () => {
    const currentValidation = validateQuestion(questions[currentQuestion]);
    if (!currentValidation.valid) {
      setError(
        `Please complete the current question: ${currentValidation.message}`
      );
      setShowValidationErrors(true);
      return;
    }

    const incompleteQuestion = findIncompleteQuestion();
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

    const errors = validationErrors();
    if (errors.length > 0) {
      setError(errors.join(". "));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
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
      router.push(`/quizzes/${quiz.id}`);
    } catch (error: any) {
      console.error("Error creating quiz:", error);
      setError("Could not create quiz. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleBackNavigation = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-foreground">Create New Quiz</h1>
          <button
            onClick={handleBackNavigation}
            className="flex items-center text-primary hover:text-primary-hover transition"
            aria-label="Back"
          >
            <IoArrowBack className="h-5 w-5 mr-1" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>

        {showValidationErrors && error && (
          <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-md">
            {error.split(". ").map((err, index) => (
              <p key={index}>{err}</p>
            ))}
          </div>
        )}

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
                  onChange={(e) => handleQuizTitleChange(e.target.value)}
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
                  onChange={(e) => handleQuizDescriptionChange(e.target.value)}
                />
              </div>

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
                      onChange={() => handleVisibilityChange(true)}
                      className="mr-2"
                    />
                    <label
                      htmlFor="visibilityPublic"
                      className="text-foreground"
                    >
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
                      onChange={() => handleVisibilityChange(false)}
                      className="mr-2"
                    />
                    <label
                      htmlFor="visibilityPrivate"
                      className="text-foreground"
                    >
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
                  onChange={(e) => handleEducationalToggle(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="hasCorrectAnswers" className="text-foreground">
                  This quiz has correct answers (educational quiz)
                </label>
              </div>
            </div>
          </div>
        </div>

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
                  value={questions[currentQuestion]?.type || 0}
                  onChange={(e) =>
                    handleQuestionTypeChange(Number(e.target.value))
                  }
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
                value={questions[currentQuestion]?.text || ""}
                onChange={(e) => handleQuestionChange(e.target.value)}
              />

              {questions[currentQuestion]?.type !== 2 && (
                <>
                  {hasCorrectAnswers && (
                    <div className="text-sm font-medium text-foreground mb-3">
                      Mark if answer is correct
                    </div>
                  )}

                  <div className="space-y-3">
                    {questions[currentQuestion]?.options.map(
                      (option, index) => (
                        <div key={index} className="flex items-center">
                          {hasCorrectAnswers && (
                            <input
                              type={
                                questions[currentQuestion]?.type === 0
                                  ? "radio"
                                  : "checkbox"
                              }
                              name={`correctAnswer-${currentQuestion}`}
                              checked={option.isCorrect}
                              onChange={() => handleCorrectToggle(index)}
                              className="mr-3"
                            />
                          )}
                          <input
                            type="text"
                            placeholder={`Option ${index + 1}`}
                            className="flex-grow border border-border rounded-md px-4 py-2"
                            value={option.text}
                            onChange={(e) =>
                              handleOptionChange(index, e.target.value)
                            }
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="ml-2 text-text-secondary hover:text-red-500 h-8 w-8 flex items-center justify-center"
                            disabled={
                              questions[currentQuestion]?.options.length <= 2
                            }
                          >
                            <IoClose className="h-5 w-5" />
                          </button>
                        </div>
                      )
                    )}
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

        <div className="bg-card rounded-lg shadow mb-8">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground">
              All Questions
            </h2>

            {questions.length === 0 ? (
              <p className="text-text-secondary">No questions added yet</p>
            ) : (
              <div className="space-y-3">
                {questions.map((question, index) => {
                  const validation = validateQuestion(question);
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
                            onClick={() => editQuestion(index)}
                            className="text-primary hover:text-primary-hover"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteQuestion(index)}
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
            )}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={addQuestion}
            className="bg-primary text-white py-3 px-5 rounded-md hover:bg-primary-hover transition flex items-center"
          >
            <IoAdd className="h-5 w-5 mr-1" />
            Add Question
          </button>
          <button
            onClick={saveQuiz}
            className={`py-3 px-5 rounded-md transition text-white ${
              isFormValid()
                ? "bg-primary hover:bg-primary-hover"
                : "bg-secondary hover:bg-secondary-hover"
            }`}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
}
