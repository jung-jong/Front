import { useNavigate } from "react-router-dom";
import { BookOpen, GraduationCap, ChevronRight, Brain, Clock, BarChart2, Send, Sparkles } from "lucide-react";

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071f1f] via-[#0a3535] to-[#0f5050] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-120px] left-[-120px] w-[500px] h-[500px] rounded-full bg-[#37b1b1]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-80px] w-[400px] h-[400px] rounded-full bg-[#37b1b1]/8 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-[#37b1b1]/5 blur-3xl pointer-events-none" />

      {/* Logo & Headline */}
      <div className="text-center mb-12 z-10">
        <div className="inline-flex items-center gap-2 bg-[#37b1b1]/20 border border-[#37b1b1]/30 rounded-full px-4 py-1.5 mb-6">
          <Sparkles size={14} className="text-[#37b1b1]" />
          <span className="text-[#37b1b1] text-sm">강의 전용 AI 조교 플랫폼</span>
        </div>
        <h1 className="text-5xl text-white mb-3" style={{ fontWeight: 700, lineHeight: 1.2 }}>
          Custom-TA
        </h1>
        <p className="text-white/60 text-lg max-w-md mx-auto leading-relaxed">
          오직 당신의 강의만을 위해 맞춰진<br />
          <span className="text-white" style={{ fontWeight: 600 }}>단 하나의 AI 조교</span>
        </p>
      </div>

      {/* Entry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl z-10 mb-12">
        {/* Student */}
        <button
          onClick={() => navigate("/auth?role=student")}
          className="group bg-white/8 backdrop-blur-sm border border-white/15 rounded-2xl p-8 text-left hover:bg-white/12 hover:border-[#37b1b1]/50 transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="w-14 h-14 rounded-2xl bg-[#37b1b1]/25 flex items-center justify-center">
              <GraduationCap size={28} className="text-[#37b1b1]" />
            </div>
            <ChevronRight size={20} className="text-white/30 group-hover:text-[#37b1b1] group-hover:translate-x-1 transition-all" />
          </div>
          <h2 className="text-white mb-2" style={{ fontWeight: 600, fontSize: "1.25rem" }}>수강생으로 입장하기</h2>
          <p className="text-white/50 text-sm leading-relaxed mb-5">
            인증 코드를 입력하고 강의 전용 AI 조교와 함께 학습하세요.
          </p>
          <ul className="space-y-2">
            {["강의 전용 AI 조교와 1:1 학습", "인증 코드 입력 → 워크스페이스 입장", "맞춤 퀘스트 / AI 오답노트 / 강의 자료"].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-white/50">
                <span className="w-1.5 h-1.5 rounded-full bg-[#37b1b1] flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </button>

        {/* Instructor */}
        <button
          onClick={() => navigate("/auth?role=instructor")}
          className="group bg-white/8 backdrop-blur-sm border border-white/15 rounded-2xl p-8 text-left hover:bg-white/12 hover:border-[#37b1b1]/40 transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="w-14 h-14 rounded-2xl bg-[#37b1b1]/20 flex items-center justify-center">
              <BookOpen size={28} className="text-[#37b1b1]/80" />
            </div>
            <ChevronRight size={20} className="text-white/30 group-hover:text-[#37b1b1]/80 group-hover:translate-x-1 transition-all" />
          </div>
          <h2 className="text-white mb-2" style={{ fontWeight: 600, fontSize: "1.25rem" }}>교강사로 입장하기</h2>
          <p className="text-white/50 text-sm leading-relaxed mb-5">
            강의 자료를 업로드하고, AI 조교를 세팅하고, 학생들의 학습 데이터를 분석하세요.
          </p>
          <ul className="space-y-2">
            {["강의 자료 업로드 & AI 조교 세팅", "강의 개설 및 인증 코드 생성", "학생 분석 대시보드 & 퀘스트 발송"].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-white/50">
                <span className="w-1.5 h-1.5 rounded-full bg-[#37b1b1]/70 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </button>
      </div>

      {/* Feature Chips */}
      <div className="flex flex-wrap gap-3 justify-center z-10">
        {[
          { icon: Brain, label: "RAG 기반 강의 맞춤 답변" },
          { icon: Clock, label: "에빙하우스 복습 알림" },
          { icon: BarChart2, label: "실시간 학습 분석" },
          { icon: Send, label: "원클릭 퀘스트 발송" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 bg-white/6 border border-white/12 rounded-full px-4 py-2">
            <Icon size={14} className="text-[#37b1b1]" />
            <span className="text-white/55 text-sm">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
