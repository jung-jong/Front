import { api } from "@/lib/api";
import type {
  KpiData,
  KeywordStat,
  WeakPoint,
  AiProposal,
  Notification,
  AiConfig,
} from "@/types";

// ─── 교강사: 수강생 분석 ──────────────────────────────────────────────────────

export async function getAnalytics(courseId: string): Promise<KpiData> {
  return api.get<KpiData>(`/courses/${courseId}/analytics`);
}

export async function getKeywordStats(
  courseId: string,
  week: string
): Promise<KeywordStat[]> {
  return api.get<KeywordStat[]>(`/courses/${courseId}/analytics/keywords?week=${encodeURIComponent(week)}`);
}

export async function getAiProposals(courseId: string): Promise<AiProposal[]> {
  return api.get<AiProposal[]>(`/courses/${courseId}/ai-proposals`);
}

// ─── AI 조교 설정 ─────────────────────────────────────────────────────────────

export async function getAiConfig(courseId: string): Promise<AiConfig> {
  return api.get<AiConfig>(`/courses/${courseId}/ai-config`);
}

export async function saveAiConfig(courseId: string, config: AiConfig): Promise<AiConfig> {
  return api.put<AiConfig>(`/courses/${courseId}/ai-config`, config);
}

// ─── 수강생: 개인 학습 데이터 ─────────────────────────────────────────────────

export async function getMyWeakPoints(courseId: string): Promise<WeakPoint[]> {
  return api.get<WeakPoint[]>(`/courses/${courseId}/me/weak-points`);
}

export async function getMyStats(courseId: string): Promise<{
  questionCount: number;
  quizAccuracy: number;
  completedQuests: number;
  totalQuests: number;
  grade: string;
  xp: number;
  xpToNext: number;
}> {
  return api.get(`/courses/${courseId}/me/stats`);
}

// ─── 알림 ─────────────────────────────────────────────────────────────────────

export async function getNotifications(courseId: string): Promise<Notification[]> {
  return api.get<Notification[]>(`/courses/${courseId}/notifications`);
}

export async function markNotificationRead(
  courseId: string,
  notificationId: string
): Promise<void> {
  return api.patch<void>(`/courses/${courseId}/notifications/${notificationId}/read`);
}

export async function markAllNotificationsRead(courseId: string): Promise<void> {
  return api.patch<void>(`/courses/${courseId}/notifications/read-all`);
}
