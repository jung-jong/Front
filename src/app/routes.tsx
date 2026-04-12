import { createBrowserRouter } from "react-router-dom";
import { LandingPage } from "./components/LandingPage";
import { AuthPage } from "./components/AuthPage";
import { CodeEntryPage } from "./components/CodeEntryPage";
import { StudentWorkspace } from "./components/StudentWorkspace";
import { InstructorCoursePage } from "./components/InstructorCoursePage";
import { InstructorDashboard } from "./components/InstructorDashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  { path: "/", Component: LandingPage },
  { path: "/auth", Component: AuthPage },
  {
    path: "/student/code",
    element: (
      <ProtectedRoute role="student">
        <CodeEntryPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student",
    element: (
      <ProtectedRoute role="student">
        <StudentWorkspace />
      </ProtectedRoute>
    ),
  },
  {
    path: "/instructor/courses",
    element: (
      <ProtectedRoute role="instructor">
        <InstructorCoursePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/instructor",
    element: (
      <ProtectedRoute role="instructor">
        <InstructorDashboard />
      </ProtectedRoute>
    ),
  },
]);
