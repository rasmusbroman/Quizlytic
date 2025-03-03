'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionType } from '@/lib/types';
import { quizApi, questionApi } from '@/lib/api-client';

export default function CreateQuizPage() {
  const router = useRouter();
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState<{id?: number, text: string, options: string[]}[]>([
    { text: '', options: ['', ''] }
  ]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const addOption = () => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestion].options.push('');
    setQuestions(updatedQuestions);
  };

  const handleQuestionChange = (text: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestion].text = text;
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (index: number, text: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestion].options[index] = text;
    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    setQuestions([...questions, { text: '', options: ['', ''] }]);
    setCurrentQuestion(questions.length);
  };

  const saveQuiz = async () => {
    if (!quizTitle.trim()) {
      setError('Please enter a quiz title');
      return;
    }

    if (!questions[0].text.trim()) {
      setError('Please add at least one question');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const quiz = await quizApi.create({
        title: quizTitle,
        description: ''
      });

      for (const question of questions) {
        if (question.text.trim()) {
          await questionApi.create({
            quizId: quiz.id,
            text: question.text,
            imageUrl: '',
            type: QuestionType.SingleChoice
          });
        }
      }

      router.push(`/quizzes/${quiz.id}`);
    } catch (err) {
      console.error('Error creating quiz:', err);
      setError('Could not create quiz. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="bg-card rounded-lg shadow p-6">
        <h1 className="text-xl font-bold mb-6">Create New Quiz</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
            {error}
          </div>
        )}
        
        <div className="mb-6">
          <input
            type="text"
            placeholder="Quiz Title"
            className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4"
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
          />
          
          <div className="bg-background p-4 rounded-md mb-4">
            <div className="mb-2 font-medium">Question {currentQuestion + 1}</div>
            <textarea
              placeholder="Enter your question"
              className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4"
              value={questions[currentQuestion].text}
              onChange={(e) => handleQuestionChange(e.target.value)}
            />
            
            {questions[currentQuestion].options.map((option, index) => (
              <div key={index} className="flex items-center mb-2">
                <div className="mr-2 text-sm">Option {index + 1}</div>
                <input
                  type="text"
                  placeholder="Enter option text"
                  className="w-full border border-gray-300 rounded-md px-3 py-1"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                />
              </div>
            ))}
            
            <button
              className="text-sm text-primary mt-2"
              onClick={addOption}
            >
              + Add Option
            </button>
          </div>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={addQuestion}
            className="bg-primary text-white py-2 px-4 rounded-md hover:bg-opacity-90 transition"
          >
            Add Question
          </button>
          
          <button
            onClick={saveQuiz}
            className="bg-secondary text-white py-2 px-4 rounded-md hover:bg-opacity-90 transition"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
}