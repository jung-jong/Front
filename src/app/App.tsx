import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { LectureFilesProvider } from "./components/LectureFilesContext";
import { AuthProvider } from "./components/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <LectureFilesProvider>
        <RouterProvider router={router} />
      </LectureFilesProvider>
    </AuthProvider>
  );
}
