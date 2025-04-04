import {
  Quiz,
  Question,
  Answer,
  Response,
  Participant,
  QuizMode,
} from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7066";

async function fetchJson<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    try {
      const errorData = await response.json();
      const error = new Error(
        `API error: ${response.statusText} - ${JSON.stringify(errorData)}`
      );
      error.response = response;
      throw error;
    } catch {
      const error = new Error(`API error: ${response.statusText}`);
      error.response = response;
      throw error;
    }
  }

  return response.json() as Promise<T>;
}

export const quizApi = {
  getAll: async (publicOnly: boolean = true): Promise<Quiz[]> => {
    const url = publicOnly
      ? `${API_URL}/api/quizzes?publicOnly=true`
      : `${API_URL}/api/quizzes`;
    return fetchJson<Quiz[]>(url);
  },

  getByPublicId: async (publicId: string): Promise<Quiz> => {
    return fetchJson<Quiz>(`${API_URL}/api/quizzes/public/${publicId}`);
  },

  getById: async (id: number): Promise<Quiz> => {
    return fetchJson<Quiz>(`${API_URL}/api/quizzes/${id}`);
  },

  getActiveParticipants: async (
    quizId: number
  ): Promise<{ id: number; name: string }[]> => {
    return fetchJson<{ id: number; name: string }[]>(
      `${API_URL}/api/participants/active/${quizId}`
    );
  },

  create: async (quiz: {
    title: string;
    description: string;
    hasCorrectAnswers?: boolean;
    isPublic?: boolean;
    mode?: QuizMode;
    allowAnonymous?: boolean;
  }): Promise<Quiz> => {
    return fetchJson<Quiz>(`${API_URL}/api/quizzes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quiz),
    });
  },

  update: async (
    id: number,
    quiz: {
      title: string;
      description: string;
      hasCorrectAnswers?: boolean;
      isPublic?: boolean;
      mode?: QuizMode;
      allowAnonymous?: boolean;
    }
  ): Promise<void> => {
    await fetch(`${API_URL}/api/quizzes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quiz),
    });
  },

  delete: async (id: number): Promise<void> => {
    await fetch(`${API_URL}/api/quizzes/${id}`, {
      method: "DELETE",
    });
  },

  start: async (id: number): Promise<Quiz> => {
    return fetchJson<Quiz>(`${API_URL}/api/quizzes/${id}/start`, {
      method: "POST",
    });
  },

  end: async (id: number): Promise<Quiz> => {
    return fetchJson<Quiz>(`${API_URL}/api/quizzes/${id}/end`, {
      method: "POST",
    });
  },

  getQrCode: async (pinCode: string): Promise<{ url: string }> => {
    return fetchJson<{ url: string }>(`${API_URL}/api/qrcode/${pinCode}`);
  },

  getSurveyQuestions: async (pinCode: string): Promise<any> => {
    return fetchJson<any>(`${API_URL}/api/surveys/${pinCode}/questions`);
  },

  submitSurveyResponses: async (
    pinCode: string,
    response: {
      participantName: string;
      answers: {
        questionId: number;
        answerId?: number;
        freeTextResponse?: string;
      }[];
    }
  ): Promise<any> => {
    return fetchJson<any>(`${API_URL}/api/surveys/${pinCode}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(response),
    });
  },
};

export const questionApi = {
  create: async (question: {
    quizId: number;
    text: string;
    imageUrl?: string;
    type: number;
    answers?: { text: string; isCorrect: boolean }[];
  }): Promise<Question> => {
    return fetchJson<Question>(`${API_URL}/api/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(question),
    });
  },

  update: async (
    id: number,
    question: {
      text: string;
      imageUrl?: string;
      type: "SingleChoice" | "MultipleChoice" | "FreeText";
    }
  ): Promise<void> => {
    await fetch(`${API_URL}/api/questions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(question),
    });
  },

  delete: async (id: number): Promise<void> => {
    await fetch(`${API_URL}/api/questions/${id}`, {
      method: "DELETE",
    });
  },
};

export const resultApi = {
  getByQuizId: async (quizId: number): Promise<any> => {
    return fetchJson<any>(`${API_URL}/api/results/quiz/${quizId}`);
  },

  gradeTextResponse: async (
    responseId: number,
    isCorrect: boolean
  ): Promise<any> => {
    return fetchJson<any>(
      `${API_URL}/api/results/response/${responseId}/grade?isCorrect=${isCorrect}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );
  },

  exportPdf: async (quizId: number): Promise<Blob> => {
    const response = await fetch(
      `${API_URL}/api/results/quiz/${quizId}/export`
    );
    return await response.blob();
  },
};
