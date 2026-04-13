import { createContext, useContext, useState, useCallback } from "react";
import type { UploadedFile, UpdateFileMetaRequest } from "@/types";
import * as filesService from "@/services/files";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LectureFilesContextType {
  files: UploadedFile[];
  isLoading: boolean;
  error: string | null;
  /** isPublished=true AND week≠"" AND topic≠"" 3가지 조건을 모두 충족한 파일만 */
  publishedFiles: UploadedFile[];
  fetchFiles: (courseId: string) => Promise<void>;
  uploadFiles: (courseId: string, fileList: FileList) => Promise<void>;
  updateFileMeta: (courseId: string, fileId: string, req: UpdateFileMetaRequest) => Promise<void>;
  togglePublish: (courseId: string, fileId: string) => Promise<void>;
  deleteFile: (courseId: string, fileId: string) => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const LectureFilesContext = createContext<LectureFilesContextType | null>(null);

export function LectureFilesProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publishedFiles = files.filter(
    (f) => f.isPublished && f.week !== "" && f.topic !== ""
  );

  const fetchFiles = useCallback(async (courseId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await filesService.getFiles(courseId);
      setFiles(data);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "파일 목록을 불러오지 못했습니다.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadFiles = useCallback(async (courseId: string, fileList: FileList) => {
    const pdfs = Array.from(fileList).filter((f) => f.name.toLowerCase().endsWith(".pdf"));
    if (pdfs.length === 0) return;

    // 업로드 중인 파일을 먼저 낙관적으로 추가 (ragStatus: "indexing")
    const optimisticItems: UploadedFile[] = pdfs.map((file) => ({
      id: `uploading-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: file.name,
      size: file.size > 0 ? `${(file.size / 1024 / 1024).toFixed(1)}MB` : "—",
      uploadedAt: new Date().toISOString().split("T")[0],
      week: "",
      topic: "",
      isPublished: false,
      ragStatus: "indexing" as const,
    }));
    setFiles((prev) => [...optimisticItems, ...prev]);

    // 실제 업로드 후 서버 응답으로 교체
    const uploaded: UploadedFile[] = [];
    for (const file of pdfs) {
      try {
        const result = await filesService.uploadFile(courseId, file);
        uploaded.push(result);
      } catch {
        // 개별 파일 실패 시 해당 낙관적 항목 제거
        const failedName = file.name;
        setFiles((prev) => prev.filter((f) => !(f.id.startsWith("uploading-") && f.name === failedName)));
      }
    }

    if (uploaded.length > 0) {
      setFiles((prev) => {
        const withoutOptimistic = prev.filter((f) => !f.id.startsWith("uploading-"));
        return [...uploaded, ...withoutOptimistic];
      });
    }
  }, []);

  const updateFileMeta = useCallback(async (
    courseId: string,
    fileId: string,
    req: UpdateFileMetaRequest
  ) => {
    const updated = await filesService.updateFileMeta(courseId, fileId, req);
    setFiles((prev) => prev.map((f) => (f.id === fileId ? updated : f)));
  }, []);

  const togglePublish = useCallback(async (courseId: string, fileId: string) => {
    const target = files.find((f) => f.id === fileId);
    if (!target) return;
    const updated = await filesService.togglePublish(courseId, fileId, !target.isPublished);
    // 백엔드 응답에 week/topic 등 일부 필드가 빠질 수 있으므로 기존 데이터와 병합
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, ...updated } : f)));
  }, [files]);

  const deleteFile = useCallback(async (courseId: string, fileId: string) => {
    await filesService.deleteFile(courseId, fileId);
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  return (
    <LectureFilesContext.Provider value={{
      files,
      isLoading,
      error,
      publishedFiles,
      fetchFiles,
      uploadFiles,
      updateFileMeta,
      togglePublish,
      deleteFile,
    }}>
      {children}
    </LectureFilesContext.Provider>
  );
}

export function useLectureFiles(): LectureFilesContextType {
  const ctx = useContext(LectureFilesContext);
  if (!ctx) throw new Error("useLectureFiles must be used inside LectureFilesProvider");
  return ctx;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const WEEK_OPTIONS: string[] = [
  ...Array.from({ length: 16 }, (_, i) => `${i + 1}주차`),
  "특강",
  "보충",
  "기타",
];

/** 최신 공개 파일 기준으로 채팅 상단 요약 카드 데이터 생성 */
export function buildSummaryFromLatest(publishedFiles: UploadedFile[]): {
  title: string;
  bullets: string[];
  sources: string[];
} | null {
  if (publishedFiles.length === 0) return null;
  const sorted = [...publishedFiles].sort((a, b) =>
    a.uploadedAt > b.uploadedAt ? -1 : a.uploadedAt < b.uploadedAt ? 1 : 0
  );
  const latest = sorted[0];
  const weekFiles = publishedFiles.filter((f) => f.week === latest.week);
  return {
    title: `${latest.week} 강의 핵심 요약 — ${latest.topic}`,
    bullets: [
      `이번 주 주제: ${latest.topic}`,
      `업로드된 자료 ${weekFiles.length}개를 기반으로 답변합니다.`,
      "AI 조교는 전체 업로드 자료를 읽어 답변합니다 (주차 구분 없이).",
    ],
    sources: weekFiles.slice(0, 3).map((f) => f.name),
  };
}
