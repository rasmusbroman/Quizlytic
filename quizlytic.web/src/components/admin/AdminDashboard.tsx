"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  IoArrowBack,
  IoFilter,
  IoSearch,
  IoEllipsisVertical,
} from "react-icons/io5";
import { useAuth } from "@/hooks/useAuth";
import { requireAuth } from "@/lib/auth";
import { quizApi } from "@/lib/api-client";
import { Quiz, QuizStatus } from "@/lib/types";
import DateDisplay from "@/components/DateDisplay";
import SortDropdown, { SortOption } from "@/components/ui/SortDropdown";

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [actionMenuQuiz, setActionMenuQuiz] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentSort, setCurrentSort] = useState<string>("date-desc");

  const sortOptions: SortOption[] = [
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
  ];

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/");
        return;
      }

      if (!isAdmin) {
        router.push("/");
        return;
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, router]);

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const data = await quizApi.getAll(false);
        setQuizzes(data);
      } catch (err) {
        console.error("Error loading quizzes:", err);
        setError("Could not load quizzes. Please check API connection.");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && isAdmin) {
      loadQuizzes();
    }
  }, [isAuthenticated, isAdmin]);

  const filteredQuizzes = quizzes
    .filter((quiz) => {
      const matchesSearch = quiz.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === null || quiz.status.toString() === selectedStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const sortOption = sortOptions.find(
        (option) => option.value === currentSort
      );
      return sortOption?.sortFn ? sortOption.sortFn(a, b) : 0;
    });

  const handleQuizClick = (id: number) => {
    router.push(`/admin/${id}`);
  };

  const handleStartQuiz = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await quizApi.start(id);
      setQuizzes((prevQuizzes) =>
        prevQuizzes.map((quiz) =>
          quiz.id === id ? { ...quiz, status: QuizStatus.Active } : quiz
        )
      );
    } catch (err) {
      console.error("Error starting quiz:", err);
      setError("Could not start quiz. Please try again.");
    }
  };

  const handleDeleteQuiz = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      window.confirm(
        "Are you sure you want to delete this quiz? This action cannot be undone."
      )
    ) {
      try {
        await quizApi.delete(id);
        setQuizzes((prevQuizzes) =>
          prevQuizzes.filter((quiz) => quiz.id !== id)
        );
      } catch (err) {
        console.error("Error deleting quiz:", err);
        setError("Could not delete quiz. Please try again.");
      }
    }
  };

  const getStatusBadgeClasses = (status: QuizStatus): string => {
    switch (status) {
      case QuizStatus.Active:
        return "bg-green-100 text-green-800";
      case QuizStatus.Paused:
        return "bg-yellow-100 text-yellow-800";
      case QuizStatus.Created:
        return "bg-blue-100 text-blue-800";
      case QuizStatus.Completed:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: QuizStatus): string => {
    switch (status) {
      case QuizStatus.Active:
        return "Active";
      case QuizStatus.Paused:
        return "Paused";
      case QuizStatus.Created:
        return "Draft";
      case QuizStatus.Completed:
        return "Completed";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
          <button
            onClick={() => router.push("/")}
            className="flex items-center text-primary hover:text-primary-hover transition"
          >
            <IoArrowBack className="h-5 w-5 mr-1" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search quizzes..."
                className="w-full border border-border rounded-md px-4 py-2 pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="absolute left-3 top-2.5 text-text-secondary">
                <IoSearch className="h-5 w-5" />
              </span>
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <button
                  className="flex items-center px-4 py-2 border border-border rounded-md text-foreground hover:bg-accent"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <IoFilter className="h-5 w-5 mr-2" />
                  <span>
                    {selectedStatus === null
                      ? "Filter"
                      : `Filter: ${getStatusLabel(
                          Number(selectedStatus) as QuizStatus
                        )}`}
                  </span>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-card rounded-md shadow-lg z-10 border border-border">
                    {Object.values(QuizStatus)
                      .filter((v) => !isNaN(Number(v)))
                      .map((status) => (
                        <button
                          key={status}
                          className={`block w-full text-left px-4 py-2 text-sm ${
                            selectedStatus === status.toString()
                              ? "bg-accent text-primary"
                              : "text-foreground hover:bg-accent"
                          }`}
                          onClick={() => {
                            setSelectedStatus(status.toString());
                            setIsDropdownOpen(false);
                          }}
                        >
                          {getStatusLabel(status as QuizStatus)}
                        </button>
                      ))}
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent"
                      onClick={() => {
                        setSelectedStatus(null);
                        setIsDropdownOpen(false);
                      }}
                    >
                      Show All
                    </button>
                  </div>
                )}
              </div>
              <SortDropdown
                sortOptions={sortOptions}
                currentSort={currentSort}
                onSelectSort={setCurrentSort}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2 text-text-secondary">Loading quizzes...</p>
          </div>
        ) : filteredQuizzes.length > 0 ? (
          <div className="space-y-3">
            {filteredQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="border border-border rounded-md p-4 hover:bg-accent cursor-pointer transition relative"
                onClick={() => handleQuizClick(quiz.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center">
                      <h3 className="font-medium text-foreground">
                        {quiz.title}
                      </h3>
                      {!quiz.isPublic && (
                        <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                          Private
                        </span>
                      )}
                    </div>
                    <p className="text-text-secondary mt-1">
                      {quiz.questionsCount} questions
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClasses(
                        quiz.status
                      )}`}
                    >
                      {getStatusLabel(quiz.status)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionMenuQuiz(
                          actionMenuQuiz === quiz.id ? null : quiz.id
                        );
                      }}
                      className="p-1 hover:bg-background rounded-full"
                    >
                      <IoEllipsisVertical className="h-5 w-5 text-text-secondary" />
                    </button>
                  </div>
                </div>
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

                {actionMenuQuiz === quiz.id && (
                  <div className="absolute right-3 top-16 w-48 bg-card rounded-md shadow-lg z-10 border border-border overflow-hidden">
                    {quiz.status === QuizStatus.Created && (
                      <button
                        onClick={(e) => handleStartQuiz(quiz.id, e)}
                        className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent"
                      >
                        Start Quiz
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDeleteQuiz(quiz.id, e)}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Delete Quiz
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-text-secondary">
              No quizzes match your criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
