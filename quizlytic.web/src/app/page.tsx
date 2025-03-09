"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { quizApi } from "@/lib/api-client";
import { Quiz, QuizStatus } from "@/lib/types";
import DateDisplay from "@/components/DateDisplay";
import { IoSearch } from "react-icons/io5";

export default function HomePage() {
  const router = useRouter();
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

  const activeQuizzes = quizzes
    .filter((quiz) => quiz.status === QuizStatus.Active && quiz.isPublic)
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

  const filteredQuizzes = activeQuizzes.filter((quiz) =>
    quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const displayQuizzes = filteredQuizzes.slice(0, 6);
  const handleShowAllQuizzes = () => {
    localStorage.setItem(
      "quizFilter",
      JSON.stringify({
        showStatuses: [
          QuizStatus.Active,
          QuizStatus.Paused,
          QuizStatus.Created,
        ],
        sortOption: "date-desc",
        publicOnly: true,
      })
    );
    router.push("/quizzes");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-card rounded-lg shadow p-8 mb-8">
        <h1 className="text-2xl font-bold mb-3 text-foreground">
          Welcome to Quizlytic
        </h1>
        <p className="text-text-secondary mb-6">
          Create and participate in interactive quizzes in real-time. Join an
          active quiz or create your own to get started.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push("/join")}
            className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-primary-hover transition"
          >
            Join a Quiz
          </button>

          <Link
            href="/create"
            className="block w-full bg-secondary text-white py-3 px-4 rounded-md hover:bg-secondary-hover transition text-center"
          >
            Create a Quiz
          </Link>

          <button
            onClick={() => router.push("/results")}
            className="w-full bg-accent text-primary py-3 px-4 rounded-md hover:bg-border transition"
          >
            View Results
          </button>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow p-6 mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Search active public quizzes..."
            className="w-full border border-border rounded-md px-4 py-3 pr-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute right-3 top-3 text-primary">
            <IoSearch className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-foreground">
            Active Public Quizzes
          </h2>
          <button
            onClick={handleShowAllQuizzes}
            className="inline-block border border-primary text-primary px-4 py-1 rounded-md hover:bg-accent transition text-sm"
          >
            View All Quizzes
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2 text-text-secondary">Loading quizzes...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-800 p-4 rounded mb-4">
            {error}
          </div>
        ) : displayQuizzes.length > 0 ? (
          <div className="space-y-4">
            {displayQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                onClick={() => router.push(`/quizzes/${quiz.id}`)}
                className="border border-border rounded-md p-4 hover:bg-accent cursor-pointer transition"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-foreground">{quiz.title}</h3>
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
                <p className="text-text-secondary mt-1">
                  {quiz.questionsCount} questions
                </p>
                <p className="text-xs text-text-secondary mt-2">
                  Created{" "}
                  <DateDisplay date={quiz.createdAt} formatString="PPp" />
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-text-secondary">
              No active public quizzes found
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              Create a new quiz or check back later for active sessions
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
