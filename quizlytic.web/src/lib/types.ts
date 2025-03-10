export enum QuizStatus {
    Created = 0,
    Active = 1,
    Paused = 2,
    Completed = 3
  }
  
  export enum QuestionType {
    SingleChoice = 0,
    MultipleChoice = 1,
    FreeText = 2
  }
  
  export interface Quiz {
    id: number;
    title: string;
    description: string;
    isPublic: boolean;
    createdAt: string;
    startedAt?: string;
    endedAt?: string;
    pinCode: string;
    qrCodeUrl: string;
    status: QuizStatus;
    questions: Question[];
    participants?: Participant[];
    questionsCount: number;
    publicId: string;
  }
  
  export interface Question {
    id: number;
    quizId: number;
    text: string;
    imageUrl?: string;
    type: QuestionType;
    orderIndex: number;
    answers: Answer[];
    hasResponses?: boolean;
  }
  
  export interface Answer {
    id: number;
    text: string;
    isCorrect: boolean;
  }
  
  export interface Participant {
    id: number;
    quizId: number;
    name: string;
    joinedAt: string;
    responses?: Response[];
  }
  
  export interface Response {
    id: number;
    questionId: number;
    answerId?: number;
    participantId: number;
    freeTextResponse?: string;
    submittedAt: string;
  }
  
  export interface QuizResult {
    quizId: number;
    quizTitle: string;
    participantsCount: number;
    questions: QuestionResult[];
  }
  
  export interface QuestionResult {
    questionId: number;
    questionText: string;
    responsesCount: number;
    answerDistribution: {
      answerId?: number;
      answerText: string;
      count: number;
      percentage: number;
    }[];
    freeTextResponses?: {
      participantName: string;
      response: string;
    }[];
  }