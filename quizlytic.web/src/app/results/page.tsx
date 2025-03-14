"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { quizApi } from "@/lib/api-client";
import { Quiz, QuizStatus } from "@/lib/types";
import DateDisplay from "@/components/DateDisplay";
import { IoArrowBack } from "react-icons/io5";
import SearchInput from "@/components/ui/SearchInput";

export default function ResultsListPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const data = await quizApi.getAll();
        const completedQuizzes = data.filter(
          (q) => q.status === QuizStatus.Completed
        );
        setQuizzes(completedQuizzes);
      } catch (err) {
        console.error("Error loading quizzes:", err);
        setError("Could not load quizzes. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    };

    loadQuizzes();
  }, []);

  const filteredQuizzes = quizzes.filter((quiz) =>
    quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleQuizClick = (id: number) => {
    router.push(`/quiz/${id}/results`);
  };

  const handleBackNavigation = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-primary">Quiz Results</h1>
          <button
            onClick={handleBackNavigation}
            className="flex items-center text-primary hover:text-primary-hover transition"
            aria-label="Back"
          >
            <IoArrowBack className="h-5 w-5 mr-1" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>

        <div className="mb-6">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search completed quizzes..."
          />
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2 text-text-secondary">Loading quizzes...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-800 p-4 rounded mb-4">
            {error}
          </div>
        ) : filteredQuizzes.length > 0 ? (
          <div className="space-y-3">
            {filteredQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                onClick={() => router.push(`/quiz/${quiz.publicId}/results`)}
                className="border border-border rounded-md p-4 hover:bg-accent cursor-pointer transition"
              >
                <h3 className="font-medium text-foreground">{quiz.title}</h3>
                <div className="flex justify-between text-sm text-text-secondary mt-2">
                  <span>{quiz.questionsCount} questions</span>
                  <span>
                    Completed on{" "}
                    <DateDisplay
                      date={quiz.endedAt || quiz.createdAt}
                      formatString="PPP"
                    />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-text-secondary">No completed quizzes found</p>
            <p className="mt-2 text-sm text-text-secondary">
              Complete a quiz to see results here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
