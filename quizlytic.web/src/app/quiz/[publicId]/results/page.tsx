"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { quizApi } from "@/lib/api-client";
import { IoArrowBack } from "react-icons/io5";

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
          const resultsData = await fetch(
            `/api/results/quiz/${quizData.id}`
          ).then((res) => res.json());
          setResults(resultsData);
        } catch (resultsError) {
          console.error("Could not load quiz results:", resultsError);
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
      router.push("/results");
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

  if (error) {
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
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-text-secondary">Quiz Status</p>
              <p className="font-medium">
                {quiz.status === 3 ? "Completed" : "Active"}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Questions</p>
              <p className="font-medium">{quiz.questionsCount}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Participants</p>
              <p className="font-medium">{quiz.participants?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Mode</p>
              <p className="font-medium">
                {quiz.mode === 0 ? "Real-Time" : "Self-Paced"}
              </p>
            </div>
          </div>
        </div>

        {results ? (
          <div>
            <h2 className="text-lg font-semibold mb-4">Question Results</h2>
            <div className="space-y-6">
              {results.questions?.map((question: any, index: number) => (
                <div
                  key={index}
                  className="border border-border rounded-md p-4"
                >
                  <h3 className="font-medium mb-2">
                    Question {index + 1}: {question.questionText}
                  </h3>

                  {question.answerDistribution?.length > 0 ? (
                    <div className="space-y-3 mt-4">
                      {question.answerDistribution.map(
                        (answer: any, aIndex: number) => (
                          <div key={aIndex}>
                            <div className="flex justify-between mb-1">
                              <span>{answer.answerText}</span>
                              <span>
                                {answer.count} ({answer.percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${answer.percentage}%` }}
                              ></div>
                            </div>
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
              Results data is not available yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
