import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Hash, ChevronRight, ShieldCheck } from "lucide-react";
import { getMyCourses, joinCourse } from "@/services/courses";
import type { Course, ApiError } from "@/types";

export function CodeEntryPage() {
  const navigate = useNavigate();
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getMyCourses()
      .then(setCourses)
      .catch(() => setCourses([]))
      .finally(() => setCoursesLoading(false));
  }, []);

  const enterCourse = async (code: string) => {
    setError("");
    setLoading(true);
    try {
      const course = await joinCourse({ code });
      navigate(`/student?courseId=${course.id}`);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "유효하지 않은 인증 코드입니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeInput.trim().length < 4) {
      setError("올바른 인증 코드를 입력해주세요.");
      return;
    }
    enterCourse(codeInput.trim());
  };

  const handleQuickJoin = (code: string) => {
    setCodeInput(code);
    setError("");
    enterCourse(code);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071f1f] via-[#0a3333] to-[#0d4545] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full bg-[#37b1b1]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-80px] right-[-60px] w-[350px] h-[350px] rounded-full bg-[#37b1b1]/8 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <button
          onClick={() => navigate(-1 as never)}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6 text-sm"
        >
          <ArrowLeft size={16} />이전으로
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#37b1b1]/20 border border-[#37b1b1]/30 rounded-full px-4 py-1.5 mb-4">
            <ShieldCheck size={13} className="text-[#37b1b1]" />
            <span className="text-[#37b1b1] text-sm">인증 코드 입력</span>
          </div>
          <h1 className="text-2xl text-white" style={{ fontWeight: 700 }}>강의 워크스페이스 입장</h1>
          <p className="text-white/50 text-sm mt-1">교수님께 받은 <span className="text-[#37b1b1]" style={{ fontWeight: 600 }}>인증 코드</span>를 입력하세요.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Code Input */}
          <form onSubmit={handleSubmit} className="p-6">
            <label className="block text-sm text-gray-600 mb-2" style={{ fontWeight: 500 }}>학생 인증 코드</label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 focus-within:border-[#37b1b1] focus-within:ring-1 focus-within:ring-[#37b1b1]/30 transition-all">
                <Hash size={16} className="text-gray-300 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={codeInput}
                  onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setError(""); }}
                  placeholder="예: OOP826TK"
                  maxLength={12}
                  className="flex-1 text-sm text-gray-700 outline-none placeholder:text-gray-300 tracking-widest bg-transparent"
                  style={{ fontWeight: codeInput ? 600 : 400 }}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !codeInput.trim()}
                className="px-5 py-2.5 text-white rounded-xl text-sm transition-colors flex-shrink-0 disabled:opacity-50"
                style={{ fontWeight: 600, background: "#37b1b1" }}
              >
                {loading ? "입장 중..." : "입장"}
              </button>
            </div>
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
              <ShieldCheck size={11} className="text-[#37b1b1]" />
              인증 코드는 교수님 또는 수업 운영진에게 문의하세요.
            </p>
          </form>

          <div className="flex items-center gap-3 px-6 pb-2">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-300">또는 참여 중인 수업</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <div className="p-6 pt-3 space-y-2">
            <p className="text-xs text-gray-400 mb-3" style={{ fontWeight: 500 }}>현재 등록된 수업</p>

            {coursesLoading && (
              <div className="flex items-center gap-2 py-4 text-gray-300">
                <Sparkles size={14} className="animate-pulse" />
                <span className="text-sm">수업 목록 불러오는 중...</span>
              </div>
            )}

            {!coursesLoading && courses.length === 0 && (
              <p className="text-sm text-gray-300 py-4 text-center">등록된 수업이 없습니다.</p>
            )}

            {courses.map((course) => (
              <button
                key={course.id}
                onClick={() => handleQuickJoin(course.authCode)}
                disabled={loading}
                className="w-full flex items-center gap-3 p-3.5 border border-gray-100 rounded-xl hover:border-[#37b1b1]/40 hover:bg-[#f0fdfd] transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#e0f7f7] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#1d6e6e] text-xs" style={{ fontWeight: 700 }}>{course.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate" style={{ fontWeight: 600 }}>{course.name}</p>
                  <p className="text-xs text-gray-400">
                    {course.instructorName && `${course.instructorName} · `}{course.semester ?? ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">#{course.authCode}</span>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-[#37b1b1] transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
