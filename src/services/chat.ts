import { api } from "@/lib/api";
import { getToken } from "@/lib/api";
import type { ChatMessage } from "@/types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function getChatHistory(courseId: string): Promise<ChatMessage[]> {
  return api.get<ChatMessage[]>(`/courses/${courseId}/chat`);
}

export async function sendMessage(
  courseId: string,
  content: string
): Promise<ChatMessage> {
  return api.post<ChatMessage>(`/courses/${courseId}/chat`, { content });
}

/**
 * 스트리밍 방식으로 AI 응답을 받는다.
 * onChunk: 텍스트 청크가 도착할 때마다 호출
 * onDone: 전체 응답 완료 후 최종 ChatMessage 반환
 */
export async function sendMessageStream(
  courseId: string,
  content: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<ChatMessage> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/courses/${courseId}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ content }),
    signal,
  });

  if (!res.ok || !res.body) {
    throw new Error("스트리밍 응답 오류");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    fullContent += chunk;
    onChunk(chunk);
  }

  return {
    id: `ai-${Date.now()}`,
    role: "ai",
    content: fullContent,
  };
}
