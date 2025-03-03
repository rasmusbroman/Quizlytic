import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { useQuizHost } from "../../lib/signalr-client";
import { quizApi } from "../../lib/api-client";
import { Quiz, Question, QuizStatus } from "@/lib/types";
import DateDisplay from "@/components/DateDisplay";

interface QuizHostProps {
  quizId: number;
}

const QuizHost: React.FC<QuizHostProps> = ({ quizId }) => {
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
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
        setError("Kunde inte ladda quizet. Försök igen senare.");
      } finally {
        setIsLoading(false);
      }
    };

    loadQuiz();
  }, [quizId]);

  const handleStartQuiz = async () => {
    if (!quiz) return;

    try {
      const updatedQuiz = await quizApi.start(quizId);
      setQuiz(updatedQuiz);
    } catch (err) {
      console.error("Error starting quiz:", err);
      setError("Kunde inte starta quizet. Försök igen senare.");
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
      setError("Kunde inte avsluta quizet. Försök igen senare.");
    }
  };

  const handleViewResults = () => {
    router.push(`/quizzes/${quizId}/results`);
  };

  if (isLoading) {
    return <div className="text-center p-8">Laddar quiz...</div>;
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto my-8 p-6 card">
        <div className="bg-red-100 text-red-800 p-4 rounded mb-4">{error}</div>
        <button className="btn-primary" onClick={() => router.push("/quizzes")}>
          Tillbaka till alla quiz
        </button>
      </div>
    );
  }

  if (!quiz) {
    return <div>Quiz not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto my-8 p-6 card">
      <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
      {quiz.description && (
        <p className="text-gray-600 mb-6">{quiz.description}</p>
      )}

      {!isConnected && (
        <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-4">
          Ansluter till servern...
        </div>
      )}

      {quiz.status === QuizStatus.Created && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Starta quiz</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Quiz-kod: {quiz.pinCode}</h3>
              <p className="text-sm mb-4">
                Dela denna kod med deltagare så de kan ansluta till ditt quiz.
              </p>

              <button className="btn-primary w-full" onClick={handleStartQuiz}>
                Starta quiz
              </button>
            </div>

            {qrCode && (
              <div className="flex flex-col items-center">
                <h3 className="font-medium mb-2">QR-kod för att ansluta</h3>
                <img src={qrCode} alt="QR code" className="w-40 h-40" />
              </div>
            )}
          </div>
        </div>
      )}

      {quiz.status === QuizStatus.Active && (
        <>
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Deltagare ({participants.length})
              </h2>
              <button className="btn-secondary" onClick={handleEndQuiz}>
                Avsluta quiz
              </button>
            </div>

            <div className="bg-gray-100 rounded p-3 mb-4">
              <p className="font-medium">Anslutningskod: {quiz.pinCode}</p>
            </div>

            {participants.length === 0 ? (
              <p className="text-gray-500">Inga deltagare har anslutit än.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="bg-blue-50 px-3 py-2 rounded text-center"
                  >
                    {p.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Frågor</h2>

            {quiz.questions.length === 0 ? (
              <p className="text-gray-500">Detta quiz har inga frågor än.</p>
            ) : (
              <div className="space-y-4">
                {quiz.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className={`p-4 rounded-lg border ${
                      activeQuestion === question.id
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">
                          {index + 1}. {question.text}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {question.type === "SingleChoice"
                            ? "Ett rätt svar"
                            : question.type === "MultipleChoice"
                            ? "Flera rätta svar"
                            : "Fritext"}
                        </p>
                      </div>

                      <div>
                        {activeQuestion === question.id ? (
                          <button
                            className="btn-secondary text-sm"
                            onClick={handleEndQuestion}
                          >
                            Avsluta fråga
                          </button>
                        ) : (
                          <button
                            className="btn-primary text-sm"
                            onClick={() => handleStartQuestion(index)}
                            disabled={activeQuestion !== null}
                          >
                            Starta fråga
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      {quiz.status === QuizStatus.Completed && (
        <div>
          <div className="bg-green-100 text-green-800 p-4 rounded mb-6">
            <h2 className="text-xl font-semibold mb-2">Quiz avslutat!</h2>
            <p>
              Detta quiz avslutades{" "}
              <DateDisplay date={quiz.endedAt} formatString="PPP p" />.
            </p>
          </div>

          <button className="btn-primary" onClick={handleViewResults}>
            Visa resultat
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizHost;
