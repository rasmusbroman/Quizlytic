"use client";

import { useRouter } from "next/navigation";
import { IoArrowBack } from "react-icons/io5";
import { useQuizList } from "./hooks/useQuizList";
import SearchInput from "./components/SearchInput";
import QuizFilters from "./components/QuizFilters";
import SortDropdown from "./components/SortDropdown";
import QuizItem from "./components/QuizItem";

export default function QuizzesPage() {
  const router = useRouter();
  const quizList = useQuizList();

  const handleBackNavigation = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleQuizClick = (id: number) => {
    router.push(`/quizzes/${id}`);
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
          <SearchInput
            value={quizList.searchQuery}
            onChange={quizList.setSearchQuery}
          />

          <QuizFilters
            showActive={quizList.showActive}
            showPaused={quizList.showPaused}
            showCreated={quizList.showCreated}
            onToggleActive={() => quizList.setShowActive(!quizList.showActive)}
            onTogglePaused={() => quizList.setShowPaused(!quizList.showPaused)}
            onToggleCreated={() =>
              quizList.setShowCreated(!quizList.showCreated)
            }
          />

          <div className="flex justify-end items-center">
            <SortDropdown
              sortOptions={quizList.sortOptions}
              currentSort={quizList.currentSort}
              onSelectSort={quizList.setCurrentSort}
            />
          </div>
        </div>

        {quizList.isLoading ? (
          <div className="text-center p-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2 text-text-secondary">Loading quizzes...</p>
          </div>
        ) : quizList.error ? (
          <div className="bg-red-100 text-red-800 p-4 rounded mb-4">
            {quizList.error}
          </div>
        ) : quizList.filteredQuizzes.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-text-secondary">No quizzes match your filters</p>
            <p className="mt-2 text-sm text-text-secondary">
              Try adjusting your filter settings or create a new quiz
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {quizList.filteredQuizzes.map((quiz) => (
              <QuizItem key={quiz.id} quiz={quiz} onClick={handleQuizClick} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
