import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Users,
  Copy,
  ChevronRight,
  BookOpen,
  X,
  Check,
  Hash,
  Sparkles,
  CalendarDays,
  RefreshCw,
} from "lucide-react";
import { getMyCourses, createCourse } from "@/services/courses";
import { useAuth } from "./AuthContext";
import type { Course, ApiError } from "@/types";

export function InstructorCoursePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal form state
  const [courseName, setCourseName] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);

  // authCode 미리보기 (실제 코드는 서버에서 생성하지만, UI에 임시로 표시)
  const [previewCode, setPreviewCode] = useState("");

  const generatePreviewCode = () =>
    Array.from({ length: 8 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]).join("");

  useEffect(() => {
    getMyCourses()
      .then(setCourses)
      .catch(() => setCourses([]))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = async () => {
    setFormError("");
    if (!courseName.trim()) {
      setFormError("과목명을 입력해주세요.");
      return;
    }
    setCreating(true);
    try {
      const newCourse = await createCourse({ name: courseName, description: courseDesc });
      setCourses((prev) => [newCourse, ...prev]);
      setShowModal(false);
      setCourseName("");
      setCourseDesc("");
      navigate(`/instructor?new=true&name=${encodeURIComponent(newCourse.name)}&courseId=${newCourse.id}`);
    } catch (err) {
      const apiErr = err as ApiError;
      setFormError(apiErr.message ?? "강의 개설에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  };

  const openModal = () => {
    setPreviewCode(generatePreviewCode());
    setCourseName("");
    setCourseDesc("");
    setFormError("");
    setShowModal(true);
  };

  const displayName = user?.name ?? "교강사";
  const nameInitial = displayName.charAt(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071f1f] via-[#0a3333] to-[#0d4545] flex flex-col relative overflow-hidden">
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full bg-[#37b1b1]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-80px] right-[-60px] w-[350px] h-[350px] rounded-full bg-[#37b1b1]/8 blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center gap-4 px-8 py-4 border-b border-white/10">
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} />홈
        </button>
        <div className="w-px h-5 bg-white/20" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#37b1b1] flex items-center justify-center">
            <span className="text-white text-xs" style={{ fontWeight: 700 }}>CT</span>
          </div>
          <span className="text-white text-sm" style={{ fontWeight: 600 }}>Custom-TA</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <div className="w-7 h-7 rounded-full bg-[#37b1b1]/30 border border-[#37b1b1]/50 flex items-center justify-center text-[#37b1b1] text-xs" style={{ fontWeight: 600 }}>
              {nameInitial}
            </div>
            {displayName}
          </div>
          <button
            onClick={() => logout().then(() => navigate("/"))}
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 px-8 py-10 max-w-5xl mx-auto w-full">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 bg-[#37b1b1]/20 border border-[#37b1b1]/30 rounded-full px-3 py-1">
                <Sparkles size={12} className="text-[#37b1b1]" />
                <span className="text-[#37b1b1] text-xs" style={{ fontWeight: 600 }}>교강사 포털</span>
              </div>
            </div>
            <h1 className="text-white text-2xl" style={{ fontWeight: 700 }}>내 강의 목록</h1>
            <p className="text-white/50 text-sm mt-1">강의를 선택해 대시보드로 이동하거나 새 강의를 개설하세요.</p>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 bg-[#37b1b1] hover:bg-[#2a9090] text-white rounded-xl px-5 py-2.5 text-sm transition-colors shadow-lg shadow-[#37b1b1]/20"
            style={{ fontWeight: 600 }}
          >
            <Plus size={16} />새 강의 개설
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-white/40">
            <Sparkles size={20} className="animate-pulse" />
            <span>강의 목록 불러오는 중...</span>
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#37b1b1]/20 flex items-center justify-center mb-4">
              <BookOpen size={28} className="text-[#37b1b1]" />
            </div>
            <p className="text-white/70 mb-2" style={{ fontWeight: 600 }}>아직 개설한 강의가 없습니다.</p>
            <p className="text-white/40 text-sm mb-6">새 강의를 개설하고 AI 조교를 설정해보세요.</p>
            <button onClick={openModal} className="flex items-center gap-2 bg-[#37b1b1] text-white rounded-xl px-5 py-2.5 text-sm hover:bg-[#2a9090] transition-colors" style={{ fontWeight: 600 }}>
              <Plus size={15} />첫 강의 개설하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-6 flex flex-col gap-4 hover:bg-white/15 hover:border-[#37b1b1]/40 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      {!course.hasData && (
                        <span className="text-xs bg-[#37b1b1]/20 text-[#37b1b1] border border-[#37b1b1]/30 rounded-full px-2 py-0.5" style={{ fontWeight: 600 }}>신규</span>
                      )}
                    </div>
                    <h2 className="text-white" style={{ fontWeight: 700, fontSize: "1.05rem" }}>{course.name}</h2>
                    {course.description && (
                      <p className="text-white/50 text-sm mt-0.5">{course.description}</p>
                    )}
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-[#37b1b1]/20 flex items-center justify-center flex-shrink-0">
                    <BookOpen size={20} className="text-[#37b1b1]" />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-white/60 text-xs">
                    <Users size={12} />
                    <span>{course.studentCount}명 수강 중</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/60 text-xs">
                    <CalendarDays size={12} />
                    <span>{course.createdAt} 개설</span>
                  </div>
                </div>

                <div className="bg-white/8 border border-white/15 rounded-xl px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-white/40 text-xs mb-0.5">학생 인증 코드</p>
                    <p className="text-white tracking-widest text-sm" style={{ fontWeight: 700 }}>{course.authCode}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(course.authCode, course.id)}
                    className="flex items-center gap-1.5 text-xs text-white/60 hover:text-[#37b1b1] transition-colors"
                  >
                    {copiedId === course.id ? (
                      <><Check size={13} className="text-green-400" /><span className="text-green-400">복사됨</span></>
                    ) : (
                      <><Copy size={13} />복사</>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => navigate(`/instructor?name=${encodeURIComponent(course.name)}&courseId=${course.id}&new=${!course.hasData}`)}
                  className="w-full flex items-center justify-center gap-2 bg-[#37b1b1] hover:bg-[#2a9090] text-white rounded-xl py-2.5 text-sm transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  대시보드 입장
                  <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Course Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-gray-900" style={{ fontWeight: 700 }}>새 강의 개설</h2>
                <p className="text-sm text-gray-400">강의를 개설하면 학생 인증 코드가 자동 생성됩니다.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5" style={{ fontWeight: 500 }}>과목명 *</label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="예: 객체지향 프로그래밍"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#37b1b1] focus:ring-1 focus:ring-[#37b1b1]/30 transition-all placeholder:text-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1.5" style={{ fontWeight: 500 }}>강의 설명 (선택)</label>
                <input
                  type="text"
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  placeholder="예: Java 기반 OOP 핵심 개념 및 설계 패턴"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#37b1b1] focus:ring-1 focus:ring-[#37b1b1]/30 transition-all placeholder:text-gray-300"
                />
              </div>

              {/* 인증 코드 미리보기 (실제 코드는 서버에서 생성) */}
              <div>
                <label className="block text-sm text-gray-600 mb-1.5" style={{ fontWeight: 500 }}>
                  <span className="flex items-center gap-1.5">
                    <Hash size={13} />학생 인증 코드 (개설 후 자동 생성)
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#f0fdfd] border border-[#b3e5e5] rounded-xl px-4 py-2.5 flex items-center justify-between">
                    <span className="text-[#1d6e6e]/50 tracking-[0.2em] text-sm" style={{ fontWeight: 700 }}>
                      {previewCode}
                    </span>
                    <span className="text-xs text-gray-400">미리보기</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewCode(generatePreviewCode())}
                    title="미리보기 갱신"
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-[#e0f7f7] text-gray-500 hover:text-[#37b1b1] flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <RefreshCw size={15} />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">실제 인증 코드는 강의 개설 후 서버에서 생성됩니다.</p>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <p className="text-xs text-red-600">{formError}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <button onClick={() => setShowModal(false)} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">취소</button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-2 bg-[#37b1b1] hover:bg-[#2a9090] disabled:opacity-60 text-white rounded-xl px-5 py-2.5 text-sm transition-colors"
                style={{ fontWeight: 600 }}
              >
                <BookOpen size={15} />{creating ? "개설 중..." : "강의 개설하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
