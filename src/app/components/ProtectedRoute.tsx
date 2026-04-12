import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { Role } from "@/types";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  role?: Role;
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#071f1f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#37b1b1] flex items-center justify-center">
            <span className="text-white text-sm font-bold">CT</span>
          </div>
          <p className="text-white/50 text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
