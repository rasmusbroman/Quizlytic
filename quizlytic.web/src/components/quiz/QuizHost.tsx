import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { useQuizHost } from "@/lib/signalr-client";
import { quizApi, resultApi } from "@/lib/api-client";
import { Quiz, Question, QuizStatus, Answer } from "@/lib/types";
import DateDisplay from "@/components/DateDisplay";
import { IoArrowBack } from "react-icons/io5";

interface QuizHostProps {
  quizId: number;
}

const QuizHost: React.FC<QuizHostProps> = ({ quizId }) => {
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [questionResults, setQuestionResults] = useState<Record<number, any[]>>(
    {}
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<
    number | null
  >(null);

  const {
    participants,
    activeQuestion,
    startQuestion,
    endQuestion,
    endQuiz,
    isConnected,
  } = useQuizHost(quizId);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const quizData = await quizApi.getById(quizId);
        setQuiz(quizData);

        if (quizData.pinCode) {
          try {
            const joinUrl = `${window.location.origin}/join?pin=${quizData.pinCode}`;
            const qrDataUrl = await QRCode.toDataURL(joinUrl);
            setQrCode(qrDataUrl);
          } catch (qrErr) {
            console.error("Failed to generate QR code", qrErr);
          }
        }
      } catch (err) {
        console.error("Error loading quiz:", err);
        setError("Could not load quiz. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    loadQuiz();
  }, [quizId]);

  useEffect(() => {
    const loadResults = async (): Promise<void> => {
      try {
        const results = await resultApi.getByQuizId(quizId);

        const resultsByQuestion: Record<number, any[]> = {};
        results.questions.forEach((question: any) => {
          resultsByQuestion[question.questionId] = question.answerDistribution;
        });

        setQuestionResults(resultsByQuestion);
      } catch (err) {
        console.error("Error loading results:", err);
      }
    };

    if (quiz && quiz.status === QuizStatus.Completed) {
      loadResults();
    }
  }, [quizId, quiz?.status]);

  const handleStartQuiz = async () => {
    if (!quiz) return;

    try {
      const updatedQuiz = await quizApi.start(quizId);
      setQuiz(updatedQuiz);
    } catch (err) {
      console.error("Error starting quiz:", err);
      setError("Could not start the quiz. Please try again later.");
    }
  };

  const handleStartQuestion = (index: number) => {
    if (!quiz || !quiz.questions[index]) return;

    setCurrentQuestionIndex(index);
    startQuestion(quiz.questions[index].id);
  };

  const handleEndQuestion = () => {
    endQuestion();
    setCurrentQuestionIndex(null);
  };

  const handleEndQuiz = async () => {
    try {
      await endQuiz();

      const updatedQuiz = await quizApi.getById(quizId);
      setQuiz(updatedQuiz);
    } catch (err) {
      console.error("Error ending quiz:", err);
      setError("Could not end the quiz. Please try again later.");
    }
  };

  const handleViewResults = () => {
    router.push(`/quizzes/${quizId}/results`);
  };

  const getAnswerCount = (results, answerId) => {
    const result = results?.find((r) => r.answerId === answerId);
    return result ? result.count : 0;
  };

  const getAnswerPercentage = (results, answerId) => {
    const count = getAnswerCount(results, answerId);
    const total = results?.reduce((sum, result) => sum + result.count, 0) || 0;
    return total > 0 ? Math.round((count / total) * 100) : 0;
  };

  const handleBackNavigation = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const renderQuestionResult = (question: Question): React.ReactNode => {
    const results = questionResults[question.id] || [];

    if (quiz?.hasCorrectAnswers) {
      return (
        <div className="space-y-1">
          {question.answers.map((answer: Answer, index: number) => (
            <div
              key={answer.id || `${question.id}-answer-${index}`}
              className={`p-2 rounded ${
                answer.isCorrect ? "bg-green-100 border border-green-300" : ""
              }`}
            >
              <div className="flex justify-between">
                <span>{answer.text}</span>
                <span>{getAnswerCount(results, answer.id)} responses</span>
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <div className="space-y-1">
          {question.answers.map((answer: Answer, index: number) => (
            <div
              key={answer.id || `${question.id}-answer-${index}`}
              className="p-2"
            >
              <div className="flex justify-between">
                <span>{answer.text}</span>
                <span>
                  {getAnswerCount(results, answer.id)} responses (
                  {getAnswerPercentage(results, answer.id)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-card rounded-lg shadow p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-2"></div>
          <p className="text-text-secondary">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-card rounded-lg shadow p-6">
          <div className="bg-red-100 text-red-800 p-4 rounded mb-4">
            {error}
          </div>
          <button
            className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-hover transition"
            onClick={() => router.push("/quizzes")}
          >
            Back to all quizzes
          </button>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-card rounded-lg shadow p-6 text-center text-text-secondary">
          Quiz not found
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-primary">{quiz.title}</h1>
          <button
            onClick={handleBackNavigation}
            className="flex items-center text-primary hover:text-primary-hover transition"
            aria-label="Back"
          >
            <IoArrowBack className="h-5 w-5 text-primary" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>

        {quiz.description && (
          <p className="text-text-secondary mb-6">{quiz.description}</p>
        )}

        {!isConnected && (
          <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-4">
            Connecting to server...
          </div>
        )}

        {quiz.status === QuizStatus.Created && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              Start Quiz
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2 text-foreground">
                  Quiz code: {quiz.pinCode}
                </h3>
                <p className="text-sm mb-4 text-text-secondary">
                  Share this code with participants so they can join your quiz.
                </p>

                <button
                  className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-primary-hover transition"
                  onClick={handleStartQuiz}
                >
                  Start Quiz
                </button>
              </div>

              {qrCode && (
                <div className="flex flex-col items-center">
                  <h3 className="font-medium mb-2 text-foreground">
                    QR code to join
                  </h3>
                  <div className="border border-border p-2 rounded-md bg-white">
                    <img src={qrCode} alt="QR code" className="w-40 h-40" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {quiz.status === QuizStatus.Active && (
          <>
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Participants ({participants.length})
                </h2>
                <button
                  className="bg-secondary text-white py-2 px-4 rounded-md hover:bg-secondary-hover transition"
                  onClick={handleEndQuiz}
                >
                  End Quiz
                </button>
              </div>

              <div className="bg-accent rounded-md p-3 mb-4 border border-border">
                <p className="font-medium text-foreground">
                  Connection code: {quiz.pinCode}
                </p>
              </div>

              {participants.length === 0 ? (
                <p className="text-text-secondary">
                  No participants have joined yet.
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {participants.map((p, index) => (
                    <div
                      key={p.id || `${p.name}-${index}`}
                      className="bg-accent px-3 py-2 rounded-md text-center border border-border text-foreground"
                    >
                      {p.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4 text-foreground">
                Questions
              </h2>

              {quiz.questions.length === 0 ? (
                <p className="text-text-secondary">
                  This quiz has no questions yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {quiz.questions.map((question, index) => {
                    return (
                      <div
                        key={question.id}
                        className={`p-4 rounded-lg border ${
                          activeQuestion === question.id
                            ? "border-green-500 bg-accent"
                            : question.hasResponses
                            ? "border-primary bg-accent/50"
                            : "border-border"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium text-foreground">
                              {index + 1}. {question.text}
                            </h3>
                            <p className="text-sm text-text-secondary mt-1">
                              {question.type === 0
                                ? "Single choice"
                                : question.type === 1
                                ? "Multiple choice"
                                : "Free text"}
                            </p>
                          </div>
                          <div>
                            {activeQuestion === question.id ? (
                              <button
                                className="bg-secondary text-white py-1 px-3 rounded-md hover:bg-secondary-hover transition text-sm"
                                onClick={handleEndQuestion}
                              >
                                End Question
                              </button>
                            ) : (
                              <button
                                className="bg-primary text-white py-1 px-3 rounded-md hover:bg-primary-hover transition text-sm"
                                onClick={() => handleStartQuestion(index)}
                                disabled={activeQuestion !== null}
                              >
                                Start Question
                              </button>
                            )}
                          </div>
                        </div>
                        {question.hasResponses &&
                          activeQuestion !== question.id && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <h4 className="font-medium text-sm mb-2 text-foreground">
                                Results:
                              </h4>
                              {renderQuestionResult(question)}
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
        {quiz.status === QuizStatus.Completed && (
          <div>
            <div className="bg-green-100 text-green-800 p-4 rounded-md mb-6">
              <h2 className="text-xl font-semibold mb-2">Quiz completed!</h2>
              <p>
                This quiz was completed on{" "}
                <DateDisplay date={quiz.endedAt} formatString="PPP p" />.
              </p>
            </div>

            <button
              className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-hover transition"
              onClick={handleViewResults}
            >
              View Results
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizHost;
