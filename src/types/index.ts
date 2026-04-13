// ─── Auth ─────────────────────────────────────────────────────────────────────

export type Role = "student" | "instructor";
export type AuthMode = "login" | "signup";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
  role: Role;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

// ─── Course ───────────────────────────────────────────────────────────────────

export interface Course {
  id: string;
  name: string;
  description: string;
  studentCount: number;
  authCode: string;
  createdAt: string;
  hasData: boolean;
  instructorName?: string;
  semester?: string;
}

export interface CreateCourseRequest {
  name: string;
  description: string;
}

export interface JoinCourseRequest {
  code: string;
}

// ─── Lecture Files ────────────────────────────────────────────────────────────

export interface UploadedFile {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  week: string;
  topic: string;
  isPublished: boolean;
  ragStatus: "indexing" | "ready";
  url?: string;
}

export interface UpdateFileMetaRequest {
  week: string;
  topic: string;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "ai" | "user";
  content: string;
  sources?: string[];
  quiz?: {
    question: string;
    options: string[];
    answer: number;
  } | null;
  isSummary?: boolean;
}

export interface SendMessageRequest {
  courseId: string;
  content: string;
}

export interface SendMessageResponse {
  message: ChatMessage;
}

// ─── Quest ────────────────────────────────────────────────────────────────────

export type QuestSource = "ai" | "manual";
export type QuestStatus = "pending" | "sent";
export type QuestDifficulty = "쉬움" | "보통" | "어려움";

export interface Quest {
  id: string;
  title: string;
  scope: string;
  difficulty: QuestDifficulty;
  questionCount: number;
  targetGroup: string;
  status: QuestStatus;
  previewContent?: string;
  source: QuestSource;
  deadline?: string;
  xp?: number;
  description?: string;
  type?: "ai" | "professor";
  completed?: boolean;
}

export interface QuestQuestion {
  id: string;
  type: "ox" | "multiple" | "short";
  question: string;
  options?: string[];
  answer?: number | boolean;
  hint?: string;
}

export interface QuestContent {
  intro: string;
  questions: QuestQuestion[];
}

export interface CreateQuestRequest {
  title: string;
  scope: string;
  difficulty: QuestDifficulty;
  questionCount: number;
  targetGroup: string;
  deadline?: string;
  xp?: number;
  description?: string;
  questions?: {
    type: "multiple";
    question: string;
    options: string[];
    answer: number;
  }[];
}

export interface AiDraftRequest {
  scope: string;
  difficulty: QuestDifficulty;
  questionCount: number;
  optionCount: number;
  targetGroup: string;
  xp?: number;
  description?: string;
}

export interface AiDraftQuestion {
  type: "multiple";
  question: string;
  options: string[];
  answer: number;
}

export interface AiDraftResponse {
  questions: AiDraftQuestion[];
}

// ─── Notification ─────────────────────────────────────────────────────────────

export type NotificationType = "message" | "quest" | "quiz";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  from: string;
  time: string;
  read: boolean;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface KpiData {
  studentCount: number;
  weeklyQuestionCount: number;
  weeklyQuestionDelta: number;
  avgEngagementRate: number;
  avgQuestAnswerRate: number;
  gradeBreakdown: { name: string; value: number; color: string }[];
}

export interface KeywordStat {
  keyword: string;
  count: number;
}

export interface WeakPoint {
  id: string;
  keyword: string;
  wrongCount: number;
  lastWrong: string;
  summary: string;
  material: string;
}

export interface AiProposal {
  id: string;
  title: string;
  targetGroup: string;
  evidence: string;
  content: string;
}

// ─── AI Config ────────────────────────────────────────────────────────────────

export interface AiConfig {
  guidePrompt: string;
}

// ─── API Shared ───────────────────────────────────────────────────────────────

export interface ApiError {
  status: number;
  message: string;
}
