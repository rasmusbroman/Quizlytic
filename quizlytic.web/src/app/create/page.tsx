"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { IoArrowBack, IoAdd } from "react-icons/io5";
import { useQuizForm } from "./hooks/useQuizForm";
import QuizInfoForm from "./components/QuizInfoForm";
import QuestionEditor from "./components/QuestionEditor";
import QuestionsList from "./components/QuestionsList";
import { isQuizTitleValid } from "./utils/validation";

export default function CreateQuizPage() {
  const router = useRouter();
  const quizForm = useQuizForm();

  const handleBackNavigation = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleSaveQuiz = async () => {
    const quizId = await quizForm.saveQuiz();
    if (quizId) {
      router.push(`/quizzes/${quizId}`);
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

        {quizForm.showValidationErrors && quizForm.error && (
          <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-md">
            {quizForm.error.split(". ").map((err, index) => (
              <p key={index}>{err}</p>
            ))}
          </div>
        )}

        <QuizInfoForm
          quizTitle={quizForm.quizTitle}
          quizDescription={quizForm.quizDescription}
          isPublic={quizForm.isPublic}
          hasCorrectAnswers={quizForm.hasCorrectAnswers}
          onQuizTitleChange={quizForm.handleQuizTitleChange}
          onQuizDescriptionChange={quizForm.handleQuizDescriptionChange}
          onVisibilityChange={quizForm.handleVisibilityChange}
          onEducationalToggle={quizForm.handleEducationalToggle}
          isQuizTitleValid={() => isQuizTitleValid(quizForm.quizTitle)}
        />

        <QuestionEditor
          currentQuestion={quizForm.currentQuestion}
          questions={quizForm.questions}
          hasCorrectAnswers={quizForm.hasCorrectAnswers}
          onQuestionChange={quizForm.handleQuestionChange}
          onQuestionTypeChange={quizForm.handleQuestionTypeChange}
          onOptionChange={quizForm.handleOptionChange}
          onCorrectToggle={quizForm.handleCorrectToggle}
          addOption={quizForm.addOption}
          removeOption={quizForm.removeOption}
        />

        <div className="bg-card rounded-lg shadow mb-8">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground">
              All Questions
            </h2>

            <QuestionsList
              questions={quizForm.questions}
              currentQuestion={quizForm.currentQuestion}
              hasCorrectAnswers={quizForm.hasCorrectAnswers}
              onEditQuestion={quizForm.editQuestion}
              onDeleteQuestion={quizForm.deleteQuestion}
            />
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={quizForm.addQuestion}
            className="bg-primary text-white py-3 px-5 rounded-md hover:bg-primary-hover transition flex items-center"
          >
            <IoAdd className="h-5 w-5 mr-1" />
            Add Question
          </button>
          <button
            onClick={handleSaveQuiz}
            className={`py-3 px-5 rounded-md transition text-white ${
              quizForm.isFormValid()
                ? "bg-primary hover:bg-primary-hover"
                : "bg-secondary hover:bg-secondary-hover"
            }`}
            disabled={quizForm.isLoading}
          >
            {quizForm.isLoading ? "Saving..." : "Save Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
}
