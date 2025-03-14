import { useState, useEffect, useMemo } from "react";
import { Quiz, QuizStatus } from "@/lib/types";
import { quizApi } from "@/lib/api-client";
import { SortOption } from "@/components/ui/SortDropdown";

export const useQuizList = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showActive, setShowActive] = useState(true);
  const [showPaused, setShowPaused] = useState(true);
  const [showCreated, setShowCreated] = useState(false);

  const sortOptions: SortOption[] = useMemo(
    () => [
      {
        label: "Title (A-Z)",
        value: "title-asc",
        sortFn: (a: Quiz, b: Quiz) => a.title.localeCompare(b.title),
      },
      {
        label: "Title (Z-A)",
        value: "title-desc",
        sortFn: (a: Quiz, b: Quiz) => b.title.localeCompare(a.title),
      },
      {
        label: "Newest first",
        value: "date-desc",
        sortFn: (a: Quiz, b: Quiz) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      },
      {
        label: "Oldest first",
        value: "date-asc",
        sortFn: (a: Quiz, b: Quiz) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      },
    ],
    []
  );

  const [currentSort, setCurrentSort] = useState<string>(sortOptions[0].value);

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const data = await quizApi.getAll(true);
        const publicQuizzes = data.filter((quiz) => quiz.isPublic);
        setQuizzes(publicQuizzes);

        const savedFilter = localStorage.getItem("quizFilter");
        if (savedFilter) {
          try {
            const { showStatuses, sortOption } = JSON.parse(savedFilter);
            setShowActive(showStatuses.includes(QuizStatus.Active));
            setShowPaused(showStatuses.includes(QuizStatus.Paused));
            setShowCreated(showStatuses.includes(QuizStatus.Created));

            if (sortOption) {
              setCurrentSort(sortOption);
            }
            localStorage.removeItem("quizFilter");
          } catch (e) {
            console.error("Error parsing saved filter", e);
          }
        }
      } catch (err) {
        console.error("Error loading quizzes:", err);
        setError("Could not load quizzes. Check API connection.");
      } finally {
        setIsLoading(false);
      }
    };

    loadQuizzes();
  }, []);

  useEffect(() => {
    let filtered = [...quizzes];
    filtered = filtered.filter((quiz) => quiz.isPublic);
    filtered = filtered.filter(
      (quiz) =>
        (showActive && quiz.status === QuizStatus.Active) ||
        (showPaused && quiz.status === QuizStatus.Paused) ||
        (showCreated && quiz.status === QuizStatus.Created)
    );

    if (searchQuery) {
      filtered = filtered.filter((quiz) =>
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const sortOption = sortOptions.find(
      (option) => option.value === currentSort
    );
    if (sortOption) {
      filtered.sort(sortOption.sortFn);
    }

    setFilteredQuizzes(filtered);
  }, [quizzes, showActive, showPaused, showCreated, searchQuery, currentSort]);

  return {
    quizzes,
    filteredQuizzes,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    showActive,
    setShowActive,
    showPaused,
    setShowPaused,
    showCreated,
    setShowCreated,
    currentSort,
    setCurrentSort,
    sortOptions,
  };
};
