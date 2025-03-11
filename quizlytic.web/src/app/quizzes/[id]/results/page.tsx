"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { quizApi } from "@/lib/api-client";
import { Quiz } from "@/lib/types";
import DateDisplay from "@/components/DateDisplay";

export default function ResultsPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const data = await quizApi.getAll();
        const completedQuizzes = data.filter((q) => q.status === "Completed");
        setQuizzes(completedQuizzes);
      } catch (err) {
        console.error("Error loading quizzes:", err);
        setError("Kunde inte ladda quiz. Kontrollera API-anslutningen.");
      } finally {
        setIsLoading(false);
      }
    };

    loadQuizzes();
  }, []);

  const filteredQuizzes = quizzes.filter((quiz) =>
    quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="bg-card rounded-lg shadow p-6 mb-8">
        <h1 className="text-xl font-bold mb-4">Archived Quizzes</h1>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search archived Quiz here..."
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button
          onClick={() => setSearchQuery("")}
          className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-opacity-90 transition"
        >
          Show all archived Quizzes
        </button>

        <div className="mt-8">
          <h2 className="text-lg font-bold mb-3">Recent Activity</h2>

          <div className="space-y-2">
            <div className="bg-background p-3 rounded text-sm">
              &quot;How to cook pasta&quot; question 3 received the wrong
              answer.
            </div>
            <div className="bg-background p-3 rounded text-sm">
              Are you worried about your audience?
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-bold mb-3">Response Statistics</h2>

          <div className="h-32 bg-white border border-gray-200 rounded-md flex items-center justify-center">
            <svg width="280" height="100" viewBox="0 0 280 100">
              <polyline
                fill="none"
                stroke="#5A9E5A"
                strokeWidth="2"
                points="0,80 40,70 80,40 120,30 160,50 200,45 240,30 280,40"
              />
              <line x1="0" y1="99" x2="280" y2="99" stroke="#eee" />
            </svg>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center p-4">Laddar...</div>
      ) : error ? (
        <div className="bg-red-100 text-red-800 p-4 rounded mb-4">{error}</div>
      ) : filteredQuizzes.length > 0 ? (
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4">Archived Quizzes</h2>
          <div className="space-y-3">
            {filteredQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                onClick={() => router.push(`/quiz/${quiz.publicId}/results`)}
                className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 cursor-pointer"
              >
                <h3 className="font-medium">{quiz.title}</h3>
                <div className="flex justify-between text-sm text-gray-600 mt-1">
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
        </div>
      ) : (
        <div className="bg-card rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">No archived quizzes found.</p>
        </div>
      )}

      <div className="bg-card rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4 text-foreground">
          Recent Activity
        </h2>
        <div className="space-y-2">
          {activeQuizzes.length > 0 ? (
            activeQuizzes.slice(0, 2).map((quiz, index) => (
              <div
                key={index}
                className="bg-accent p-3 rounded text-sm text-foreground"
              >
                Quiz active - {quiz.title} ({quiz.participantsCount}{" "}
                participants)
              </div>
            ))
          ) : (
            <div className="bg-accent p-3 rounded text-sm text-foreground">
              No recent activity to display
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-3 text-foreground">
          Response Statistics
        </h2>
        <div className="h-32 bg-card border border-border rounded-md flex items-center justify-center">
          <svg width="280" height="100" viewBox="0 0 280 100">
            <polyline
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2"
              points="0,80 40,70 80,40 120,30 160,50 200,45 240,30 280,40"
            />
            <line x1="0" y1="99" x2="280" y2="99" stroke="var(--border)" />
          </svg>
        </div>
      </div>
    </div>
  );
}
