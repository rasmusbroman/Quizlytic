"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { quizApi, questionApi } from "@/lib/api-client";

export default function CreateQuizPage() {
  const router = useRouter();
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [hasCorrectAnswers, setHasCorrectAnswers] = useState(false);
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

  // const isCurrentQuestionComplete = (): boolean => {
  //   return questions[currentQuestion]?.isComplete || false;
  // };

  const isQuizTitleValid = (): boolean => {
    return quizTitle.trim() !== "";
  };

  // const hasValidQuestions = (): boolean => {
  //   return questions.length > 0 && questions.some(q => validateQuestion(q).valid);
  // };

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
      return;
    }
    setError("");

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
  };

  const saveQuiz = async () => {
    if (!isQuizTitleValid()) {
      setError("Please enter a quiz title");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (questions.length === 0) {
      setError("Please add at least one question to your quiz");
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

  console.log(
    "Current question:",
    currentQuestion,
    "Is complete:",
    questions[currentQuestion]?.isComplete,
    "Question data:",
    questions[currentQuestion]
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-bold mb-6">Create New Quiz</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
            {error}
          </div>
        )}
        <div className="mb-6">
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">
              Quiz Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter a title for your quiz"
              className={`w-full border ${
                !isQuizTitleValid() && quizTitle !== ""
                  ? "border-red-500"
                  : "border-gray-300"
              } rounded-md px-3 py-2`}
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
            />
            {!isQuizTitleValid() && quizTitle !== "" && (
              <p className="text-red-500 text-sm mt-1">
                A title is required for your quiz
              </p>
            )}
          </div>
          <textarea
            placeholder="Quiz Description (optional)"
            className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4"
            rows={3}
            value={quizDescription}
            onChange={(e) => setQuizDescription(e.target.value)}
          />
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="hasCorrectAnswers"
              checked={hasCorrectAnswers}
              onChange={(e) => handleEducationalToggle(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="hasCorrectAnswers">
              This quiz has correct answers (educational quiz)
            </label>
          </div>

          <div className="bg-green-50 p-4 rounded-md mb-4">
            <div className="flex justify-between items-center mb-2">
              <div className="font-medium">Question {currentQuestion + 1}</div>

              <div className="flex items-center">
                <label htmlFor="questionType" className="mr-2 text-sm">
                  Question Type
                </label>
                <select
                  id="questionType"
                  className="border border-gray-300 rounded-md px-2 py-1"
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

            <textarea
              placeholder="Enter your question"
              className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4"
              value={questions[currentQuestion]?.text || ""}
              onChange={(e) => handleQuestionChange(e.target.value)}
            />

            {questions[currentQuestion]?.type !== 2 && (
              <>
                {hasCorrectAnswers && (
                  <div className="text-sm text-gray-600 mb-2">
                    Mark if answer is correct
                  </div>
                )}

                {questions[currentQuestion]?.options.map((option, index) => (
                  <div key={index} className="flex items-center mb-2">
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
                        className="mr-2"
                      />
                    )}
                    <input
                      type="text"
                      placeholder={`Option ${index + 1}`}
                      className="flex-grow border border-gray-300 rounded-md px-3 py-1"
                      value={option.text}
                      onChange={(e) =>
                        handleOptionChange(index, e.target.value)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="ml-2 text-gray-500 hover:text-red-500"
                      disabled={questions[currentQuestion]?.options.length <= 2}
                    >
                      −
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOption}
                  className="text-green-700 text-sm mt-2 flex items-center"
                >
                  <span className="mr-1">+</span> Add Option
                </button>
              </>
            )}
          </div>
          <div className="border border-gray-200 rounded-md p-3 mb-6">
            <h3 className="font-medium mb-2">Added Questions</h3>
            {questions.length === 0 ? (
              <p className="text-gray-500 text-sm">No questions added yet</p>
            ) : (
              <div className="space-y-2">
                {questions.map((question, index) => {
                  const validation = validateQuestion(question);
                  return (
                    <div
                      key={question.id}
                      className={`border rounded-md p-2 ${
                        currentQuestion === index
                          ? "border-green-500 bg-green-50"
                          : validation.valid
                          ? "border-gray-200"
                          : "border-yellow-400 bg-yellow-50"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1 truncate">
                          <span className="font-medium mr-2">
                            Q{index + 1}:
                          </span>
                          <span className="text-gray-700">
                            {question.text || "Untitled question"}
                            {!validation.valid && (
                              <span className="text-yellow-600 ml-1">
                                ({validation.message})
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => editQuestion(index)}
                            className="text-blue-600 hover:text-blue-800"
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
                      <div className="text-xs text-gray-500 mt-1">
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
            className="bg-green-700 text-white py-2 px-4 rounded-md hover:bg-green-800 transition"
          >
            + Add Question
          </button>
          <button
            onClick={saveQuiz}
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
            disabled={isLoading || findIncompleteQuestion() !== null}
          >
            {isLoading ? "Saving..." : "Save Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
}
