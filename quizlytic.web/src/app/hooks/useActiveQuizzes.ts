import { useState, useEffect, useMemo } from "react";
import { Quiz, QuizStatus } from "@/lib/types";
import { quizApi } from "@/lib/api-client";

export function useActiveQuizzes(limit?: number) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const data = await quizApi.getAll(true);
        setQuizzes(data);
      } catch (err) {
        console.error("Error loading quizzes:", err);
        setError("Could not load quizzes. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    };

    loadQuizzes();
  }, []);

  const activeQuizzes = useMemo(() => {
    return quizzes
      .filter((quiz) => quiz.status === QuizStatus.Active && quiz.isPublic)
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
  }, [quizzes]);

  const filteredQuizzes = useMemo(() => {
    const filtered = activeQuizzes.filter((quiz) =>
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return limit ? filtered.slice(0, limit) : filtered;
  }, [activeQuizzes, searchQuery, limit]);

  return {
    quizzes: filteredQuizzes,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
  };
}
