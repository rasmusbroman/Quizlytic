import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { QuestionType } from '@/lib/types';
import { quizApi, questionApi } from '@/lib/api-client';

const QuizCreator: React.FC = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [quizId, setQuizId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<{
    text: string;
    type: QuestionType;
    imageUrl?: string;
    answers: { text: string; isCorrect: boolean }[];
  }[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    text: '',
    type: QuestionType.SingleChoice,
    imageUrl: '',
    answers: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateQuiz = async () => {
    if (!quizTitle.trim()) {
      setError('Du måste ange en titel för ditt quiz');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const quiz = await quizApi.create({
        title: quizTitle,
        description: quizDescription
      });
      
      setQuizId(quiz.id);
      setStep(2);
    } catch (err) {
      console.error('Error creating quiz:', err);
      setError('Kunde inte skapa quizet. Försök igen senare.');
    } finally {
      setIsLoading(false);
    }
  };

  const addAnswer = () => {
    setCurrentQuestion({
      ...currentQuestion,
      answers: [...currentQuestion.answers, { text: '', isCorrect: false }]
    });
  };

  const removeAnswer = (index: number) => {
    setCurrentQuestion({
      ...currentQuestion,
      answers: currentQuestion.answers.filter((_, i) => i !== index)
    });
  };

  const handleAnswerChange = (index: number, text: string) => {
    setCurrentQuestion({
      ...currentQuestion,
      answers: currentQuestion.answers.map((answer, i) =>
        i === index ? { ...answer, text } : answer
      )
    });
  };

  const handleCorrectAnswerChange = (index: number) => {
    setCurrentQuestion({
      ...currentQuestion,
      answers: currentQuestion.answers.map((answer, i) =>
        i === index
          ? { ...answer, isCorrect: true }
          : currentQuestion.type === QuestionType.SingleChoice
          ? { ...answer, isCorrect: false }
          : answer
      )
    });
  };

  const handleAddQuestion = async () => {
    if (!currentQuestion.text.trim()) {
      setError('Du måste ange en frågetext');
      return;
    }

    if (currentQuestion.type !== QuestionType.FreeText && 
        !currentQuestion.answers.some(a => a.text.trim() !== '')) {
      setError('Du måste ha minst ett svarsalternativ');
      return;
    }

    if (currentQuestion.type !== QuestionType.FreeText && 
        !currentQuestion.answers.some(a => a.isCorrect)) {
      setError('Du måste markera minst ett rätt svar');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (quizId) {
        const validAnswers = currentQuestion.answers
          .filter(answer => answer.text.trim() !== '');
        await questionApi.create({
          quizId,
          text: currentQuestion.text,
          imageUrl: currentQuestion.imageUrl || undefined,
          type: currentQuestion.type,
          answers: validAnswers
        });

        setQuestions([...questions, currentQuestion]);
        setCurrentQuestion({
          text: '',
          type: QuestionType.SingleChoice,
          imageUrl: '',
          answers: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
          ]
        });
      }
    } catch (err) {
      console.error('Error adding question:', err);
      setError('Kunde inte lägga till frågan. Försök igen senare.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    if (quizId) {
      router.push(`/quizzes/${quizId}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-8 p-6 card">
      <h1 className="text-2xl font-bold mb-6">Skapa nytt quiz</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}

      {step === 1 ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Grundinformation</h2>
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Quiz-titel</label>
            <input
              type="text"
              className="input"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              placeholder="T.ex. 'Programmering med C#'"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-1">Beskrivning (valfritt)</label>
            <textarea
              className="input"
              rows={3}
              value={quizDescription}
              onChange={(e) => setQuizDescription(e.target.value)}
              placeholder="Beskriv vad detta quiz handlar om"
            />
          </div>

          <button
            className="btn-primary"
            onClick={handleCreateQuiz}
            disabled={isLoading}
          >
            {isLoading ? 'Skapar...' : 'Fortsätt till frågor'}
          </button>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-4">Skapa frågor</h2>

          {questions.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Tillagda frågor:</h3>
              <ul className="list-disc pl-5">
                {questions.map((q, index) => (
                  <li key={index} className="mb-1">
                    {q.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Frågetext</label>
            <input
              type="text"
              className="input"
              value={currentQuestion.text}
              onChange={(e) =>
                setCurrentQuestion({ ...currentQuestion, text: e.target.value })
              }
              placeholder="Skriv din fråga här"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Bild URL (valfritt)</label>
            <input
              type="text"
              className="input"
              value={currentQuestion.imageUrl || ''}
              onChange={(e) =>
                setCurrentQuestion({
                  ...currentQuestion,
                  imageUrl: e.target.value
                })
              }
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-1">Frågetyp</label>
            <select
              className="input"
              value={currentQuestion.type}
              onChange={(e) =>
                setCurrentQuestion({
                  ...currentQuestion,
                  type: e.target.value as QuestionType
                })
              }
            >
              <option value={QuestionType.SingleChoice}>Ett rätt svar</option>
              <option value={QuestionType.MultipleChoice}>Flera rätta svar</option>
              <option value={QuestionType.FreeText}>Fritext</option>
            </select>
          </div>

          {currentQuestion.type !== QuestionType.FreeText && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-700">Svarsalternativ</label>
                <button
                  type="button"
                  className="text-sm text-primary"
                  onClick={addAnswer}
                >
                  + Lägg till alternativ
                </button>
              </div>

              {currentQuestion.answers.map((answer, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type={
                      currentQuestion.type === QuestionType.SingleChoice
                        ? 'radio'
                        : 'checkbox'
                    }
                    name="correctAnswer"
                    checked={answer.isCorrect}
                    onChange={() => handleCorrectAnswerChange(index)}
                    className="mr-2"
                  />
                  <input
                    type="text"
                    value={answer.text}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    className="input"
                    placeholder={`Alternativ ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeAnswer(index)}
                    className="ml-2 text-red-500"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex space-x-4">
            <button className="btn-primary" onClick={handleAddQuestion} disabled={isLoading}>
              {isLoading ? 'Lägger till...' : 'Lägg till fråga'}
            </button>
            
            {questions.length > 0 && (
              <button className="btn-secondary" onClick={handleFinish}>
                Slutför quiz
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizCreator;