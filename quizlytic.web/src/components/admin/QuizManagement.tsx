"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  IoArrowBack,
  IoSave,
  IoTrash,
  IoPlayCircle,
  IoPauseCircle,
  IoStopCircle,
} from "react-icons/io5";
import { useAuth } from "@/hooks/useAuth";
import { requireAuth } from "@/lib/auth";
import { quizApi } from "@/lib/api-client";
import { Quiz, QuizStatus, QuizMode } from "@/lib/types";
import DateDisplay from "@/components/DateDisplay";

interface QuizManagementProps {
  quizId: number;
}

const QuizManagement: React.FC<QuizManagementProps> = ({ quizId }) => {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [hasCorrectAnswers, setHasCorrectAnswers] = useState(true);
  const [quizMode, setQuizMode] = useState<QuizMode>(QuizMode.RealTime);
  const [allowAnonymous, setAllowAnonymous] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/");
        return;
      }

      if (!isAdmin) {
        router.push("/");
        return;
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, router]);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const data = await quizApi.getById(quizId);
        setQuiz(data);
        setTitle(data.title);
        setDescription(data.description);
        setIsPublic(data.isPublic);
        setHasCorrectAnswers(data.hasCorrectAnswers || false);
        setQuizMode(data.mode);
        setAllowAnonymous(data.allowAnonymous);
      } catch (err) {
        console.error("Error loading quiz:", err);
        setError("Could not load quiz. Please check API connection.");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && isAdmin && quizId) {
      loadQuiz();
    }
  }, [isAuthenticated, isAdmin, quizId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      await quizApi.update(quizId, {
        title,
        description,
        isPublic,
        hasCorrectAnswers,
        mode: quizMode,
        allowAnonymous,
      });
      setSuccessMessage("Quiz updated successfully");

      if (quiz) {
        setQuiz({
          ...quiz,
          title,
          description,
          isPublic,
          hasCorrectAnswers,
          mode: quizMode,
          allowAnonymous,
        });
      }
    } catch (err) {
      console.error("Error updating quiz:", err);
      setError("Could not update quiz. Please try again.");
    } finally {
      setSaving(false);

      if (successMessage) {
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    }
  };

  const handleStartQuiz = async () => {
    try {
      const updatedQuiz = await quizApi.start(quizId);
      setQuiz(updatedQuiz);
      setSuccessMessage("Quiz started successfully");
    } catch (err) {
      console.error("Error starting quiz:", err);
      setError("Could not start quiz. Please try again.");
    }
  };

  const handleDeleteQuiz = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this quiz? This action cannot be undone."
      )
    ) {
      try {
        await quizApi.delete(quizId);
        router.push("/admin");
      } catch (err) {
        console.error("Error deleting quiz:", err);
        setError("Could not delete quiz. Please try again.");
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-foreground">
            {loading ? "Loading Quiz..." : `Manage Quiz: ${quiz?.title}`}
          </h1>
          <button
            onClick={() => router.push("/admin")}
            className="flex items-center text-primary hover:text-primary-hover transition"
          >
            <IoArrowBack className="h-5 w-5 mr-1" />
            <span className="hidden sm:inline">Back to Admin</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded mb-4">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 text-green-800 p-4 rounded mb-4">
            {successMessage}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2 text-text-secondary">Loading quiz...</p>
          </div>
        ) : quiz ? (
          <div className="space-y-6">
            <div className="bg-accent rounded-md p-4 flex flex-wrap justify-between gap-3">
              <div>
                <span className="text-sm text-text-secondary">Status</span>
                <div className="font-medium">{QuizStatus[quiz.status]}</div>
              </div>
              <div>
                <span className="text-sm text-text-secondary">Quiz ID</span>
                <div className="font-medium">{quiz.id}</div>
              </div>
              <div>
                <span className="text-sm text-text-secondary">PIN Code</span>
                <div className="font-medium">{quiz.pinCode}</div>
              </div>
              <div>
                <span className="text-sm text-text-secondary">Created</span>
                <div className="font-medium">
                  <DateDisplay date={quiz.createdAt} formatString="PP" />
                </div>
              </div>
              {quiz.startedAt && (
                <div>
                  <span className="text-sm text-text-secondary">Started</span>
                  <div className="font-medium">
                    <DateDisplay date={quiz.startedAt} formatString="PP" />
                  </div>
                </div>
              )}
              {quiz.endedAt && (
                <div>
                  <span className="text-sm text-text-secondary">Ended</span>
                  <div className="font-medium">
                    <DateDisplay date={quiz.endedAt} formatString="PP" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {quiz.status === QuizStatus.Created && (
                <button
                  onClick={handleStartQuiz}
                  className="flex items-center bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
                >
                  <IoPlayCircle className="h-5 w-5 mr-1" />
                  Start Quiz
                </button>
              )}

              <button
                onClick={handleDeleteQuiz}
                className="flex items-center bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition"
              >
                <IoTrash className="h-5 w-5 mr-1" />
                Delete Quiz
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="space-y-4 mt-6">
                <h2 className="text-lg font-semibold">Edit Quiz Information</h2>

                <div>
                  <label className="block text-foreground mb-1">
                    Quiz Title
                  </label>
                  <input
                    type="text"
                    className="w-full border border-border rounded-md px-3 py-2"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-foreground mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full border border-border rounded-md px-3 py-2"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-foreground mb-1 block">
                    Quiz Mode
                  </label>
                  <div className="flex gap-6">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="modeRealTime"
                        name="quizMode"
                        checked={quizMode === QuizMode.RealTime}
                        onChange={() => setQuizMode(QuizMode.RealTime)}
                        className="mr-2"
                        disabled={quiz.status !== QuizStatus.Created}
                      />
                      <label htmlFor="modeRealTime" className="text-foreground">
                        Real-time Quiz
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="modeSelfPaced"
                        name="quizMode"
                        checked={quizMode === QuizMode.SelfPaced}
                        onChange={() => setQuizMode(QuizMode.SelfPaced)}
                        className="mr-2"
                        disabled={quiz.status !== QuizStatus.Created}
                      />
                      <label
                        htmlFor="modeSelfPaced"
                        className="text-foreground"
                      >
                        Self-paced Survey
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="isPublic" className="text-foreground">
                      Public (visible to everyone)
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="hasCorrectAnswers"
                      checked={hasCorrectAnswers}
                      onChange={(e) => setHasCorrectAnswers(e.target.checked)}
                      className="mr-2"
                      disabled={quiz.status !== QuizStatus.Created}
                    />
                    <label
                      htmlFor="hasCorrectAnswers"
                      className="text-foreground"
                    >
                      Has correct answers
                    </label>
                  </div>
                </div>

                {quizMode === QuizMode.SelfPaced && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allowAnonymous"
                      checked={allowAnonymous}
                      onChange={(e) => setAllowAnonymous(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="allowAnonymous" className="text-foreground">
                      Allow anonymous participation
                    </label>
                  </div>
                )}

                <div className="pt-4">
                  <button
                    type="submit"
                    className="flex items-center bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-hover transition"
                    disabled={saving}
                  >
                    <IoSave className="h-5 w-5 mr-1" />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-3">Questions</h2>

              {quiz.questions.length > 0 ? (
                <div className="space-y-3">
                  {quiz.questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="border border-border rounded-md p-3"
                    >
                      <p className="font-medium">
                        Question {index + 1}: {question.text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-secondary">
                  This quiz has no questions yet.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-text-secondary">Quiz not found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizManagement;
