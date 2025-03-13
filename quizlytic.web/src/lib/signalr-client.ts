import * as signalR from "@microsoft/signalr";
import { useState, useEffect, useRef, useCallback } from "react";
import { quizApi } from "@/lib/api-client";

export enum ConnectionState {
  Disconnected = "Disconnected",
  Connecting = "Connecting",
  Connected = "Connected",
  Reconnecting = "Reconnecting",
  ConnectionFailed = "ConnectionFailed",
  ConnectionTimedOut = "ConnectionTimedOut",
}

let connection: signalR.HubConnection | null = null;
let connectionState: ConnectionState = ConnectionState.Disconnected;
let connectionObservers: ((state: ConnectionState) => void)[] = [];

const notifyConnectionStateChanged = (state: ConnectionState) => {
  connectionState = state;
  connectionObservers.forEach((observer) => observer(state));
};

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
      .withAutomaticReconnect([0, 2000, 5000, 10000, 15000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connection.onclose(() => {
      console.log("SignalR disconnected.");
      notifyConnectionStateChanged(ConnectionState.Disconnected);
    });

    connection.onreconnecting(() => {
      console.log("SignalR reconnecting...");
      notifyConnectionStateChanged(ConnectionState.Reconnecting);
    });

    connection.onreconnected(() => {
      console.log("SignalR reconnected.");
      notifyConnectionStateChanged(ConnectionState.Connected);
    });
  }

  return connection;
};

export const startConnection = async (timeoutMs = 10000): Promise<boolean> => {
  const conn = getConnection();

  if (conn.state === signalR.HubConnectionState.Connected) {
    notifyConnectionStateChanged(ConnectionState.Connected);
    return true;
  }

  if (
    conn.state === signalR.HubConnectionState.Connecting ||
    conn.state === signalR.HubConnectionState.Reconnecting
  ) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (conn.state === signalR.HubConnectionState.Connected) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 500);

      setTimeout(() => {
        clearInterval(checkInterval);
        if (conn.state !== signalR.HubConnectionState.Connected) {
          resolve(false);
        }
      }, timeoutMs);
    });
  }

  notifyConnectionStateChanged(ConnectionState.Connecting);

  const timeoutPromise = new Promise<boolean>((resolve) => {
    setTimeout(() => {
      if (conn.state !== signalR.HubConnectionState.Connected) {
        console.log("SignalR connection attempt timed out");
        notifyConnectionStateChanged(ConnectionState.ConnectionTimedOut);
        resolve(false);
      }
    }, timeoutMs);
  });

  try {
    const connectionPromise = conn
      .start()
      .then(() => {
        console.log("SignalR connected successfully.");
        notifyConnectionStateChanged(ConnectionState.Connected);
        return true;
      })
      .catch((err) => {
        console.error("SignalR connection error:", err);
        notifyConnectionStateChanged(ConnectionState.ConnectionFailed);
        return false;
      });

    return Promise.race([connectionPromise, timeoutPromise]);
  } catch (error) {
    console.error("Unexpected error starting SignalR:", error);
    notifyConnectionStateChanged(ConnectionState.ConnectionFailed);
    return false;
  }
};

export const reconnectSignalR = async (): Promise<boolean> => {
  if (connection?.state === signalR.HubConnectionState.Connected) {
    return true;
  }

  if (connection) {
    try {
      await connection.stop();
      console.log("Stopped existing connection before reconnect");
    } catch (error) {
      console.log("Error stopping connection, continuing anyway:", error);
    }
  }

  connection = null;
  return startConnection();
};

export const useSignalR = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>(
    connection?.state === signalR.HubConnectionState.Connected
      ? ConnectionState.Connected
      : ConnectionState.Disconnected
  );

  const [isConnected, setIsConnected] = useState(
    connection?.state === signalR.HubConnectionState.Connected
  );

  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const connectionRef = useRef(getConnection());

  useEffect(() => {
    const observer = (state: ConnectionState) => {
      setConnectionStatus(state);
      setIsConnected(state === ConnectionState.Connected);

      if (
        state === ConnectionState.ConnectionFailed ||
        state === ConnectionState.ConnectionTimedOut
      ) {
        setConnectionError(
          `Connection ${
            state === ConnectionState.ConnectionTimedOut
              ? "timed out"
              : "failed"
          }. Please try reconnecting.`
        );
      } else if (state === ConnectionState.Connected) {
        setConnectionError(null);
      }
    };

    connectionObservers.push(observer);

    if (
      connectionRef.current.state === signalR.HubConnectionState.Disconnected
    ) {
      setConnectionAttempts((prev) => prev + 1);
      startConnection();
    } else if (
      connectionRef.current.state === signalR.HubConnectionState.Connected
    ) {
      setConnectionStatus(ConnectionState.Connected);
      setIsConnected(true);
    }

    return () => {
      connectionObservers = connectionObservers.filter((o) => o !== observer);
    };
  }, []);

  const reconnect = useCallback(async () => {
    setConnectionError(null);
    setConnectionStatus(ConnectionState.Connecting);
    setConnectionAttempts((prev) => prev + 1);

    const success = await reconnectSignalR();
    if (!success) {
      setConnectionError("Reconnection failed. Please try again.");
    }
    return success;
  }, []);

  const joinAsHost = useCallback(
    async (quizId: number) => {
      if (
        connectionRef.current.state !== signalR.HubConnectionState.Connected
      ) {
        const connected = await reconnect();
        if (!connected) return false;
      }

      try {
        await connectionRef.current.invoke("JoinAsHost", quizId.toString());
        return true;
      } catch (error) {
        console.error("Error joining as host:", error);
        return false;
      }
    },
    [reconnect]
  );

  const joinAsParticipant = useCallback(
    async (pinCode: string, participantName: string) => {
      if (
        connectionRef.current.state !== signalR.HubConnectionState.Connected
      ) {
        const connected = await reconnect();
        if (!connected) throw new Error("Could not connect to server");
      }

      try {
        await connectionRef.current.invoke(
          "JoinAsParticipant",
          pinCode,
          participantName
        );
        return true;
      } catch (error) {
        console.error("Error joining as participant:", error);
        throw error;
      }
    },
    [reconnect]
  );

  const startQuestion = useCallback(
    async (quizId: number, questionId: number) => {
      if (
        connectionRef.current.state !== signalR.HubConnectionState.Connected
      ) {
        const connected = await reconnect();
        if (!connected) return false;
      }

      try {
        await connectionRef.current.invoke("StartQuestion", quizId, questionId);
        return true;
      } catch (error) {
        console.error("Error starting question:", error);
        return false;
      }
    },
    [reconnect]
  );

  const endQuestion = useCallback(
    async (quizId: number, questionId: number) => {
      if (
        connectionRef.current.state !== signalR.HubConnectionState.Connected
      ) {
        const connected = await reconnect();
        if (!connected) return false;
      }

      try {
        await connectionRef.current.invoke("EndQuestion", quizId, questionId);
        return true;
      } catch (error) {
        console.error("Error ending question:", error);
        return false;
      }
    },
    [reconnect]
  );

  const endQuiz = useCallback(
    async (quizId: number) => {
      if (
        connectionRef.current.state !== signalR.HubConnectionState.Connected
      ) {
        const connected = await reconnect();
        if (!connected) return false;
      }

      try {
        await connectionRef.current.invoke("EndQuiz", quizId);
        return true;
      } catch (error) {
        console.error("Error ending quiz:", error);
        return false;
      }
    },
    [reconnect]
  );

  const submitAnswer = useCallback(
    async (
      questionId: number,
      answerId: number | null,
      freeTextAnswer?: string
    ) => {
      if (
        connectionRef.current.state !== signalR.HubConnectionState.Connected
      ) {
        const connected = await reconnect();
        if (!connected) return false;
      }

      try {
        await connectionRef.current.invoke(
          "SubmitAnswer",
          questionId,
          answerId,
          freeTextAnswer || null
        );
        return true;
      } catch (error) {
        console.error("Error submitting answer:", error);
        return false;
      }
    },
    [reconnect]
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
    connectionStatus,
    connectionError,
    connectionAttempts,
    reconnect,
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
    connectionStatus,
    connectionError,
    reconnect,
    joinAsHost,
    startQuestion: startQuestionBase,
    endQuestion: endQuestionBase,
    endQuiz: endQuizBase,
    onEvent,
    connection,
  } = useSignalR();

  const [participants, setParticipants] = useState<
    { id: number; name: string }[]
  >([]);
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);
  const [questionResponses, setQuestionResponses] = useState<
    Record<number, any[]>
  >({});
  const [joinStatus, setJoinStatus] = useState<"pending" | "joined" | "failed">(
    "pending"
  );

  const initParticipants = useCallback((initialParticipants: any[]) => {
    if (initialParticipants && initialParticipants.length > 0) {
      console.log("Initializing participants:", initialParticipants);
      const connectedParticipants = initialParticipants.filter(
        (p) => p.connectionId != null
      );
      setParticipants(
        connectedParticipants.map((p) => ({
          id: p.id,
          name: p.name,
        }))
      );
    }
  }, []);

  const refreshParticipantList = useCallback(async () => {
    console.log("Refreshing participant list using dual approach...");

    try {
      const activeParticipants = await quizApi.getActiveParticipants(quizId);
      console.log("REST API response:", activeParticipants);
      console.log("Number of participants:", activeParticipants.length);

      if (Array.isArray(activeParticipants)) {
        const nullConnectionIds = activeParticipants.filter(
          (p) => !p.connectionId && !p.ConnectionId
        );
        console.log(
          "Participants with null ConnectionId:",
          nullConnectionIds.length
        );
      }
      setParticipants(activeParticipants);
    } catch (restError) {
      console.error("REST API participant refresh failed:", restError);

      if (isConnected && connection) {
        try {
          await connection.invoke("GetActiveParticipants", quizId);
        } catch (signalrError) {
          console.error("Both refresh methods failed:", signalrError);
        }
      }
    }
  }, [isConnected, connection, quizId]);

  useEffect(() => {
    const attemptJoin = async () => {
      if (isConnected && quizId) {
        console.log("Attempting to join as host for quiz:", quizId);
        setJoinStatus("pending");

        try {
          const success = await joinAsHost(quizId);
          if (success) {
            console.log("Successfully joined as host for quiz:", quizId);
            setJoinStatus("joined");
          } else {
            console.error("Failed to join as host for quiz:", quizId);
            setJoinStatus("failed");
          }
        } catch (error) {
          console.error("Error joining as host:", error);
          setJoinStatus("failed");
        }
      }
    };

    attemptJoin();
  }, [isConnected, quizId, joinAsHost]);

  useEffect(() => {
    if (!isConnected) return;

    console.log("Setting up SignalR event listeners for host");

    const removeParticipantJoined = onEvent(
      "ParticipantJoined",
      (id: number, name: string) => {
        console.log(`Participant joined: ${name} (${id})`);
        setParticipants((prev) => {
          if (prev.some((p) => p.id === id)) {
            return prev;
          }
          return [...prev, { id, name }];
        });
      }
    );

    const removeParticipantLeft = onEvent(
      "ParticipantLeft",
      (id: number, name: string) => {
        console.log(`Participant left: ${name} (${id})`);
        setParticipants((prev) => prev.filter((p) => p.id !== id));
      }
    );

    const removeNewResponse = onEvent(
      "NewResponse",
      (questionId: number, participantId: number) => {
        console.log(
          `New response from participant ${participantId} for question ${questionId}`
        );
      }
    );

    const removeQuestionEnded = onEvent(
      "QuestionEnded",
      (questionId: number, results: any[]) => {
        console.log(`Question ${questionId} ended with results:`, results);
        setQuestionResponses((prev) => ({
          ...prev,
          [questionId]: results,
        }));
        setActiveQuestion(null);
      }
    );

    const removeQuestionStarted = onEvent(
      "QuestionStarted",
      (questionId: number) => {
        console.log(`Question ${questionId} started`);
        setActiveQuestion(questionId);
      }
    );

    const removeActiveParticipantsList = onEvent(
      "ActiveParticipantsList",
      (participants) => {
        console.log("Received active participants list:", participants);
        setParticipants(participants);
      }
    );

    return () => {
      removeParticipantJoined();
      removeParticipantLeft();
      removeNewResponse();
      removeQuestionEnded();
      removeQuestionStarted();
      removeActiveParticipantsList();
    };
  }, [isConnected, onEvent]);

  useEffect(() => {
    if (joinStatus === "joined" && isConnected) {
      refreshParticipantList();
    }
  }, [joinStatus, isConnected, refreshParticipantList]);

  useEffect(() => {
    if (!isConnected || joinStatus !== "joined") return;

    const intervalId = setInterval(() => {
      refreshParticipantList();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [isConnected, joinStatus, refreshParticipantList]);

  const retryJoin = useCallback(async () => {
    if (joinStatus === "failed") {
      if (!isConnected) {
        await reconnect();
      }

      if (isConnected) {
        setJoinStatus("pending");
        try {
          const success = await joinAsHost(quizId);
          setJoinStatus(success ? "joined" : "failed");
        } catch (error) {
          console.error("Error retrying join:", error);
          setJoinStatus("failed");
        }
      }
    }
  }, [isConnected, joinStatus, joinAsHost, quizId, reconnect]);

  const startQuestion = async (questionId: number) => {
    console.log(`Starting question ${questionId} for quiz ${quizId}`);
    if (!isConnected) {
      console.warn("Cannot start question - not connected to SignalR hub");
      return false;
    }

    try {
      const success = await startQuestionBase(quizId, questionId);
      if (success) {
        setActiveQuestion(questionId);
      }
      return success;
    } catch (error) {
      console.error("Error starting question:", error);
      return false;
    }
  };

  const endQuestion = async () => {
    if (!activeQuestion) {
      console.warn("No active question to end");
      return false;
    }

    console.log(`Ending question ${activeQuestion} for quiz ${quizId}`);
    if (!isConnected) {
      console.warn("Cannot end question - not connected to SignalR hub");
      return false;
    }

    try {
      return await endQuestionBase(quizId, activeQuestion);
    } catch (error) {
      console.error("Error ending question:", error);
      return false;
    }
  };

  const endQuiz = async () => {
    console.log(`Ending quiz ${quizId}`);
    if (!isConnected) {
      console.warn("Cannot end quiz - not connected to SignalR hub");
      return false;
    }

    try {
      return await endQuizBase(quizId);
    } catch (error) {
      console.error("Error ending quiz:", error);
      return false;
    }
  };

  return {
    participants,
    activeQuestion,
    questionResponses,
    startQuestion,
    endQuestion,
    endQuiz,
    isConnected,
    connectionStatus,
    connectionError,
    reconnect,
    joinStatus,
    retryJoin,
    initParticipants,
    connection,
    refreshParticipantList,
  };
};

export const useQuizParticipant = () => {
  const {
    isConnected,
    connectionStatus,
    connectionError,
    reconnect,
    joinAsParticipant,
    submitAnswer: submitAnswerBase,
    onEvent,
  } = useSignalR();

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
  const [joinStatus, setJoinStatus] = useState<
    "idle" | "pending" | "joined" | "failed"
  >("idle");

  useEffect(() => {
    if (!isConnected) return;

    const removeQuizInfo = onEvent(
      "QuizInfo",
      (title: string, mode: string) => {
        setQuizInfo({ title, mode });
        setError(null);
        setJoinStatus("joined");
      }
    );

    const removeJoinError = onEvent("JoinError", (errorMessage: string) => {
      setError(errorMessage);
      setJoinStatus("failed");
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

  useEffect(() => {
    if (connectionError) {
      setError(connectionError);
    }
  }, [connectionError]);

  const joinQuiz = async (pinCode: string, name: string) => {
    setJoinStatus("pending");
    setError(null);

    if (!isConnected) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const reconnected = await reconnect();
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (!reconnected) {
          setError("Could not connect to server. Please try again.");
          setJoinStatus("failed");
          return false;
        }
      } catch (error) {
        setError("Connection failed. Please try again.");
        setJoinStatus("failed");
        return false;
      }
    }

    try {
      await joinAsParticipant(pinCode, name);
      return true;
    } catch (err) {
      console.error("Error joining quiz:", err);
      setError("Failed to join quiz. Please try again.");
      setJoinStatus("failed");
      return false;
    }
  };

  const submitAnswer = async (
    answerId: number | null,
    freeTextAnswer?: string
  ) => {
    if (!isConnected) {
      setError("Not connected to server. Please reconnect.");
      return false;
    }

    try {
      if (currentQuestion) {
        return await submitAnswerBase(
          currentQuestion.id,
          answerId,
          freeTextAnswer
        );
      } else if (surveyQuestions.length > 0) {
        const currentSurveyQuestion =
          surveyQuestions[currentSurveyQuestionIndex];
        if (currentSurveyQuestion) {
          setSurveyResponses((prev) => {
            const newMap = new Map(prev);
            newMap.set(currentSurveyQuestion.id, {
              answerId: answerId || undefined,
              freeText: freeTextAnswer,
            });
            return newMap;
          });

          return await submitAnswerBase(
            currentSurveyQuestion.id,
            answerId,
            freeTextAnswer
          );
        }
      }
      return false;
    } catch (error) {
      console.error("Error submitting answer:", error);
      setError("Failed to submit answer. Please try again.");
      return false;
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
    connectionStatus,
    joinStatus,
    joinQuiz,
    submitAnswer,
    reconnect,
    isSurveyMode: quizInfo?.mode === "SelfPaced",
    surveyQuestions,
    currentSurveyQuestion: getCurrentSurveyQuestion(),
    currentSurveyQuestionIndex,
    nextSurveyQuestion,
    previousSurveyQuestion,
    surveyResponses,
  };
};
