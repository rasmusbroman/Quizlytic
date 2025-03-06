import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { usePDF } from 'react-to-pdf';
import { resultApi, quizApi } from '@/lib/api-client';
import { Quiz, QuizResult } from '@/lib/types';

interface QuizResultsProps {
  quizId: number;
}

const QuizResults: React.FC<QuizResultsProps> = ({ quizId }) => {
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [results, setResults] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { toPDF, targetRef } = usePDF({
    filename: 'quiz-results.pdf',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const quizData = await quizApi.getById(quizId);
        setQuiz(quizData);
        
        const resultsData = await resultApi.getByQuizId(quizId);
        setResults(resultsData);
      } catch (err) {
        console.error('Error loading quiz results:', err);
        setError('Kunde inte ladda resultaten. Försök igen senare.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [quizId]);

  const handleExportPdf = () => {
    toPDF();
  };

  if (isLoading) {
    return <div className="text-center p-8">Laddar resultat...</div>;
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto my-8 p-6 card">
        <div className="bg-red-100 text-red-800 p-4 rounded mb-4">{error}</div>
        <button className="btn-primary" onClick={() => router.push('/quizzes')}>
          Tillbaka till alla quiz
        </button>
      </div>
    );
  }

  if (!quiz || !results) {
    return <div>Resultat finns inte tillgängliga</div>;
  }

  return (
    <div className="max-w-4xl mx-auto my-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Resultat: {quiz.title}</h1>
        <button className="btn-primary" onClick={handleExportPdf}>
          Exportera som PDF
        </button>
      </div>
      
      <div className="p-6 card mb-6">
        <h2 className="text-xl font-semibold mb-4">Sammanfattning</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded p-4 text-center">
            <p className="text-sm text-gray-600">Totalt antal deltagare</p>
            <p className="text-3xl font-bold">{results.participantsCount}</p>
          </div>
          <div className="bg-green-50 rounded p-4 text-center">
            <p className="text-sm text-gray-600">Antal frågor</p>
            <p className="text-3xl font-bold">{results.questions.length}</p>
          </div>
          <div className="bg-purple-50 rounded p-4 text-center">
            <p className="text-sm text-gray-600">Genomsnittlig svarstid</p>
            <p className="text-3xl font-bold">45s</p>
          </div>
        </div>
      </div>
      
      <div ref={targetRef} className="bg-white">
        <div className="p-6 card">
          <h2 className="text-xl font-semibold mb-6">Detaljerade resultat</h2>
          
          {results.questions.map((question, index) => (
            <div key={index} className="mb-8 border-b pb-6">
              <h3 className="text-lg font-medium mb-2">
                Fråga {index + 1}: {question.questionText}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {question.responsesCount} svar av {results.participantsCount} deltagare
              </p>
              
              {question.answerDistribution.length > 0 ? (
                <div className="space-y-3">
                  {question.answerDistribution.map((answer, aIndex) => (
                    <div key={aIndex} className="relative">
                      <div className="flex justify-between mb-1">
                        <span>{answer.answerText || 'Inget svar'}</span>
                        <span className="font-medium">
                          {answer.count} ({answer.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${answer.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : question.freeTextResponses && question.freeTextResponses.length > 0 ? (
                <div className="space-y-3">
                  {question.freeTextResponses.map((resp, rIndex) => (
                    <div key={rIndex} className="bg-gray-50 p-3 rounded">
                      <p className="font-medium text-sm">{resp.participantName}:</p>
                      <p>{resp.response}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Inga svar på denna fråga.</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizResults;