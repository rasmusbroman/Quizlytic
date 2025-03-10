import React, { useState } from "react";
import { useQuizParticipant } from "@/lib/signalr-client";

interface QuizParticipantProps {
  initialPinCode?: string;
}

const QuizParticipant: React.FC<QuizParticipantProps> = ({
  initialPinCode = "",
}) => {
  const [pinCode, setPinCode] = useState(initialPinCode);
  const [participantName, setParticipantName] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [freeTextAnswer, setFreeTextAnswer] = useState("");
  const [hasAnswered, setHasAnswered] = useState(false);

  const {
    quizInfo,
    currentQuestion,
    results,
    error,
    isConnected,
    joinQuiz,
    submitAnswer,
  } = useQuizParticipant();

  const handleJoinQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinCode.trim() || !participantName.trim()) return;

    await joinQuiz(pinCode, participantName);
  };

  const handleSingleChoiceAnswer = async () => {
    if (selectedAnswer === null || !currentQuestion) return;

    await submitAnswer(selectedAnswer, undefined);
    setHasAnswered(true);
  };

  const handleMultipleChoiceAnswer = async () => {
    if (selectedAnswers.length === 0 || !currentQuestion) return;

    await submitAnswer(selectedAnswers[0], undefined);
    setHasAnswered(true);
  };

  const handleFreeTextAnswer = async () => {
    if (!freeTextAnswer.trim() || !currentQuestion) return;

    await submitAnswer(null, freeTextAnswer);
    setHasAnswered(true);
  };

  const handleCheckboxChange = (answerId: number) => {
    setSelectedAnswers((prev) =>
      prev.includes(answerId)
        ? prev.filter((id) => id !== answerId)
        : [...prev, answerId]
    );
  };

  if (!quizInfo) {
    return (
      <div className="max-w-md mx-auto my-8 p-6 card">
        <h1 className="text-2xl font-bold mb-6">Anslut till ett quiz</h1>

        {error && (
          <div className="bg-red-100 text-red-800 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {!isConnected && (
          <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-4">
            Ansluter till servern...
          </div>
        )}

        <form onSubmit={handleJoinQuiz}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Quiz-kod</label>
            <input
              type="text"
              className="input"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              placeholder="Ange 6-siffrig kod"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-1">Ditt namn</label>
            <input
              type="text"
              className="input"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder="Ange ditt namn"
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={
              !isConnected || !pinCode.trim() || !participantName.trim()
            }
          >
            Anslut
          </button>
        </form>
      </div>
    );
  }

  if (currentQuestion && !results) {
    return (
      <div className="max-w-xl mx-auto my-8 p-6 card">
        <div className="mb-6">
          <h1 className="text-xl font-bold mb-1">{quizInfo.title}</h1>
          <p className="text-gray-600">Ansluten som {participantName}</p>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">{currentQuestion.text}</h2>

          {currentQuestion.imageUrl && (
            <div className="mb-4">
              <img
                src={currentQuestion.imageUrl}
                alt="Question illustration"
                className="max-w-full rounded"
              />
            </div>
          )}
        </div>

        {hasAnswered ? (
          <div className="bg-green-100 text-green-800 p-4 rounded">
            <p className="font-medium">Ditt svar har skickats!</p>
            <p>Vänta på att värden går vidare till nästa fråga.</p>
          </div>
        ) : (
          <div>
            {currentQuestion.type === "SingleChoice" && (
              <div className="mb-6 space-y-3">
                {currentQuestion.answers.map((answer) => (
                  <div
                    key={answer.id}
                    className={`p-4 rounded-lg border cursor-pointer ${
                      selectedAnswer === answer.id
                        ? "bg-blue-100 border-blue-500"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedAnswer(answer.id)}
                  >
                    {answer.text}
                  </div>
                ))}

                <button
                  className="btn-primary w-full mt-4"
                  onClick={handleSingleChoiceAnswer}
                  disabled={selectedAnswer === null}
                >
                  Skicka svar
                </button>
              </div>
            )}

            {currentQuestion.type === "MultipleChoice" && (
              <div className="mb-6 space-y-3">
                {currentQuestion.answers.map((answer) => (
                  <div
                    key={answer.id}
                    className="flex items-center p-4 rounded-lg border hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      id={`answer-${answer.id}`}
                      checked={selectedAnswers.includes(answer.id)}
                      onChange={() => handleCheckboxChange(answer.id)}
                      className="mr-3"
                    />
                    <label
                      htmlFor={`answer-${answer.id}`}
                      className="cursor-pointer flex-grow"
                    >
                      {answer.text}
                    </label>
                  </div>
                ))}

                <button
                  className="btn-primary w-full mt-4"
                  onClick={handleMultipleChoiceAnswer}
                  disabled={selectedAnswers.length === 0}
                >
                  Skicka svar
                </button>
              </div>
            )}

            {currentQuestion.type === "FreeText" && (
              <div className="mb-6">
                <textarea
                  className="input mb-4"
                  rows={4}
                  value={freeTextAnswer}
                  onChange={(e) => setFreeTextAnswer(e.target.value)}
                  placeholder="Skriv ditt svar här..."
                />

                <button
                  className="btn-primary w-full"
                  onClick={handleFreeTextAnswer}
                  disabled={!freeTextAnswer.trim()}
                >
                  Skicka svar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (results) {
    return (
      <div className="max-w-xl mx-auto my-8 p-6 card">
        <div className="mb-6">
          <h1 className="text-xl font-bold mb-1">{quizInfo.title}</h1>
          <p className="text-gray-600">Ansluten som {participantName}</p>
        </div>

        <div className="bg-blue-100 p-4 rounded mb-6">
          <h2 className="text-lg font-semibold mb-2">Resultat</h2>
          <p>Väntar på nästa fråga...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto my-8 p-6 card">
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1">{quizInfo.title}</h1>
        <p className="text-gray-600">Ansluten som {participantName}</p>
      </div>

      <div className="text-center p-8">
        <h2 className="text-xl font-semibold mb-2">
          Väntar på att quizet ska starta...
        </h2>
        <p className="text-gray-600">
          Värden kommer snart att starta en fråga.
        </p>
      </div>
    </div>
  );
};

export default QuizParticipant;
