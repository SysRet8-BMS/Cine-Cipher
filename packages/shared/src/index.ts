export type ClueType = 'text' | 'image' | 'audio' | 'story';

export interface Question {
  id: string;
  clueType: ClueType;
  clueData: string;
  category: string;
}

export interface Score {
  userId: string;
  points: number;
  streak: number;
}

export interface QuestionResponse {
  questionId: string;
  clueType: ClueType;
  clueData: string;
}

export interface AnswerRequest {
  questionId: string;
  userAnswer: string;
  userId: string;
}

export interface AnswerResponse {
  isCorrect: boolean;
  newScore: number;
  newStreak: number;
}

export interface LeaderboardEntry {
  userId: string;
  points: number;
  streak: number;
}