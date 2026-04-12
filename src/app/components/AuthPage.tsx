import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  GraduationCap,
  BookOpen,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import type { AuthMode, Role, ApiError } from "@/types";

export function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get("role") as Role) ?? "student";

  const { login, signup } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [role, setRole] = useState<Role>(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const primaryColor = role === "student" ? "#37b1b1" : "#2a9090";
  const focusClasses = "focus:border-[#37b1b1] focus:ring-1 focus:ring-[#37b1b1]/30";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "signup") {
      if (!name.trim()) { setError("이름을 입력해주세요."); return; }
      if (!email.trim()) { setError("이메일을 입력해주세요."); return; }
      if (password.length < 6) { setError("비밀번호는 6자 이상이어야 합니다."); return; }
      if (password !== confirmPassword) { setError("비밀번호가 일치하지 않습니다."); return; }
    } else {
      if (!email.trim()) { setError("이메일을 입력해주세요."); return; }
      if (!password) { setError("비밀번호를 입력해주세요."); return; }
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login({ email, password, role });
      } else {
        await signup({ name, email, password, role });
      }
      if (role === "student") {
        navigate("/student/code");
      } else {
        navigate("/instructor/courses");
      }
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071f1f] via-[#0a3333] to-[#0d4545] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full bg-[#37b1b1]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-80px] right-[-60px] w-[350px] h-[350px] rounded-full bg-[#37b1b1]/8 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6 text-sm"
        >
          <ArrowLeft size={16} />홈으로 돌아가기
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#37b1b1]/20 border border-[#37b1b1]/30 rounded-full px-4 py-1.5 mb-4">
            <Sparkles size={13} className="text-[#37b1b1]" />
            <span className="text-[#37b1b1] text-sm">Custom-TA</span>
          </div>
          <h1 className="text-2xl text-white" style={{ fontWeight: 700 }}>
            {mode === "login" ? "로그인" : "회원가입"}
          </h1>
          <p className="text-white/50 text-sm mt-1">
            {mode === "login" ? "계정에 로그인하여 학습을 시작하세요." : "Custom-TA 계정을 만들어보세요."}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Mode toggle */}
          <div className="flex border-b border-gray-100">
            {(["login", "signup"] as AuthMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-3.5 text-sm transition-colors ${mode === m ? "text-[#1d6e6e] bg-[#f0fdfd]" : "text-gray-400 hover:text-gray-600"}`}
                style={{ fontWeight: mode === m ? 600 : 400 }}
              >
                {m === "login" ? "로그인" : "회원가입"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Role selector */}
            <div>
              <p className="text-sm text-gray-600 mb-2" style={{ fontWeight: 500 }}>
                {mode === "signup" ? "가입 유형 선택" : "입장 유형"}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { key: "student", Icon: GraduationCap, label: "수강생", sub: "학습하기" },
                  { key: "instructor", Icon: BookOpen, label: "교강사", sub: "강의 관리" },
                ] as { key: Role; Icon: typeof GraduationCap; label: string; sub: string }[]).map(({ key, Icon, label, sub }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setRole(key)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${role === key ? "border-[#37b1b1] bg-[#f0fdfd]" : "border-gray-100 hover:border-gray-200"}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${role === key ? "bg-[#37b1b1]" : "bg-gray-100"}`}>
                      <Icon size={16} className={role === key ? "text-white" : "text-gray-400"} />
                    </div>
                    <div>
                      <p className={`text-sm ${role === key ? "text-[#1d6e6e]" : "text-gray-600"}`} style={{ fontWeight: 600 }}>{label}</p>
                      <p className="text-xs text-gray-400">{sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Name — signup only */}
            {mode === "signup" && (
              <div>
                <label className="block text-sm text-gray-600 mb-1.5" style={{ fontWeight: 500 }}>이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === "student" ? "홍길동" : "박준혁"}
                  className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none transition-all placeholder:text-gray-300 ${focusClasses}`}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm text-gray-600 mb-1.5" style={{ fontWeight: 500 }}>이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@university.ac.kr"
                className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none transition-all placeholder:text-gray-300 ${focusClasses}`}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-gray-600 mb-1.5" style={{ fontWeight: 500 }}>비밀번호</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "6자 이상 입력" : "비밀번호 입력"}
                  className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-700 outline-none transition-all placeholder:text-gray-300 ${focusClasses}`}
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm password — signup only */}
            {mode === "signup" && (
              <div>
                <label className="block text-sm text-gray-600 mb-1.5" style={{ fontWeight: 500 }}>비밀번호 확인</label>
                <div className="relative">
                  <input
                    type={showCPw ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="동일하게 입력"
                    className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-700 outline-none transition-all placeholder:text-gray-300 ${focusClasses}`}
                  />
                  <button type="button" onClick={() => setShowCPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {confirmPassword && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <CheckCircle size={12} className={password === confirmPassword ? "text-green-500" : "text-gray-300"} />
                    <span className={`text-xs ${password === confirmPassword ? "text-green-600" : "text-gray-400"}`}>
                      {password === confirmPassword ? "비밀번호 일치" : "비밀번호 불일치"}
                    </span>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm text-white transition-all disabled:opacity-60"
              style={{ fontWeight: 600, background: loading ? "#7fd9d9" : primaryColor }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#2a9090"; }}
              onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = primaryColor; }}
            >
              {loading
                ? "처리 중..."
                : mode === "login"
                ? `${role === "student" ? "수강생" : "교강사"}으로 로그인`
                : "계정 만들기"}
            </button>

            <p className="text-center text-sm text-gray-400">
              {mode === "login" ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}{" "}
              <button
                type="button"
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
                className="text-[#37b1b1] hover:text-[#1d6e6e] transition-colors"
                style={{ fontWeight: 600 }}
              >
                {mode === "login" ? "회원가입" : "로그인"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
