export interface User {
  id: string;
  username: string;
  name: string;
  notes?: string;
  role: "user" | "admin";
  status: "active" | "blocked" | "restricted";
  restrictionReason?: string;
  isOnline: boolean;
  lastActive: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  createdBy?: string;
  created_at: string;
  updated_at: string;
  last_login?: string | null;
  created_by?: string | null;
  deviceInfo: {
    browser: string;
    os: string;
    deviceType: string;
    loginTime: string;
  };
}

export interface ExplanationSection {
  id: string;
  title: string;
  summary: string;
  concepts: { term: string; definition: string }[];
  content: string; // The detailed explanation markdown
  example?: string;
}

export interface DocumentUpload {
  id: string;
  title: string;
  content: string;
  sections: ExplanationSection[];
  quiz?: QuizQuestion[];
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  type: "multiple-choice" | "true-false" | "short-answer";
  question: string;
  options?: string[]; // for multiple-choice
  correctAnswer: string; // answer string or "True"/"False"
  explanation: string; // AI Teacher explanation why it's correct
  topic: string;
}

export interface QuizProgress {
  sessionId: string;
  documentId: string;
  questions: QuizQuestion[];
  answers: { [questionId: string]: string }; // User's selected/typed answers
  currentIndex: number;
  completed: boolean;
  score: number;
  lastUpdated: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string; // "Upload text", "Start explanation", "Quiz started", etc.
  details: string;
  timestamp: string;
  device: string;
  browser: string;
  os: string;
}

export interface AdminReviewFlag {
  id: string;
  userId: string;
  userName: string;
  action: string;
  reason: string; // e.g., "AI-generated style detected" or "Extremely fast quiz answers"
  timestamp: string;
  status: "pending" | "resolved_cleared" | "resolved_blocked" | "resolved_restricted";
  details: string;
}

export interface SystemStats {
  onlineUsers: number;
  offlineUsers: number;
  activeSessions: number;
  uploadedTexts: number;
  aiExplanationsCount: number;
  quizSessions: number;
  totalQuestionsAnswered: number;
  correctAnswersCount: number;
  incorrectAnswersCount: number;
  averageLearningTime: number; // in minutes
}

export interface VoiceSettings {
  voiceType: "male" | "female";
}

export interface WallpaperSettings {
  activeWallpaper: string; // URL, CSS color, or base64
  wallpaperType: "color" | "image" | "video";
}

export interface LearningSession {
  id: string;
  document: DocumentUpload;
  quizProgress: QuizProgress;
  date: string;
}
