import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { resultApi, quizApi } from "@/lib/api-client";
import {
  IoArrowBack,
  IoCheckmarkCircle,
  IoPeople,
  IoStatsChart,
} from "react-icons/io5";
import DateDisplay from "@/components/DateDisplay";
import { QuizStatus, QuestionType } from "@/lib/types";

interface QuizResultsDetailProps {
  quizId: number;
}

const QuizResultsDetail: React.FC<QuizResultsDetailProps> = ({ quizId }) => {
  const router = useRouter();
  const [quiz, setQuiz] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"summary" | "participants">(
    "summary"
  );
  const [activeParticipant, setActiveParticipant] = useState<number | null>(
    null
  );

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const quizData = await quizApi.getById(quizId);
        setQuiz(quizData);

        const resultsData = await resultApi.getByQuizId(quizId);
        setResults(resultsData);
      } catch (err) {
        console.error("Error loading quiz results:", err);
        setError("Could not load quiz results. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (quizId) {
      loadData();
    }
  }, [quizId]);

  const handleBackNavigation = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/admin");
    }
  };

  const calculateParticipantScores = () => {
    if (!results || !results.questions) return [];

    const participants = results.participants || [];

    const participantScores = participants.map((participant) => {
      let correctAnswers = 0;
      let totalAnswerable = 0;
      const answeredQuestions = new Set();
      results.questions.forEach((question) => {
        if (question.questionType === QuestionType.FreeText) return;

        totalAnswerable++;

        const participantAnswers = [];

        question.answerDistribution.forEach((answer) => {
          const responses =
            results.responses?.filter(
              (r) =>
                r.questionId === question.questionId &&
                r.participantId === participant.id &&
                r.answerId === answer.answerId
            ) || [];

          if (responses.length > 0) {
            participantAnswers.push(answer);
            answeredQuestions.add(question.questionId);
          }
        });

        if (question.questionType === QuestionType.SingleChoice) {
          if (
            participantAnswers.length === 1 &&
            participantAnswers[0].isCorrect
          ) {
            correctAnswers++;
          }
        } else if (question.questionType === QuestionType.MultipleChoice) {
          const allCorrectSelected = question.answerDistribution
            .filter((a) => a.isCorrect)
            .every((correctAns) =>
              participantAnswers.some(
                (pa) => pa.answerId === correctAns.answerId
              )
            );

          const noIncorrectSelected = participantAnswers.every(
            (pa) => pa.isCorrect
          );

          if (
            allCorrectSelected &&
            noIncorrectSelected &&
            participantAnswers.length > 0
          ) {
            correctAnswers++;
          }
        }
      });

      const answeredCount = answeredQuestions.size;
      const percentage =
        totalAnswerable > 0
          ? Math.round((correctAnswers / totalAnswerable) * 100)
          : 0;

      return {
        ...participant,
        correctAnswers,
        totalAnswerable,
        answeredCount,
        percentage,
        score: `${correctAnswers}/${totalAnswerable}`,
      };
    });

    return participantScores.sort((a, b) => b.percentage - a.percentage);
  };

  const getParticipantAnswers = (participantId) => {
    if (!results || !results.questions) return [];

    return results.questions.map((question) => {
      const participantAnswers = [];

      question.answerDistribution.forEach((answer) => {
        const selected =
          results.responses?.some(
            (r) =>
              r.questionId === question.questionId &&
              r.participantId === participantId &&
              r.answerId === answer.answerId
          ) || false;

        if (selected) {
          participantAnswers.push(answer);
        }
      });

      let freeTextResponse = null;
      if (question.questionType === QuestionType.FreeText) {
        const response = question.freeTextResponses?.find(
          (r) => r.participantId === participantId
        );
        if (response) {
          freeTextResponse = response.response;
        }
      }

      let isCorrect = null;
      if (quiz.hasCorrectAnswers) {
        if (question.questionType === QuestionType.SingleChoice) {
          isCorrect =
            participantAnswers.length === 1 && participantAnswers[0].isCorrect;
        } else if (question.questionType === QuestionType.MultipleChoice) {
          const allCorrectSelected = question.answerDistribution
            .filter((a) => a.isCorrect)
            .every((correctAns) =>
              participantAnswers.some(
                (pa) => pa.answerId === correctAns.answerId
              )
            );

          const noIncorrectSelected = participantAnswers.every(
            (pa) => pa.isCorrect
          );

          isCorrect =
            allCorrectSelected &&
            noIncorrectSelected &&
            participantAnswers.length > 0;
        }
      }

      return {
        ...question,
        participantAnswers,
        freeTextResponse,
        isCorrect,
        answered: participantAnswers.length > 0 || freeTextResponse !== null,
      };
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-card rounded-lg shadow p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-2"></div>
          <p className="text-text-secondary">Loading quiz results...</p>
        </div>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-card rounded-lg shadow p-6">
          <div className="bg-red-100 text-red-800 p-4 rounded mb-4">
            {error}
          </div>
          <button
            onClick={handleBackNavigation}
            className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-hover transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-card rounded-lg shadow p-6 text-center">
          <p className="text-text-secondary">Quiz not found</p>
        </div>
      </div>
    );
  }

  const participantScores = calculateParticipantScores();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-primary">
            Admin Results: {quiz.title}
          </h1>
          <button
            onClick={handleBackNavigation}
            className="flex items-center text-primary hover:text-primary-hover transition"
            aria-label="Back"
          >
            <IoArrowBack className="h-5 w-5 mr-1" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>

        <div className="bg-accent rounded-md p-4 mb-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-text-secondary">Status</p>
              <p className="font-medium">
                {QuizStatus[quiz.status] || "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Questions</p>
              <p className="font-medium">{results?.questions?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Participants</p>
              <p className="font-medium">
                {results?.participants?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Type</p>
              <p className="font-medium">
                {quiz.hasCorrectAnswers ? "Educational Quiz" : "Survey"}
              </p>
            </div>
            {quiz.startedAt && (
              <div>
                <p className="text-sm text-text-secondary">Started</p>
                <p className="font-medium">
                  <DateDisplay date={quiz.startedAt} formatString="PPp" />
                </p>
              </div>
            )}
            {quiz.endedAt && (
              <div>
                <p className="text-sm text-text-secondary">Ended</p>
                <p className="font-medium">
                  <DateDisplay date={quiz.endedAt} formatString="PPp" />
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border-b border-border mb-6">
          <div className="flex">
            <button
              className={`py-2 px-4 border-b-2 ${
                activeTab === "summary"
                  ? "border-primary text-primary"
                  : "border-transparent hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("summary")}
            >
              <IoStatsChart className="inline mr-1" />
              Summary
            </button>
            <button
              className={`py-2 px-4 border-b-2 ${
                activeTab === "participants"
                  ? "border-primary text-primary"
                  : "border-transparent hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("participants")}
            >
              <IoPeople className="inline mr-1" />
              Participants
            </button>
          </div>
        </div>

        {activeTab === "summary" ? (
          <div>
            <h2 className="text-lg font-semibold mb-4">Question Results</h2>

            {results && results.questions ? (
              <div className="space-y-6">
                {results.questions.map((question) => (
                  <div
                    key={question.questionId}
                    className="border border-border rounded-md p-4"
                  >
                    <h3 className="font-medium mb-2">
                      Question {question.orderIndex + 1}:{" "}
                      {question.questionText}
                    </h3>
                    <p className="text-sm text-text-secondary mb-2">
                      {question.responseCount} responses
                      {question.questionType === QuestionType.SingleChoice &&
                        " (Single Choice)"}
                      {question.questionType === QuestionType.MultipleChoice &&
                        " (Multiple Choice)"}
                      {question.questionType === QuestionType.FreeText &&
                        " (Free Text)"}
                    </p>

                    {question.questionType !== QuestionType.FreeText &&
                    question.answerDistribution?.length > 0 ? (
                      <div className="space-y-3 mt-4">
                        {question.answerDistribution.map((answer, aIndex) => (
                          <div key={aIndex}>
                            <div className="flex justify-between mb-1">
                              <span className="flex items-center">
                                {answer.isCorrect && quiz.hasCorrectAnswers && (
                                  <IoCheckmarkCircle className="text-green-500 mr-1 h-5 w-5" />
                                )}
                                {answer.answerText}
                              </span>
                              <span>
                                {answer.count} ({Math.round(answer.percentage)}
                                %)
                              </span>
                            </div>
                            <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  answer.isCorrect && quiz.hasCorrectAnswers
                                    ? "bg-green-500"
                                    : "bg-primary"
                                }`}
                                style={{ width: `${answer.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : question.questionType === QuestionType.FreeText &&
                      question.freeTextResponses?.length > 0 ? (
                      <div className="space-y-2 mt-4">
                        <p className="font-medium">Text Responses:</p>
                        {question.freeTextResponses.map((response, rIndex) => (
                          <div
                            key={rIndex}
                            className="bg-accent p-3 rounded-md"
                          >
                            <p className="text-sm font-medium">
                              {response.participantName}:
                            </p>
                            <p>{response.response}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-text-secondary">
                        No responses for this question.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-text-secondary">
                No result data available
              </p>
            )}
          </div>
        ) : (
          <div>
            {activeParticipant === null ? (
              <>
                <h2 className="text-lg font-semibold mb-4">
                  Participant Results
                </h2>

                {participantScores.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary tracking-wider">
                            Name
                          </th>
                          {quiz.hasCorrectAnswers && (
                            <>
                              <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary tracking-wider">
                                Score
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary tracking-wider">
                                Percentage
                              </th>
                            </>
                          )}
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary tracking-wider">
                            Questions Answered
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {participantScores.map((participant) => (
                          <tr key={participant.id}>
                            <td className="px-4 py-2 whitespace-nowrap">
                              {participant.name}
                            </td>
                            {quiz.hasCorrectAnswers && (
                              <>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  {participant.score}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <span className="mr-2">
                                      {participant.percentage}%
                                    </span>
                                    <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                      <div
                                        className={`h-2.5 rounded-full ${
                                          participant.percentage >= 80
                                            ? "bg-green-500"
                                            : participant.percentage >= 60
                                            ? "bg-yellow-500"
                                            : "bg-red-500"
                                        }`}
                                        style={{
                                          width: `${participant.percentage}%`,
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                </td>
                              </>
                            )}
                            <td className="px-4 py-2 whitespace-nowrap">
                              {participant.answeredCount}/
                              {participant.totalAnswerable}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <button
                                onClick={() =>
                                  setActiveParticipant(participant.id)
                                }
                                className="text-primary hover:text-primary-hover"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-text-secondary">
                    No participant data available
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">
                    Participant:{" "}
                    {
                      results.participants.find(
                        (p) => p.id === activeParticipant
                      )?.name
                    }
                  </h2>
                  <button
                    onClick={() => setActiveParticipant(null)}
                    className="text-primary hover:text-primary-hover"
                  >
                    Back to All Participants
                  </button>
                </div>

                {results && results.questions ? (
                  <>
                    {quiz.hasCorrectAnswers && (
                      <div className="bg-accent p-4 rounded-md mb-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">Overall Results</h3>
                            <p className="text-text-secondary">
                              {participantScores.find(
                                (p) => p.id === activeParticipant
                              )?.score || "0/0"}{" "}
                              correct answers
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-bold">
                              {participantScores.find(
                                (p) => p.id === activeParticipant
                              )?.percentage || 0}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-6">
                      {getParticipantAnswers(activeParticipant).map(
                        (questionData) => (
                          <div
                            key={questionData.questionId}
                            className={`border rounded-md p-4 ${
                              quiz.hasCorrectAnswers &&
                              questionData.isCorrect === true
                                ? "border-green-200 bg-green-50"
                                : quiz.hasCorrectAnswers &&
                                  questionData.isCorrect === false
                                ? "border-red-200 bg-red-50"
                                : "border-border"
                            }`}
                          >
                            <h3 className="font-medium mb-2">
                              Question {questionData.orderIndex + 1}:{" "}
                              {questionData.questionText}
                            </h3>

                            {questionData.questionType ===
                            QuestionType.FreeText ? (
                              <>
                                <p className="text-sm text-text-secondary mb-2">
                                  Free Text Response:
                                </p>
                                {questionData.freeTextResponse ? (
                                  <div className="bg-white p-3 rounded border border-border">
                                    {questionData.freeTextResponse}
                                  </div>
                                ) : (
                                  <p className="text-text-secondary italic">
                                    No response provided
                                  </p>
                                )}
                              </>
                            ) : (
                              <>
                                <p className="text-sm text-text-secondary mb-2">
                                  {questionData.questionType ===
                                  QuestionType.SingleChoice
                                    ? "Selected answer:"
                                    : "Selected answers:"}
                                </p>

                                {questionData.participantAnswers.length > 0 ? (
                                  <div className="space-y-2">
                                    {questionData.answerDistribution.map(
                                      (answer, index) => {
                                        const isSelected =
                                          questionData.participantAnswers.some(
                                            (a) =>
                                              a.answerId === answer.answerId
                                          );

                                        return (
                                          <div
                                            key={index}
                                            className={`p-2 rounded border ${
                                              isSelected
                                                ? answer.isCorrect &&
                                                  quiz.hasCorrectAnswers
                                                  ? "bg-green-100 border-green-300"
                                                  : answer.isCorrect ===
                                                      false &&
                                                    quiz.hasCorrectAnswers
                                                  ? "bg-red-100 border-red-300"
                                                  : "bg-blue-100 border-blue-300"
                                                : answer.isCorrect &&
                                                  quiz.hasCorrectAnswers
                                                ? "border-green-200 border-dashed"
                                                : "border-gray-200"
                                            }`}
                                          >
                                            <div className="flex items-center">
                                              {isSelected && (
                                                <div className="w-4 h-4 bg-primary rounded-full mr-2"></div>
                                              )}
                                              <span>{answer.answerText}</span>
                                              {answer.isCorrect &&
                                                quiz.hasCorrectAnswers && (
                                                  <IoCheckmarkCircle className="ml-2 text-green-500" />
                                                )}
                                            </div>
                                          </div>
                                        );
                                      }
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-text-secondary italic">
                                    No response provided
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-center text-text-secondary">
                    No data available for this participant
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizResultsDetail;
