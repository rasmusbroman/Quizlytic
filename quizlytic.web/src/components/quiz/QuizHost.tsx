"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { useQuizHost, ConnectionState } from "@/lib/signalr-client";
import { quizApi } from "@/lib/api-client";
import { Quiz, Question, QuizStatus, Answer, QuizMode } from "@/lib/types";
import DateDisplay from "@/components/DateDisplay";
import {
  IoArrowBack,
  IoShareSocial,
  IoClipboard,
  IoRefresh,
} from "react-icons/io5";
import { useAuth } from "@/hooks/useAuth";
import ConnectionStatusIndicator from "@/components/common/ConnectionStatusIndicator";

interface QuizHostProps {
  quizId: number;
  isAdminView?: boolean;
}

const QuizHost: React.FC<QuizHostProps> = ({ quizId, isAdminView = false }) => {
  const router = useRouter();
  const { isAdmin } = useAuth();
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
  const [participantName, setParticipantName] = useState("");
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastHeartbeat, setLastHeartbeat] = useState<number>(Date.now());

  const {
    participants,
    activeQuestion,
    questionResponses,
    startQuestion,
    endQuestion,
    endQuiz,
    isConnected,
    connection,
    connectionStatus,
    connectionError,
    reconnect,
    joinStatus,
    retryJoin,
    initParticipants,
    refreshParticipantList,
  } = useQuizHost(quizId);

  useEffect(() => {
    if (connectionError) {
      setError(connectionError);
    }
  }, [connectionError]);

  useEffect(() => {
    if (!isConnected || !isAdminView) return;

    const heartbeatInterval = setInterval(() => {
      refreshParticipantList();
    }, 15000);

    return () => clearInterval(heartbeatInterval);
  }, [isConnected, isAdminView]);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const quizData = await quizApi.getById(quizId);
        setQuiz(quizData);

        if (quizData.participants) {
          initParticipants(quizData.participants);
        }

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
    if (isAdminView && isAdmin && quiz?.status === QuizStatus.Active) {
      console.log("Setting up participant auto-refresh");
      refreshParticipantList();
      const intervalId = setInterval(() => {
        console.log("Auto-refreshing participant list...");
        refreshParticipantList();
      }, 10000);

      return () => {
        console.log("Cleaning up auto-refresh");
        clearInterval(intervalId);
      };
    }
  }, [isAdminView, isAdmin, quiz?.status, refreshParticipantList]);

  const renderConnectionStatus = () => {
    if (connectionStatus === ConnectionState.Connected && !connectionError) {
      return null;
    }
    return (
      <div className="mb-4">
        <ConnectionStatusIndicator
          status={connectionStatus}
          error={connectionError}
          onReconnect={reconnect}
        />
      </div>
    );
  };

  const renderJoinRetry = () => {
    if (joinStatus === "failed") {
      return (
        <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-4">
          <p className="mb-2">
            Failed to join as host for this quiz. Please try reconnecting.
          </p>
          <button
            onClick={retryJoin}
            className="bg-blue-600 text-white py-1 px-3 rounded-md hover:bg-blue-700 transition"
          >
            Retry Join
          </button>
        </div>
      );
    }
    return null;
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshParticipantList();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    if (!isConnected || !quiz || !isAdminView || !isAdmin) return;

    const handleNewResponse = (questionId: number, participantId: number) => {
      console.log(
        `New response from participant ${participantId} for question ${questionId}`
      );
    };

    if (connection) {
      connection.on("NewResponse", handleNewResponse);
    }

    return () => {
      if (connection) {
        connection.off("NewResponse", handleNewResponse);
      }
    };
  }, [isConnected, quiz, isAdminView, isAdmin, connection]);

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

  const renderConnectionWarning = () => {
    if (
      connectionStatus === ConnectionState.Connecting ||
      connectionStatus === ConnectionState.Reconnecting
    ) {
      return (
        <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-4 flex items-center">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-yellow-800 mr-2"></div>
          <span>
            {connectionStatus === ConnectionState.Connecting
              ? "Connecting to server..."
              : "Reconnecting..."}
          </span>
        </div>
      );
    }
    return null;
  };

  const handleStartQuestion = (index: number) => {
    if (!quiz || !quiz.questions[index]) return;

    setCurrentQuestionIndex(index);
    startQuestion(quiz.questions[index].id);
  };

  const handleEndQuestion = () => {
    if (activeQuestion) {
      endQuestion(quizId, activeQuestion);
      setCurrentQuestionIndex(null);
    }
  };

  const handleEndQuiz = async () => {
    try {
      await endQuiz(quizId);
      const updatedQuiz = await quizApi.getById(quizId);
      setQuiz(updatedQuiz);
    } catch (err) {
      console.error("Error ending quiz:", err);
      setError("Could not end the quiz. Please try again later.");
    }
  };

  const handleJoinQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (quiz && participantName.trim()) {
      router.push(
        `/join?pin=${quiz.pinCode}&name=${encodeURIComponent(participantName)}`
      );
    }
  };

  const handleCopyJoinLink = () => {
    if (quiz) {
      const joinUrl = `${window.location.origin}/join?pin=${quiz.pinCode}`;
      navigator.clipboard.writeText(joinUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    }
  };

  const handleBackNavigation = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
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

  if (
    isAdminView &&
    isAdmin &&
    quiz.status === QuizStatus.Active &&
    quiz.mode === QuizMode.RealTime
  ) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {renderConnectionStatus()}
        {renderJoinRetry()}
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
          {!isConnected && (
            <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-4">
              {renderConnectionWarning()}
            </div>
          )}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-foreground">
                Participants ({participants.length})
              </h2>
              <button
                className="text-primary hover:text-primary-hover mr-4"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                title="Refresh participant list"
              >
                <IoRefresh
                  className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </button>
              <button
                className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition"
                onClick={handleEndQuiz}
              >
                End Quiz
              </button>
            </div>
            <div className="bg-accent rounded-md p-3 mb-4 border border-border">
              <p className="font-medium text-foreground">
                Connection code: {quiz.pinCode}
              </p>
              <button
                onClick={handleCopyJoinLink}
                className="flex items-center text-primary hover:text-primary-hover transition mt-2"
              >
                <IoClipboard className="h-5 w-5 mr-1" />
                {linkCopied ? "Copied!" : "Copy Join Link"}
              </button>
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
                {quiz.questions.map((question, index) => (
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
                          <div className="space-y-1">
                            {question.answers.map((answer) => (
                              <div key={answer.id} className="relative">
                                <div className="flex justify-between mb-1">
                                  <span
                                    className={`${
                                      answer.isCorrect && quiz.hasCorrectAnswers
                                        ? "font-semibold text-green-700"
                                        : ""
                                    }`}
                                  >
                                    {answer.text}
                                  </span>
                                  <span>
                                    {getAnswerCount(
                                      questionResults[question.id] || [],
                                      answer.id
                                    )}{" "}
                                    responses
                                  </span>
                                </div>
                                <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      answer.isCorrect && quiz.hasCorrectAnswers
                                        ? "bg-green-500"
                                        : "bg-blue-500"
                                    }`}
                                    style={{
                                      width: `${getAnswerPercentage(
                                        questionResults[question.id] || [],
                                        answer.id
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (quiz.status === QuizStatus.Created) {
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
          <div className="mb-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2 text-foreground">
                  Quiz information
                </h3>
                <p className="text-sm text-text-secondary mb-2">
                  This quiz has {quiz.questions.length} questions.
                </p>
                <p className="text-sm text-text-secondary mb-4">
                  Status: <span className="font-medium">Not started yet</span>
                </p>
                {isAdminView && isAdmin && quiz.mode === QuizMode.RealTime && (
                  <button
                    className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-primary-hover transition"
                    onClick={handleStartQuiz}
                  >
                    Start Quiz
                  </button>
                )}
              </div>
              {qrCode && (
                <div className="flex flex-col items-center">
                  <h3 className="font-medium mb-2 text-foreground">
                    QR code to join
                  </h3>
                  <div className="border border-border p-2 rounded-md bg-white">
                    <img src={qrCode} alt="QR code" className="w-40 h-40" />
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">
                    Join code: {quiz.pinCode}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (quiz.status === QuizStatus.Active && quiz.mode === QuizMode.RealTime) {
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
          <div className="bg-accent rounded-md p-4 mb-6">
            <h2 className="text-lg font-semibold mb-3">
              This quiz is currently active!
            </h2>
            <p className="mb-3">
              This quiz has {quiz.questions.length} questions and is currently
              in progress.
            </p>
            {showJoinForm ? (
              <form onSubmit={handleJoinQuiz} className="mt-4">
                <div className="mb-4">
                  <label className="block text-foreground mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    className="w-full border border-border rounded-md px-3 py-2"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    required={!quiz.allowAnonymous}
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-hover transition"
                  >
                    Join Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowJoinForm(false)}
                    className="bg-secondary text-white py-2 px-4 rounded-md hover:bg-secondary-hover transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowJoinForm(true)}
                className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-hover transition"
              >
                Join This Quiz
              </button>
            )}
          </div>
          {qrCode && (
            <div className="flex flex-col items-center bg-white p-6 rounded-md border border-border">
              <h3 className="font-medium mb-3 text-foreground">Scan to join</h3>
              <div className="border border-border p-2 rounded-md bg-white">
                <img src={qrCode} alt="QR code" className="w-40 h-40" />
              </div>
              <p className="mt-3 text-foreground">
                PIN Code: <span className="font-bold">{quiz.pinCode}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (quiz.mode === QuizMode.SelfPaced) {
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
          <div className="bg-blue-50 text-blue-800 p-4 rounded-md mb-6">
            <h2 className="text-lg font-semibold mb-2">Self-paced Survey</h2>
            <p className="mb-3">
              This is a self-paced survey with {quiz.questions.length}{" "}
              questions.
              {quiz.status === QuizStatus.Active
                ? " It is currently active and accepting responses."
                : quiz.status === QuizStatus.Completed
                ? " This survey has been completed."
                : " This survey has not started yet."}
            </p>
            {quiz.status === QuizStatus.Active && (
              <>
                {showJoinForm ? (
                  <form onSubmit={handleJoinQuiz} className="mt-4">
                    <div className="mb-4">
                      <label className="block text-foreground mb-1">
                        Your Name {!quiz.allowAnonymous && "(Required)"}
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your name"
                        className="w-full border border-border rounded-md px-3 py-2"
                        value={participantName}
                        onChange={(e) => setParticipantName(e.target.value)}
                        required={!quiz.allowAnonymous}
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-hover transition"
                      >
                        Take Survey Now
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowJoinForm(false)}
                        className="bg-secondary text-white py-2 px-4 rounded-md hover:bg-secondary-hover transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowJoinForm(true)}
                    className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-hover transition"
                  >
                    Take This Survey
                  </button>
                )}
              </>
            )}
            {isAdminView && isAdmin && quiz.status === QuizStatus.Active && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="mb-2">Admin Options:</p>
                <button
                  className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition"
                  onClick={handleEndQuiz}
                >
                  End Survey
                </button>
              </div>
            )}
          </div>
          {qrCode && quiz.status === QuizStatus.Active && (
            <div className="flex flex-col items-center bg-white p-6 rounded-md border border-border">
              <h3 className="font-medium mb-3 text-foreground">
                Scan to take the survey
              </h3>
              <div className="border border-border p-2 rounded-md bg-white">
                <img src={qrCode} alt="QR code" className="w-40 h-40" />
              </div>
              <p className="mt-3 text-foreground">
                PIN Code: <span className="font-bold">{quiz.pinCode}</span>
              </p>
            </div>
          )}
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

        <div className="bg-green-100 text-green-800 p-4 rounded-md mb-6">
          <h2 className="text-xl font-semibold mb-2">Quiz completed!</h2>
          <p>
            This quiz was completed on{" "}
            <DateDisplay date={quiz.endedAt} formatString="PPP p" />.
          </p>
        </div>

        <button
          className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-hover transition"
          onClick={() => router.push(`/quiz/${quiz.publicId}/results`)}
        >
          View Results
        </button>
      </div>
    </div>
  );
};

export default QuizHost;
