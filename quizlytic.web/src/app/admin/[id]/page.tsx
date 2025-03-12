"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import QuizManagement from "@/components/admin/QuizManagement";
import { quizApi } from "@/lib/api-client";
import QuizHost from "@/components/quiz/QuizHost";

export default function AdminQuizPage() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !isAdmin) {
        router.push("/");
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, router]);

  useEffect(() => {
    const loadQuiz = async () => {
      if (id && !isNaN(id)) {
        try {
          const data = await quizApi.getById(id);
          setQuiz(data);
        } catch (err) {
          console.error("Error loading quiz:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    if (isAuthenticated && isAdmin) {
      loadQuiz();
    }
  }, [id, isAuthenticated, isAdmin]);

  if (isLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-2 text-text-secondary">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin || isNaN(id)) {
    return null;
  }

  return <QuizManagement quizId={id} />;
}
