"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { quizApi } from "@/lib/api-client";
import { Quiz } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const data = await quizApi.getAll();
        setQuizzes(data);
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
        <h1 className="text-xl font-bold mb-4">Dashboard</h1>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search Quiz here..."
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push("/quizzes")}
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-opacity-90 transition"
          >
            Show All Quizzes
          </button>

          <button
            onClick={() => router.push("/join")}
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-opacity-90 transition"
          >
            Join Quiz with PinCode
          </button>

          <Link
            href="/create"
            className="block w-full bg-secondary text-white py-2 px-4 rounded-md hover:bg-opacity-90 transition text-center"
          >
            Create New Quiz
          </Link>
        </div>

        <div className="mt-8">
          <button
            onClick={() => router.push("/contact")}
            className="w-full border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50 transition"
          >
            Contact Us
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center p-4">Laddar...</div>
      ) : error ? (
        <div className="bg-red-100 text-red-800 p-4 rounded mb-4">{error}</div>
      ) : filteredQuizzes.length > 0 ? (
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4">Your Recent Quizzes</h2>
          <div className="space-y-3">
            {filteredQuizzes.slice(0, 5).map((quiz) => (
              <div
                key={quiz.id}
                onClick={() => router.push(`/quizzes/${quiz.id}`)}
                className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{quiz.title}</h3>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      quiz.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : quiz.status === "Completed"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {quiz.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {quiz.questionsCount} questions
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
