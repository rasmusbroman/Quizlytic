"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { quizApi } from "@/lib/api-client";

export default function QuizRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);

  useEffect(() => {
    const redirectToPublicId = async () => {
      try {
        const quiz = await quizApi.getById(id);
        router.replace(`/quiz/${quiz.publicId}`);
      } catch (err) {
        console.error("Error loading quiz for redirect:", err);
        router.push("/");
      }
    };

    if (!isNaN(id)) {
      redirectToPublicId();
    } else {
      router.push("/");
    }
  }, [id, router]);

  return <div className="text-center p-8">Redirecting...</div>;
}
