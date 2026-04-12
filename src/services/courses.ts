import { api } from "@/lib/api";
import type { Course, CreateCourseRequest, JoinCourseRequest } from "@/types";

export async function getMyCourses(): Promise<Course[]> {
  return api.get<Course[]>("/courses/me");
}

export async function getCourse(courseId: string): Promise<Course> {
  return api.get<Course>(`/courses/${courseId}`);
}

export async function createCourse(req: CreateCourseRequest): Promise<Course> {
  return api.post<Course>("/courses", req);
}

export async function joinCourse(req: JoinCourseRequest): Promise<Course> {
  return api.post<Course>("/courses/join", req);
}

export async function deleteCourse(courseId: string): Promise<void> {
  return api.delete<void>(`/courses/${courseId}`);
}
