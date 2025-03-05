"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { QuestionType } from "@/lib/types";
import { quizApi, questionApi } from "@/lib/api-client";

export default function CreateQuizPage() {
  const router = useRouter();
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [hasCorrectAnswers, setHasCorrectAnswers] = useState(false);
  const [questions, setQuestions] = useState<
    {
      text: string;
      type: number;
      options: { text: string; isCorrect: boolean }[];
    }[]
  >([
    {
      text: "",
      type: 0,
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    },
  ]);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: "",
        type: 0,
        options: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
      },
    ]);
    setCurrentQuestion(questions.length);
  };

  const saveQuiz = async () => {
    if (!quizTitle.trim()) {
      setError("Please enter a quiz title");
      return;
    }

    if (!questions[0].text.trim()) {
      setError("Please add at least one question with text");
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
        if (question.text.trim()) {
          const validOptions = question.options.filter(
            (option) => option.text.trim() !== ""
          );

          if (validOptions.length === 0) continue;

          if (
            hasCorrectAnswers &&
            !validOptions.some((option) => option.isCorrect)
          ) {
            validOptions[0].isCorrect = true;
          }

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
      }
      router.push(`/quizzes/${quiz.id}`);
    } catch (error: any) {
      console.error("Error creating quiz:", error);
      setError("Could not create quiz. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

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
          <input
            type="text"
            placeholder="Quiz Title"
            className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4"
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
          />

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
              onChange={(e) => setHasCorrectAnswers(e.target.checked)}
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
                  value={questions[currentQuestion].type}
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
              value={questions[currentQuestion].text}
              onChange={(e) => handleQuestionChange(e.target.value)}
            />

            {questions[currentQuestion].type !== 2 && (
              <>
                {hasCorrectAnswers && (
                  <div className="text-sm text-gray-600 mb-2">
                    Mark if answer is correct
                  </div>
                )}

                {questions[currentQuestion].options.map((option, index) => (
                  <div key={index} className="flex items-center mb-2">
                    {hasCorrectAnswers && (
                      <input
                        type={
                          questions[currentQuestion].type === 0
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
                      disabled={questions[currentQuestion].options.length <= 2}
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
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
}
