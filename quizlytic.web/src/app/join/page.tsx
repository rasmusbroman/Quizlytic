"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import QuizParticipant from "@/components/quiz/QuizParticipant";
import { quizApi } from "@/lib/api-client";

export default function JoinQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPin = searchParams.get("pin") || "";
  const initialName = searchParams.get("name") || "";

  const [pinCode, setPinCode] = useState(initialPin);
  const [participantName, setParticipantName] = useState("");
  const [quizInfo, setQuizInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"pin" | "name">(initialPin ? "name" : "pin");
  const [showParticipant, setShowParticipant] = useState(false);

  useEffect(() => {
    if (initialPin && initialName) {
      setShowParticipant(true);
    } else if (initialPin) {
      setPinCode(initialPin);
      fetchQuizInfo(initialPin);
    }
  }, [initialPin, initialName]);

  const fetchQuizInfo = async (pin?: string) => {
    const codeToUse = pin || pinCode;
    if (!codeToUse || codeToUse.length < 6) return;

    setLoading(true);
    setError("");

    try {
      let data;
      try {
        data = await quizApi.getSurveyQuestions(codeToUse);
      } catch (surveyError) {
        if (quizApi.getQuizQuestions) {
          data = await quizApi.getQuizQuestions(codeToUse);
        } else {
          console.warn(
            "Could not fetch quiz details, but proceeding with join"
          );
        }
      }

      if (data) {
        setQuizInfo(data);
      }
      setStep("name");
    } catch (err) {
      console.error("Error fetching quiz info:", err);
      setError(
        "Quiz details unavailable, but you can still try to join with this PIN"
      );
      setStep("name");
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuizInfo();
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();

    if (quizInfo) {
      if (quizInfo.mode === 0 && !participantName) {
        setError("Real-time quizzes require a name to join");
        return;
      }

      if (!participantName && !quizInfo.allowAnonymous) {
        setError("Name is required for this quiz");
        return;
      }

      const allowAnonymous =
        (quizInfo.mode === 1 && quizInfo.allowAnonymous) ||
        (quizInfo.mode !== 0 && quizInfo.allowAnonymous);

      const effectiveName =
        !participantName && allowAnonymous ? "Anonymous" : participantName;

      router.push(
        `/join?pin=${pinCode}&name=${encodeURIComponent(effectiveName)}`
      );
      return;
    }

    if (!participantName) {
      setError("Please enter your name to join");
      return;
    }

    router.push(
      `/join?pin=${pinCode}&name=${encodeURIComponent(participantName)}`
    );
  };

  if (initialPin && initialName) {
    return (
      <QuizParticipant
        initialPinCode={initialPin}
        initialParticipantName={initialName}
      />
    );
  }

  if (step === "pin") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="bg-card rounded-lg shadow p-6">
          <h1 className="text-xl font-bold mb-6 text-center">Join a Quiz</h1>

          {error && (
            <div className="bg-red-100 text-red-800 p-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handlePinSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 mb-1">Quiz PIN Code</label>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-opacity-90 transition"
            >
              {loading ? "Checking..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="bg-card rounded-lg shadow p-6">
        <h1 className="text-xl font-bold mb-6 text-center">Join Quiz</h1>

        {loading ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mb-2"></div>
            <p>Loading quiz information...</p>
          </div>
        ) : (
          <>
            {quizInfo && (
              <div className="bg-accent rounded-md p-4 mb-4">
                <h2 className="font-medium">{quizInfo.quizTitle}</h2>
                <p className="text-sm text-text-secondary">
                  {quizInfo.questions?.length || 0} questions
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-100 text-red-800 p-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleJoin}>
              <div className="mb-6">
                <label className="block text-gray-700 mb-1">
                  Your Name{" "}
                  {quizInfo?.allowAnonymous ? "(optional)" : "(Required)"}
                </label>
                <input
                  type="text"
                  placeholder={
                    quizInfo?.allowAnonymous
                      ? "Enter your name (optional)"
                      : "Enter your name"
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  required={quizInfo && !quizInfo.allowAnonymous}
                  autoFocus
                />

                {quizInfo?.allowAnonymous && (
                  <p className="mt-1 text-sm text-text-secondary">
                    You will join as "Anonymous" if you leave this empty
                  </p>
                )}
              </div>

              <div className="flex space-x-3">
                {!initialPin && (
                  <button
                    type="button"
                    onClick={() => setStep("pin")}
                    className="flex-1 bg-secondary text-white py-2 px-4 rounded-md hover:bg-opacity-90 transition"
                  >
                    Back
                  </button>
                )}

                <button
                  type="submit"
                  className="flex-1 bg-primary text-white py-2 px-4 rounded-md hover:bg-opacity-90 transition"
                >
                  Join Quiz
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
