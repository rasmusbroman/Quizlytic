import * as signalR from "@microsoft/signalr";
import { useState, useEffect, useRef, useCallback } from "react";

let connection: signalR.HubConnection | null = null;

export const getConnection = (): signalR.HubConnection => {
  if (!connection) {
    connection = new signalR.HubConnectionBuilder()
      .withUrl(
        `${
          process.env.NEXT_PUBLIC_API_URL || "https://localhost:7066"
        }/quizHub`,
        {
          withCredentials: true,
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets,
        }
      )
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();
  }

  return connection;
};

export const useSignalR = () => {
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef(getConnection());

  useEffect(() => {
    if (
      connectionRef.current.state === signalR.HubConnectionState.Disconnected
    ) {
      connectionRef.current
        .start()
        .then(() => {
          console.log("SignalR connected.");
          setIsConnected(true);
        })
        .catch((err) => console.error("SignalR connection error:", err));
    }

    connectionRef.current.onclose(() => {
      console.log("SignalR disconnected.");
      setIsConnected(false);
    });

    connectionRef.current.onreconnecting(() => {
      console.log("SignalR reconnecting...");
      setIsConnected(false);
    });

    connectionRef.current.onreconnected(() => {
      console.log("SignalR reconnected.");
      setIsConnected(true);
    });

    return () => {};
  }, []);

  const joinAsHost = useCallback(
    async (quizId: number) => {
      if (isConnected) {
        await connectionRef.current.invoke("JoinAsHost", quizId.toString());
      }
    },
    [isConnected]
  );

  const joinAsParticipant = useCallback(
    async (pinCode: string, participantName: string) => {
      if (isConnected) {
        await connectionRef.current.invoke(
          "JoinAsParticipant",
          pinCode,
          participantName
        );
      }
    },
    [isConnected]
  );

  const startQuestion = useCallback(
    async (quizId: number, questionId: number) => {
      if (isConnected) {
        await connectionRef.current.invoke("StartQuestion", quizId, questionId);
      }
    },
    [isConnected]
  );

  const endQuestion = useCallback(
    async (quizId: number, questionId: number) => {
      if (isConnected) {
        await connectionRef.current.invoke("EndQuestion", quizId, questionId);
      }
    },
    [isConnected]
  );

  const endQuiz = useCallback(
    async (quizId: number) => {
      if (isConnected) {
        await connectionRef.current.invoke("EndQuiz", quizId);
      }
    },
    [isConnected]
  );

  const submitAnswer = useCallback(
    async (
      questionId: number,
      answerId: number | null,
      freeTextAnswer?: string
    ) => {
      if (isConnected) {
        await connectionRef.current.invoke(
          "SubmitAnswer",
          questionId,
          answerId,
          freeTextAnswer || null
        );
      }
    },
    [isConnected]
  );

  const onEvent = useCallback(
    (eventName: string, callback: (...args: any[]) => void) => {
      connectionRef.current.on(eventName, callback);

      return () => {
        connectionRef.current.off(eventName, callback);
      };
    },
    []
  );

  return {
    connection: connectionRef.current,
    isConnected,
    joinAsHost,
    joinAsParticipant,
    startQuestion,
    endQuestion,
    endQuiz,
    submitAnswer,
    onEvent,
  };
};

export const useQuizHost = (quizId: number) => {
  const {
    isConnected,
    joinAsHost,
    startQuestion,
    endQuestion,
    endQuiz,
    onEvent,
  } = useSignalR();
  const [participants, setParticipants] = useState<
    { id: number; name: string }[]
  >([]);
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);

  useEffect(() => {
    if (isConnected && quizId) {
      joinAsHost(quizId);
    }
  }, [isConnected, quizId, joinAsHost]);

  useEffect(() => {
    if (!isConnected) return;

    const removeParticipantJoined = onEvent(
      "ParticipantJoined",
      (id: number, name: string) => {
        setParticipants((prev) => [...prev, { id, name }]);
      }
    );

    const removeParticipantLeft = onEvent("ParticipantLeft", (id: number) => {
      setParticipants((prev) => prev.filter((p) => p.id !== id));
    });

    const removeNewResponse = onEvent(
      "NewResponse",
      (questionId: number, participantId: number) => {
        console.log(
          `New response from participant ${participantId} for question ${questionId}`
        );
      }
    );

    return () => {
      removeParticipantJoined();
      removeParticipantLeft();
      removeNewResponse();
    };
  }, [isConnected, onEvent]);

  const handleStartQuestion = async (questionId: number) => {
    await startQuestion(quizId, questionId);
    setActiveQuestion(questionId);
  };

  const handleEndQuestion = async () => {
    if (activeQuestion) {
      await endQuestion(quizId, activeQuestion);
      setActiveQuestion(null);
    }
  };

  const handleEndQuiz = async () => {
    await endQuiz(quizId);
  };

  return {
    participants,
    activeQuestion,
    startQuestion: handleStartQuestion,
    endQuestion: handleEndQuestion,
    endQuiz: handleEndQuiz,
    isConnected,
  };
};

export const useQuizParticipant = () => {
  const { isConnected, joinAsParticipant, submitAnswer, onEvent } =
    useSignalR();
  const [quizInfo, setQuizInfo] = useState<{
    title: string;
    mode: string;
  } | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<{
    id: number;
    text: string;
    imageUrl?: string;
    type: string;
    answers: { id: number; text: string }[];
  } | null>(null);
  const [surveyQuestions, setSurveyQuestions] = useState<any[]>([]);
  const [currentSurveyQuestionIndex, setCurrentSurveyQuestionIndex] =
    useState(0);
  const [surveyResponses, setSurveyResponses] = useState<
    Map<number, { answerId?: number; freeText?: string }>
  >(new Map());
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) return;

    const removeQuizInfo = onEvent(
      "QuizInfo",
      (title: string, mode: string) => {
        setQuizInfo({ title, mode });
        setError(null);
      }
    );

    const removeJoinError = onEvent("JoinError", (errorMessage: string) => {
      setError(errorMessage);
    });

    const removeQuestionStarted = onEvent(
      "QuestionStarted",
      (
        id: number,
        text: string,
        imageUrl: string,
        type: string,
        answers: any[]
      ) => {
        setCurrentQuestion({ id, text, imageUrl, type, answers });
        setResults(null);
      }
    );

    const removeQuestionEnded = onEvent(
      "QuestionEnded",
      (questionId: number, results: any) => {
        setResults(results);
      }
    );

    const removeQuizEnded = onEvent("QuizEnded", () => {
      setQuizInfo(null);
      setCurrentQuestion(null);
      setResults(null);
    });

    const removeSurveyQuestions = onEvent(
      "SurveyQuestions",
      (questions: any[]) => {
        setSurveyQuestions(questions);
        if (questions.length > 0) {
          setCurrentSurveyQuestionIndex(0);
        }
      }
    );

    const removeResponseSaved = onEvent(
      "ResponseSaved",
      (questionId: number) => {
        if (surveyQuestions.length > currentSurveyQuestionIndex + 1) {
          setCurrentSurveyQuestionIndex((prev) => prev + 1);
        } else {
          setResults({ surveyCompleted: true });
        }
      }
    );

    return () => {
      removeQuizInfo();
      removeJoinError();
      removeQuestionStarted();
      removeQuestionEnded();
      removeQuizEnded();
      removeSurveyQuestions();
      removeResponseSaved();
    };
  }, [isConnected, onEvent, surveyQuestions, currentSurveyQuestionIndex]);

  const joinQuiz = async (pinCode: string, name: string) => {
    try {
      await joinAsParticipant(pinCode, name);
    } catch (err) {
      console.error("Error joining quiz:", err);
      setError("Failed to join quiz. Please try again.");
    }
  };

  const handleSubmitAnswer = async (
    answerId: number | null,
    freeTextAnswer?: string
  ) => {
    if (currentQuestion) {
      await submitAnswer(currentQuestion.id, answerId, freeTextAnswer);
    } else if (surveyQuestions.length > 0) {
      const currentSurveyQuestion = surveyQuestions[currentSurveyQuestionIndex];
      if (currentSurveyQuestion) {
        setSurveyResponses((prev) => {
          const newMap = new Map(prev);
          newMap.set(currentSurveyQuestion.id, {
            answerId: answerId || undefined,
            freeText: freeTextAnswer,
          });
          return newMap;
        });

        await submitAnswer(currentSurveyQuestion.id, answerId, freeTextAnswer);
      }
    }
  };

  const nextSurveyQuestion = () => {
    if (surveyQuestions.length > currentSurveyQuestionIndex + 1) {
      setCurrentSurveyQuestionIndex((prev) => prev + 1);
    }
  };

  const previousSurveyQuestion = () => {
    if (currentSurveyQuestionIndex > 0) {
      setCurrentSurveyQuestionIndex((prev) => prev - 1);
    }
  };

  const getCurrentSurveyQuestion = () => {
    if (surveyQuestions.length > 0) {
      return surveyQuestions[currentSurveyQuestionIndex];
    }
    return null;
  };

  return {
    quizInfo,
    currentQuestion,
    results,
    error,
    isConnected,
    joinQuiz,
    submitAnswer: handleSubmitAnswer,
    isSurveyMode: quizInfo?.mode === "SelfPaced",
    surveyQuestions,
    currentSurveyQuestion: getCurrentSurveyQuestion(),
    currentSurveyQuestionIndex,
    nextSurveyQuestion,
    previousSurveyQuestion,
    surveyResponses,
  };
};
