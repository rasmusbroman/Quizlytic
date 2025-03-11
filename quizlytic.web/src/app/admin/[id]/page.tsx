"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import QuizManagement from "@/components/admin/QuizManagement";

export default function AdminQuizPage() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !isAdmin) {
        router.push("/");
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, router]);

  if (isLoading) {
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
