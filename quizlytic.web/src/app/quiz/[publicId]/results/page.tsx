"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { quizApi, resultApi } from "@/lib/api-client";
import { IoArrowBack, IoCheckmarkCircle } from "react-icons/io5";
import DateDisplay from "@/components/DateDisplay";
import { QuizStatus, QuestionType } from "@/lib/types";

export default function QuizResultsPage() {
  const router = useRouter();
  const params = useParams();
  const publicId = params.publicId as string;

  const [quiz, setQuiz] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadQuizData = async () => {
      try {
        if (!publicId) return;

        const quizData = await quizApi.getByPublicId(publicId);
        setQuiz(quizData);

        try {
          const resultsData = await resultApi.getByQuizId(quizData.id);
          setResults(resultsData);
        } catch (resultsError) {
          console.error("Could not load quiz results:", resultsError);
          setError(
            "Could not load detailed results data. You can still view basic quiz information."
          );
        }
      } catch (err) {
        console.error("Error loading quiz:", err);
        setError("Could not load quiz information. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    loadQuizData();
  }, [publicId]);

  const handleBackNavigation = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-card rounded-lg shadow p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-2"></div>
          <p className="text-text-secondary">Loading quiz results...</p>
        </div>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-card rounded-lg shadow p-6">
          <div className="bg-red-100 text-red-800 p-4 rounded mb-4">
            {error}
          </div>
          <button
            onClick={handleBackNavigation}
            className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-hover transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-card rounded-lg shadow p-6 text-center">
          <p className="text-text-secondary">Quiz not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-primary">
            Results: {quiz.title}
          </h1>
          <button
            onClick={handleBackNavigation}
            className="flex items-center text-primary hover:text-primary-hover transition"
            aria-label="Back"
          >
            <IoArrowBack className="h-5 w-5 mr-1" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>

        <div className="bg-accent rounded-md p-4 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-text-secondary">Quiz Status</p>
              <p className="font-medium">
                {QuizStatus[quiz.status] || "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Questions</p>
              <p className="font-medium">{quiz.questions?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Participants</p>
              <p className="font-medium">
                {results?.participantsCount || quiz.participants?.length || 0}
              </p>
            </div>
            {quiz.startedAt && (
              <div>
                <p className="text-sm text-text-secondary">Started</p>
                <p className="font-medium">
                  <DateDisplay date={quiz.startedAt} formatString="PPp" />
                </p>
              </div>
            )}
            {quiz.endedAt && (
              <div>
                <p className="text-sm text-text-secondary">Ended</p>
                <p className="font-medium">
                  <DateDisplay date={quiz.endedAt} formatString="PPp" />
                </p>
              </div>
            )}
          </div>
        </div>

        {error && !results && (
          <div className="bg-yellow-100 text-yellow-800 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {results ? (
          <div>
            <h2 className="text-lg font-semibold mb-4">Question Results</h2>
            <div className="space-y-6">
              {results.questions?.map((question: any, index: number) => (
                <div
                  key={question.questionId}
                  className="border border-border rounded-md p-4"
                >
                  <h3 className="font-medium mb-2">
                    Question {question.orderIndex + 1}: {question.questionText}
                  </h3>
                  <p className="text-sm text-text-secondary mb-4">
                    {question.responsesCount} responses
                    {question.questionType === QuestionType.SingleChoice &&
                      " (Single Choice)"}
                    {question.questionType === QuestionType.MultipleChoice &&
                      " (Multiple Choice)"}
                    {question.questionType === QuestionType.FreeText &&
                      " (Free Text)"}
                  </p>

                  {question.questionType !== QuestionType.FreeText &&
                  question.answerDistribution?.length > 0 ? (
                    <div className="space-y-3 mt-4">
                      {question.answerDistribution.map(
                        (answer: any, aIndex: number) => (
                          <div key={aIndex}>
                            <div className="flex justify-between mb-1">
                              <span className="flex items-center">
                                {answer.isCorrect && quiz.hasCorrectAnswers && (
                                  <IoCheckmarkCircle className="text-green-500 mr-1 h-5 w-5" />
                                )}
                                {answer.answerText}
                              </span>
                              <span>
                                {answer.count} ({Math.round(answer.percentage)}
                                %)
                              </span>
                            </div>
                            <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  answer.isCorrect && quiz.hasCorrectAnswers
                                    ? "bg-green-500"
                                    : "bg-primary"
                                }`}
                                style={{ width: `${answer.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : question.questionType === QuestionType.FreeText &&
                    question.freeTextResponses?.length > 0 ? (
                    <div className="space-y-2 mt-4">
                      <p className="font-medium">Text Responses:</p>
                      {question.freeTextResponses.map(
                        (response: any, rIndex: number) => (
                          <div
                            key={rIndex}
                            className="bg-accent p-3 rounded-md"
                          >
                            <p className="text-sm font-medium">
                              {response.participantName}:
                            </p>
                            <p>{response.response}</p>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-text-secondary">
                      No responses for this question.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-text-secondary">
              {error
                ? "Results data could not be loaded."
                : "Results data is not available for this quiz."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
