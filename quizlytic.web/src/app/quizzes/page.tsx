'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { quizApi } from '@/lib/api-client';
import { Quiz } from '@/lib/types';
import DateDisplay from '@/components/DateDisplay';

export default function QuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const data = await quizApi.getAll();
        setQuizzes(data);
      } catch (err) {
        console.error('Error loading quizzes:', err);
        setError('Could not load quizzes. Check API connection.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadQuizzes();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="bg-card rounded-lg shadow p-6">
        <h1 className="text-xl font-bold mb-6">All Quizzes</h1>
        
        {isLoading ? (
          <div className="text-center p-4">Loading...</div>
        ) : error ? (
          <div className="bg-red-100 text-red-800 p-4 rounded mb-4">{error}</div>
        ) : quizzes.length === 0 ? (
          <div className="text-center p-4">No quizzes found</div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                onClick={() => router.push(`/quizzes/${quiz.id}`)}
                className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{quiz.title}</h3>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    quiz.status === 'Active' ? 'bg-green-100 text-green-800' : 
                    quiz.status === 'Completed' ? 'bg-gray-100 text-gray-800' : 
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {quiz.status}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">{quiz.description || 'No description'}</p>
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>{quiz.questionsCount} questions</span>
                  <div>Created <DateDisplay date={quiz.createdAt} formatString="PPP" /></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}