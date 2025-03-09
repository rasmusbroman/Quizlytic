"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { quizApi } from "@/lib/api-client";
import { Quiz, QuizStatus } from "@/lib/types";
import DateDisplay from "@/components/DateDisplay";
import { IoArrowBack, IoSearch } from "react-icons/io5";
import { FiFilter } from "react-icons/fi";

type SortOption = {
  label: string;
  value: string;
  sortFn: (a: Quiz, b: Quiz) => number;
};

export default function QuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSortOptions, setShowSortOptions] = useState(false);

  const [showActive, setShowActive] = useState(true);
  const [showPaused, setShowPaused] = useState(true);
  const [showCreated, setShowCreated] = useState(false);

  const sortOptions: SortOption[] = [
    {
      label: "Title (A-Z)",
      value: "title-asc",
      sortFn: (a, b) => a.title.localeCompare(b.title),
    },
    {
      label: "Title (Z-A)",
      value: "title-desc",
      sortFn: (a, b) => b.title.localeCompare(a.title),
    },
    {
      label: "Newest first",
      value: "date-desc",
      sortFn: (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    },
    {
      label: "Oldest first",
      value: "date-asc",
      sortFn: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
  ];

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

  const getStatusBadgeClasses = (status: QuizStatus) => {
    switch (status) {
      case QuizStatus.Active:
        return "bg-green-100 text-green-800";
      case QuizStatus.Paused:
        return "bg-yellow-100 text-yellow-800";
      case QuizStatus.Created:
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: QuizStatus) => {
    switch (status) {
      case QuizStatus.Active:
        return "Active";
      case QuizStatus.Paused:
        return "Paused";
      case QuizStatus.Created:
        return "Draft";
      default:
        return "Unknown";
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
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-primary">Public Quizzes</h1>
          <button
            onClick={handleBackNavigation}
            className="flex items-center text-primary hover:text-primary-hover transition"
            aria-label="Back"
          >
            <IoArrowBack className="h-5 w-5 text-primary" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>

        <div className="mb-6 space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search quizzes..."
              className="w-full border border-border rounded-md px-4 py-3 pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-3 top-3 text-primary">
              <IoSearch className="h-6 w-6" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            <button
              onClick={() => setShowActive(!showActive)}
              className={`px-3 py-1 rounded-md text-sm ${
                showActive
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-gray-100 text-gray-600 border border-gray-200"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setShowPaused(!showPaused)}
              className={`px-3 py-1 rounded-md text-sm ${
                showPaused
                  ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                  : "bg-gray-100 text-gray-600 border border-gray-200"
              }`}
            >
              Paused
            </button>
            <button
              onClick={() => setShowCreated(!showCreated)}
              className={`px-3 py-1 rounded-md text-sm ${
                showCreated
                  ? "bg-blue-100 text-blue-800 border border-blue-300"
                  : "bg-gray-100 text-gray-600 border border-gray-200"
              }`}
            >
              Draft
            </button>
          </div>

          <div className="flex justify-end items-center">
            <div className="relative">
              <button
                onClick={() => setShowSortOptions(!showSortOptions)}
                className="flex items-center px-3 py-1 border border-border rounded-md text-foreground hover:bg-accent"
              >
                <span className="mr-2 hidden sm:inline">Sort</span>
                <FiFilter className="w-5 h-5" />
              </button>

              {showSortOptions && (
                <div className="absolute right-0 mt-1 w-48 bg-card rounded-md shadow-lg z-10 border border-border">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        currentSort === option.value
                          ? "bg-accent text-primary"
                          : "text-foreground hover:bg-accent"
                      }`}
                      onClick={() => {
                        setCurrentSort(option.value);
                        setShowSortOptions(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center p-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2 text-text-secondary">Loading quizzes...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-800 p-4 rounded mb-4">
            {error}
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-text-secondary">No quizzes match your filters</p>
            <p className="mt-2 text-sm text-text-secondary">
              Try adjusting your filter settings or create a new quiz
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                onClick={() => router.push(`/quizzes/${quiz.id}`)}
                className="border border-border rounded-md p-4 hover:bg-accent cursor-pointer transition"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-foreground">{quiz.title}</h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClasses(
                      quiz.status
                    )}`}
                  >
                    {getStatusLabel(quiz.status)}
                  </span>
                </div>
                <p className="text-text-secondary mt-1">
                  {quiz.questionsCount} questions
                </p>
                <div className="flex justify-between text-xs text-text-secondary mt-2">
                  <span>
                    Created{" "}
                    <DateDisplay date={quiz.createdAt} formatString="PPp" />
                  </span>
                  {quiz.startedAt && (
                    <span>
                      Started{" "}
                      <DateDisplay date={quiz.startedAt} formatString="PPp" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
