"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { quizApi } from "@/lib/api-client";
import { Quiz, QuizStatus } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const data = await quizApi.getAll();
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
    .filter((quiz) => quiz.status === "Active")
    .sort((a, b) => {
      const dateA = a.startedAt ? new Date(a.startedAt).getTime() : 0;
      const dateB = b.startedAt ? new Date(b.startedAt).getTime() : 0;
      return dateB - dateA;
    });

  const filteredQuizzes = activeQuizzes.filter((quiz) =>
    quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-card rounded-lg shadow p-6">
          <h1 className="text-xl font-bold mb-6 text-foreground">
            Active Quizzes
          </h1>
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search active quizzes..."
              className="w-full border border-border rounded-md px-3 py-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <button
              onClick={() => router.push("/quizzes")}
              className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-primary-hover transition"
            >
              Show All Quizzes
            </button>

            <button
              onClick={() => router.push("/join")}
              className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-primary-hover transition"
            >
              Join Quiz with PinCode
            </button>

            <Link
              href="/create"
              className="block w-full bg-secondary text-white py-3 px-4 rounded-md hover:bg-secondary-hover transition text-center"
            >
              Create New Quiz
            </Link>

            <button
              onClick={() => setShowContactModal(true)}
              className="w-full border border-border py-3 px-4 rounded-md hover:bg-accent transition text-foreground"
            >
              Contact Us
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {isLoading ? (
            <div className="bg-card rounded-lg shadow p-6 text-center">
              <p className="text-foreground">Loading quizzes...</p>
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-800 p-4 rounded mb-4 shadow">
              {error}
            </div>
          ) : (
            <div className="bg-card rounded-lg shadow p-6">
              <h2 className="text-lg font-bold mb-4 text-foreground">
                Ongoing Quizzes
              </h2>

              {filteredQuizzes.length > 0 ? (
                <div className="space-y-3">
                  {filteredQuizzes.slice(0, 5).map((quiz) => (
                    <div
                      key={quiz.id}
                      onClick={() => router.push(`/quizzes/${quiz.id}`)}
                      className="border border-border rounded-md p-3 hover:bg-accent cursor-pointer transition"
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-foreground">
                          {quiz.title}
                        </h3>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mt-1">
                        {quiz.questionsCount} questions •{" "}
                        {quiz.participantsCount} participants
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-secondary">No active quizzes found</p>
              )}
            </div>
          )}
        </div>
      </div>

      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-foreground">Contact Us</h2>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-foreground mb-1">Your Name</label>
                <input
                  type="text"
                  className="w-full border border-border rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-foreground mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border border-border rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-foreground mb-1">Message</label>
                <textarea
                  rows={4}
                  className="w-full border border-border rounded-md px-3 py-2"
                ></textarea>
              </div>

              <button className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-hover transition">
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
