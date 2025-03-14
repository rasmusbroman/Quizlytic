import React, { useState, useEffect } from "react";
import { useQuizParticipant, ConnectionState } from "@/lib/signalr-client";
import { quizApi } from "@/lib/api-client";
import ConnectionStatusIndicator from "@/components/common/ConnectionStatusIndicator";

interface QuizParticipantProps {
  initialPinCode?: string;
  initialParticipantName?: string;
}

const QuizParticipant: React.FC<QuizParticipantProps> = ({
  initialPinCode = "",
  initialParticipantName = "",
}) => {
  const [pinCode, setPinCode] = useState(initialPinCode);
  const [participantName, setParticipantName] = useState(
    initialParticipantName
  );
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [freeTextAnswer, setFreeTextAnswer] = useState("");
  const [surveyCompleted, setSurveyCompleted] = useState(false);

  const {
    quizInfo,
    currentQuestion,
    results,
    error,
    isConnected,
    connectionStatus,
    joinStatus,
    joinQuiz,
    submitAnswer,
    reconnect,
    isSurveyMode,
    currentSurveyQuestion,
    currentSurveyQuestionIndex,
    surveyQuestions,
    nextSurveyQuestion,
    previousSurveyQuestion,
    surveyResponses,
    hasAnswered,
    setHasAnswered,
    submitMultipleAnswers,
  } = useQuizParticipant();

  const [isUsingApi, setIsUsingApi] = useState(false);
  const [apiSurveyQuestions, setApiSurveyQuestions] = useState<any[]>([]);
  const [apiCurrentQuestionIndex, setApiCurrentQuestionIndex] = useState(0);
  const [apiResponses, setApiResponses] = useState<
    Map<number, { answerId?: number; freeText?: string }>
  >(new Map());
  const [apiLoading, setApiLoading] = useState(false);

  useEffect(() => {
    if (initialPinCode && initialParticipantName && joinStatus === "idle") {
      const timer = setTimeout(() => {
        joinQuiz(initialPinCode, initialParticipantName);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [initialPinCode, initialParticipantName, joinStatus, joinQuiz]);

  useEffect(() => {
    if (currentQuestion) {
      setHasAnswered(false);
      setSelectedAnswer(null);
      setSelectedAnswers([]);
      setFreeTextAnswer("");
    }
  }, [currentQuestion?.id]);

  const renderConnectionStatus = () => {
    if (connectionStatus === ConnectionState.Connected && !error) {
      return null;
    }

    return (
      <div className="mb-4">
        <ConnectionStatusIndicator
          status={connectionStatus}
          error={error}
          onReconnect={reconnect}
        />
      </div>
    );
  };

  useEffect(() => {
    if (currentQuestion) {
      setHasAnswered(false);
      setSelectedAnswer(null);
      setSelectedAnswers([]);
      setFreeTextAnswer("");
    }
  }, [currentQuestion?.id]);

  const handleJoinQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinCode.trim()) return;

    if (!participantName.trim() && !isSurveyMode) {
      setError("Please enter your name");
      return;
    }

    setApiLoading(true);

    try {
      await joinQuiz(pinCode, participantName);
      setIsUsingApi(false);
    } catch (err) {
      console.error("SignalR connection failed, falling back to API:", err);

      try {
        const surveyData = await quizApi.getSurveyQuestions(pinCode);
        setApiSurveyQuestions(surveyData.questions);
        setIsUsingApi(true);
        setQuizInfo({
          title: surveyData.quizTitle,
          mode: "SelfPaced",
        });
      } catch (apiError) {
        console.error("API fallback also failed:", apiError);
        setError("Could not connect to the quiz. Please try again later.");
      }
    } finally {
      setApiLoading(false);
    }
  };

  const handleSingleChoiceAnswer = async () => {
    if (selectedAnswer === null) return;

    if (isUsingApi) {
      const currentQuestion = apiSurveyQuestions[apiCurrentQuestionIndex];
      setApiResponses((prev) => {
        const newMap = new Map(prev);
        newMap.set(currentQuestion.id, { answerId: selectedAnswer });
        return newMap;
      });

      if (apiCurrentQuestionIndex < apiSurveyQuestions.length - 1) {
        setApiCurrentQuestionIndex((prev) => prev + 1);
        setSelectedAnswer(null);
      } else {
        await submitApiSurvey();
      }
    } else {
      await submitAnswer(selectedAnswer, "");
      setHasAnswered(true);
    }
  };

  const handleMultipleChoiceAnswer = async () => {
    if (selectedAnswers.length === 0) return;

    if (isUsingApi) {
      const currentQuestion = apiSurveyQuestions[apiCurrentQuestionIndex];
      setApiResponses((prev) => {
        const newMap = new Map(prev);
        newMap.set(currentQuestion.id, { answerIds: [...selectedAnswers] });
        return newMap;
      });

      if (apiCurrentQuestionIndex < apiSurveyQuestions.length - 1) {
        setApiCurrentQuestionIndex((prev) => prev + 1);
        setSelectedAnswers([]);
      } else {
        await submitApiSurvey();
      }
    } else {
      try {
        for (const answerId of selectedAnswers) {
          await submitAnswer(answerId, "");
        }
        setHasAnswered(true);
      } catch (error) {
        console.error("Error submitting multiple choices:", error);
      }
    }
  };

  const handleFreeTextAnswer = async () => {
    if (!freeTextAnswer.trim()) return;

    if (isUsingApi) {
      const currentQuestion = apiSurveyQuestions[apiCurrentQuestionIndex];
      setApiResponses((prev) => {
        const newMap = new Map(prev);
        newMap.set(currentQuestion.id, { freeText: freeTextAnswer });
        return newMap;
      });

      if (apiCurrentQuestionIndex < apiSurveyQuestions.length - 1) {
        setApiCurrentQuestionIndex((prev) => prev + 1);
        setFreeTextAnswer("");
      } else {
        await submitApiSurvey();
      }
    } else {
      await submitAnswer(null, freeTextAnswer);
      setHasAnswered(true);
    }
  };

  const submitApiSurvey = async () => {
    setApiLoading(true);
    try {
      const answers = Array.from(apiResponses.entries()).flatMap(
        ([questionId, response]) => {
          if (response.answerIds && response.answerIds.length > 0) {
            return response.answerIds.map((answerId) => ({
              questionId,
              answerId,
              freeTextResponse: "",
            }));
          } else {
            return [
              {
                questionId,
                answerId: response.answerId,
                freeTextResponse: response.freeText || "",
              },
            ];
          }
        }
      );

      await quizApi.submitSurveyResponses(pinCode, {
        participantName,
        answers,
      });

      setSurveyCompleted(true);
    } catch (err) {
      console.error("Error submitting survey:", err);
      setError("Failed to submit survey. Please try again.");
    } finally {
      setApiLoading(false);
    }
  };

  const handleCheckboxChange = (answerId: number) => {
    setSelectedAnswers((prev) =>
      prev.includes(answerId)
        ? prev.filter((id) => id !== answerId)
        : [...prev, answerId]
    );
  };

  if (!quizInfo && !isUsingApi) {
    if (initialPinCode && initialParticipantName && joinStatus === "pending") {
      return (
        <div className="max-w-md mx-auto my-8 p-6 card">
          <div className="text-center p-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mb-2"></div>
            <p>Joining quiz...</p>
          </div>
        </div>
      );
    }
    if (!initialPinCode || !initialParticipantName || joinStatus === "failed") {
      return (
        <div className="max-w-md mx-auto my-8 p-6 card">
          <h1 className="text-2xl font-bold mb-6">Join a Quiz</h1>

          {renderConnectionStatus()}

          {joinStatus === "pending" ? (
            <div className="text-center p-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mb-2"></div>
              <p>Joining quiz...</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                joinQuiz(pinCode, participantName);
              }}
            >
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Quiz Code</label>
                <input
                  type="text"
                  className="input"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 mb-1">Your Name</label>
                <input
                  type="text"
                  className="input"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={
                  joinStatus === "pending" ||
                  connectionStatus === ConnectionState.Connecting
                }
              >
                {connectionStatus !== ConnectionState.Connected
                  ? "Connect & Join Quiz"
                  : "Join Quiz"}
              </button>
            </form>
          )}
        </div>
      );
    }
    return (
      <div className="max-w-md mx-auto my-8 p-6 card">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mb-2"></div>
          <p>Initializing connection...</p>
        </div>
      </div>
    );
  }

  if (surveyCompleted || (results && results.surveyCompleted)) {
    return (
      <div className="max-w-xl mx-auto my-8 p-6 card">
        <div className="mb-6">
          <h1 className="text-xl font-bold mb-1">{quizInfo?.title}</h1>
          <p className="text-gray-600">Thank you for your participation!</p>
        </div>

        <div className="bg-green-100 p-4 rounded mb-6">
          <h2 className="text-lg font-semibold mb-2">Survey Completed</h2>
          <p>Your responses have been successfully submitted.</p>
        </div>
      </div>
    );
  }

  if (!isSurveyMode && !isUsingApi) {
    if (currentQuestion && !results) {
      return (
        <div className="max-w-xl mx-auto my-8 p-6 card">
          <div className="mb-6">
            <h1 className="text-xl font-bold mb-1">{quizInfo.title}</h1>
            <p className="text-gray-600">Connected as {participantName}</p>
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
              <p className="font-medium">Your answer has been submitted!</p>
              <p>Waiting for the host to proceed to the next step...</p>
            </div>
          ) : (
            <div>
              {currentQuestion.type === 0 && (
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
                    Submit Answer
                  </button>
                </div>
              )}
              {currentQuestion.type === 1 && (
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
                    Submit Answer
                  </button>
                </div>
              )}
              {currentQuestion.type === 2 && (
                <div className="mb-6">
                  <textarea
                    className="input mb-4"
                    rows={4}
                    value={freeTextAnswer}
                    onChange={(e) => setFreeTextAnswer(e.target.value)}
                    placeholder="Write your answer here..."
                  />

                  <button
                    className="btn-primary w-full"
                    onClick={handleFreeTextAnswer}
                    disabled={!freeTextAnswer.trim()}
                  >
                    Submit Answer
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
            <p className="text-gray-600">Connected as {participantName}</p>
          </div>
          <div className="bg-blue-100 p-4 rounded mb-6">
            <h2 className="text-lg font-semibold mb-2">Results</h2>
            <p>
              The host has closed this question. Waiting for the next
              question...
            </p>
            {results.results && results.results.length > 0 && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <h3 className="text-md font-medium mb-2">
                  Answer Distribution:
                </h3>
                <div className="space-y-2">
                  {results.results.map((result: any, index: number) => {
                    const answerText =
                      currentQuestion?.answers.find(
                        (a) => a.id === result.answerId
                      )?.text || `Option ${index + 1}`;
                    return (
                      <div
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <span>
                          {result.answerId ? answerText : "No answer"}
                        </span>
                        <span className="font-medium">
                          {result.count} responses
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-xl mx-auto my-8 p-6 card">
        <div className="mb-6">
          <h1 className="text-xl font-bold mb-1">{quizInfo?.title}</h1>
          <p className="text-gray-600">Connected as {participantName}</p>
        </div>

        <div className="text-center p-8">
          <h2 className="text-xl font-semibold mb-2">
            Waiting for the quiz to start...
          </h2>
          <p className="text-gray-600">The host will start the quiz soon.</p>
        </div>
      </div>
    );
  }
  const activeSurveyQuestions = isUsingApi
    ? apiSurveyQuestions
    : surveyQuestions;
  const currentIndex = isUsingApi
    ? apiCurrentQuestionIndex
    : currentSurveyQuestionIndex;
  const activeQuestion = isUsingApi
    ? apiSurveyQuestions[apiCurrentQuestionIndex]
    : currentSurveyQuestion;

  if (activeSurveyQuestions.length > 0 && activeQuestion) {
    return (
      <div className="max-w-xl mx-auto my-8 p-6 card">
        <div className="mb-6">
          <h1 className="text-xl font-bold mb-1">{quizInfo?.title}</h1>
          <p className="text-gray-600">
            {participantName
              ? `Participant: ${participantName}`
              : "Anonymous participant"}
          </p>
          <div className="mt-2 text-sm text-gray-500">
            Question {currentIndex + 1} of {activeSurveyQuestions.length}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">{activeQuestion.text}</h2>

          {activeQuestion.imageUrl && (
            <div className="mb-4">
              <img
                src={activeQuestion.imageUrl}
                alt="Question illustration"
                className="max-w-full rounded"
              />
            </div>
          )}
        </div>
        <div className="mb-6">
          {activeQuestion.type === 0 && (
            <div className="space-y-3">
              {activeQuestion.answers.map((answer) => (
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

              <div className="flex justify-between mt-4">
                <button
                  className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition"
                  onClick={() =>
                    isUsingApi
                      ? setApiCurrentQuestionIndex(
                          Math.max(0, apiCurrentQuestionIndex - 1)
                        )
                      : previousSurveyQuestion()
                  }
                  disabled={currentIndex === 0}
                >
                  Previous
                </button>
                <button
                  className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-hover transition"
                  onClick={handleSingleChoiceAnswer}
                  disabled={selectedAnswer === null}
                >
                  {currentIndex === activeSurveyQuestions.length - 1
                    ? "Submit"
                    : "Next"}
                </button>
              </div>
            </div>
          )}

          {activeQuestion.type === 1 && (
            <div className="space-y-3">
              {activeQuestion.answers.map((answer) => (
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

              <div className="flex justify-between mt-4">
                <button
                  className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition"
                  onClick={() =>
                    isUsingApi
                      ? setApiCurrentQuestionIndex(
                          Math.max(0, apiCurrentQuestionIndex - 1)
                        )
                      : previousSurveyQuestion()
                  }
                  disabled={currentIndex === 0}
                >
                  Previous
                </button>
                <button
                  className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-hover transition"
                  onClick={handleMultipleChoiceAnswer}
                  disabled={selectedAnswers.length === 0}
                >
                  {currentIndex === activeSurveyQuestions.length - 1
                    ? "Submit"
                    : "Next"}
                </button>
              </div>
            </div>
          )}

          {activeQuestion.type === 2 && (
            <div>
              <textarea
                className="w-full border border-gray-300 rounded-md px-4 py-3 mb-4"
                rows={4}
                value={freeTextAnswer}
                onChange={(e) => setFreeTextAnswer(e.target.value)}
                placeholder="Enter your answer here..."
              />

              <div className="flex justify-between">
                <button
                  className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition"
                  onClick={() =>
                    isUsingApi
                      ? setApiCurrentQuestionIndex(
                          Math.max(0, apiCurrentQuestionIndex - 1)
                        )
                      : previousSurveyQuestion()
                  }
                  disabled={currentIndex === 0}
                >
                  Previous
                </button>
                <button
                  className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-hover transition"
                  onClick={handleFreeTextAnswer}
                  disabled={!freeTextAnswer.trim()}
                >
                  {currentIndex === activeSurveyQuestions.length - 1
                    ? "Submit"
                    : "Next"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto my-8 p-6 card">
      <div className="text-center p-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-2 text-text-secondary">Loading quiz content...</p>
      </div>
    </div>
  );
};

export default QuizParticipant;
