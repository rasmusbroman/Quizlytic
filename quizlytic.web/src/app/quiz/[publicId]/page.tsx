"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { quizApi } from "@/lib/api-client";
import { Quiz } from "@/lib/types";
import QuizHost from "@/components/quiz/QuizHost";

export default function QuizPublicPage() {
  const params = useParams();
  const router = useRouter();
  const publicId = params.publicId as string;
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const quizData = await quizApi.getByPublicId(publicId);
        setQuiz(quizData);
      } catch (err) {
        console.error("Error loading quiz:", err);
        setError("Could not load quiz. The quiz may not exist or you may not have permission to view it.");
      } finally {
        setLoading(false);
      }
    };

    if (publicId) {
      loadQuiz();
    }
  }, [publicId]);

  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-card rounded-lg shadow p-6">
          <div className="bg-red-100 text-red-800 p-4 rounded mb-4">
            {error}
          </div>
          <button
            className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-hover transition"
            onClick={() => router.push("/")}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-card rounded-lg shadow p-6 text-center">
          Quiz not found
        </div>
      </div>
    );
  }

  return <QuizHost quizId={quiz.id} />;
}