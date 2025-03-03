'use client';

import { useParams, useRouter } from 'next/navigation';
import QuizHost from '@/components/quiz/QuizHost';
import { useEffect, useState } from 'react';

export default function QuizHostPage() {
  const params = useParams();
  const router = useRouter();
  const [isRouterReady, setIsRouterReady] = useState(false);
  
  useEffect(() => {
    setIsRouterReady(true);
  }, []);
  
  if (!isRouterReady) {
    return <div className="text-center p-8">Loading...</div>;
  }
  
  const quizId = parseInt(params.id as string);
  return <QuizHost quizId={quizId} />;
}