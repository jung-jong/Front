import { api } from "@/lib/api";
import type { Quest, QuestContent, CreateQuestRequest } from "@/types";

export async function getQuests(courseId: string): Promise<Quest[]> {
  return api.get<Quest[]>(`/courses/${courseId}/quests`);
}

export async function getQuestContent(courseId: string, questId: string): Promise<QuestContent> {
  return api.get<QuestContent>(`/courses/${courseId}/quests/${questId}/content`);
}

export async function createQuest(
  courseId: string,
  req: CreateQuestRequest
): Promise<Quest> {
  return api.post<Quest>(`/courses/${courseId}/quests`, req);
}

export async function updateQuest(
  courseId: string,
  questId: string,
  req: Partial<CreateQuestRequest>
): Promise<Quest> {
  return api.put<Quest>(`/courses/${courseId}/quests/${questId}`, req);
}

export async function sendQuest(courseId: string, questId: string): Promise<Quest> {
  return api.post<Quest>(`/courses/${courseId}/quests/${questId}/send`);
}

export async function deleteQuest(courseId: string, questId: string): Promise<void> {
  return api.delete<void>(`/courses/${courseId}/quests/${questId}`);
}

export async function submitQuestAnswers(
  courseId: string,
  questId: string,
  answers: Record<string, number | boolean | string>
): Promise<{ score: number; total: number; xpEarned: number }> {
  return api.post(`/courses/${courseId}/quests/${questId}/submit`, { answers });
}
