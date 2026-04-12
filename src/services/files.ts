import { api, uploadRequest } from "@/lib/api";
import type { UploadedFile, UpdateFileMetaRequest } from "@/types";

export async function getFiles(courseId: string): Promise<UploadedFile[]> {
  return api.get<UploadedFile[]>(`/courses/${courseId}/files`);
}

export async function uploadFile(courseId: string, file: File): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append("file", file);
  return uploadRequest<UploadedFile>(`/courses/${courseId}/files`, formData);
}

export async function updateFileMeta(
  courseId: string,
  fileId: string,
  req: UpdateFileMetaRequest
): Promise<UploadedFile> {
  return api.patch<UploadedFile>(`/courses/${courseId}/files/${fileId}`, req);
}

export async function togglePublish(
  courseId: string,
  fileId: string,
  isPublished: boolean
): Promise<UploadedFile> {
  return api.patch<UploadedFile>(`/courses/${courseId}/files/${fileId}/publish`, { isPublished });
}

export async function deleteFile(courseId: string, fileId: string): Promise<void> {
  return api.delete<void>(`/courses/${courseId}/files/${fileId}`);
}
