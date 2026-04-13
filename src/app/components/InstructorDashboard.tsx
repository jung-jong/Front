import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  BookOpen,
  X,
  CheckCircle,
  Edit3,
  Send,
  Eye,
  ChevronDown,
  Save,
  Users,
  MessageSquare,
  BarChart2,
  Award,
  AlertCircle,
  Trash2,
  Plus,
  FileText,
  Sparkles,
  Calendar,
  Zap,
  Target,
  Info,
  Loader2,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  useLectureFiles,
  WEEK_OPTIONS,
} from "./LectureFilesContext";
import { useAuth } from "./AuthContext";
import {
  getAnalytics,
  getKeywordStats,
  getAiProposals,
  getAiConfig,
  saveAiConfig,
} from "@/services/students";
import {
  getQuests,
  getQuestContent,
  createQuest,
  updateQuest,
  sendQuest as apiSendQuest,
  deleteQuest as apiDeleteQuest,
  generateAiDraft,
} from "@/services/quests";
import type {
  Quest,
  AiProposal,
  KpiData,
  KeywordStat,
  UploadedFile,
  QuestDifficulty,
  AiDraftRequest,
  ApiError,
} from "@/types";

// ─── 상수 ─────────────────────────────────────────────────────────────────────

const difficultyColor: Record<string, string> = {
  쉬움: "bg-green-100 text-green-700",
  보통: "bg-yellow-100 text-yellow-700",
  어려움: "bg-red-100 text-red-700",
};

// ─── Create Quest Modal ───────────────────────────────────────────────────────

interface MCQuestion {
  question: string;
  options: string[];
  answer: number;
}

interface DraftData {
  scope?: string;
  difficulty?: QuestDifficulty;
  questionCount?: number;
  optionCount?: number;
  targetGroup?: string;
  xp?: number;
  description?: string;
  questions?: MCQuestion[];
}

interface CreateQuestModalProps {
  courseId: string;
  onClose: () => void;
  onSave: (q: Quest) => void;
  initialData?: Quest;
  draft?: DraftData;
}

const ALL_NUM_LABELS = ["①", "②", "③", "④", "⑤"];

function CreateQuestModal({ courseId, onClose, onSave, initialData, draft }: CreateQuestModalProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [scope, setScope] = useState(initialData?.scope ?? draft?.scope ?? "");
  const [difficulty, setDifficulty] = useState<QuestDifficulty>(
    initialData?.difficulty ?? draft?.difficulty ?? "보통"
  );
  const [questionCount, setQuestionCount] = useState(
    initialData?.questionCount ?? draft?.questionCount ?? 3
  );
  const normalizeTargetGroup = (v?: string) =>
    v ? v.replace(/\s*\(\d+명\)/g, "").replace("B·C", "B,C").trim() : "전체 수강생";

  const [targetGroup, setTargetGroup] = useState(
    normalizeTargetGroup(initialData?.targetGroup ?? draft?.targetGroup)
  );
  const [deadline, setDeadline] = useState(initialData?.deadline ?? "");
  const [xp, setXp] = useState(initialData?.xp ?? draft?.xp ?? 100);
  // description 우선, previewContent는 fallback
  const [description, setDescription] = useState(initialData?.description ?? initialData?.previewContent ?? draft?.description ?? "");
  const [questions, setQuestions] = useState<MCQuestion[]>(() => {
    if (draft?.questions && draft.questions.length > 0) return draft.questions;
    return Array.from({ length: initialData?.questionCount ?? draft?.questionCount ?? 3 }, () => ({
      question: "",
      options: Array(draft?.optionCount ?? 4).fill("") as string[],
      answer: 0,
    }));
  });
  const [optionCount, setOptionCount] = useState(draft?.optionCount ?? 4);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);

  const isEdit = !!initialData;

  // 수정 모드: 기존 문항 내용 불러오기
  useEffect(() => {
    if (!isEdit || !initialData) return;
    setContentLoading(true);
    getQuestContent(courseId, initialData.id)
      .then((content) => {
        const loaded: MCQuestion[] = content.questions.map((q) => ({
          question: q.question,
          options: q.options ?? Array(optionCount).fill(""),
          answer: typeof q.answer === "number" ? q.answer : 0,
        }));
        if (loaded.length > 0) {
          setQuestions(loaded);
          setQuestionCount(loaded.length);
          if (loaded[0].options.length > 0) setOptionCount(loaded[0].options.length);
        }
      })
      .catch(() => { /* 콘텐츠 로드 실패 시 빈 문항 유지 */ })
      .finally(() => setContentLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 문항 수 / 보기 수 변경 시 배열 동기화
  useEffect(() => {
    setQuestions((prev) => {
      const resized = prev.map((q) => {
        const opts = [...q.options];
        while (opts.length < optionCount) opts.push("");
        return {
          ...q,
          options: opts.slice(0, optionCount),
          answer: Math.min(q.answer, optionCount - 1),
        };
      });
      if (questionCount > resized.length) {
        return [
          ...resized,
          ...Array.from({ length: questionCount - resized.length }, () => ({
            question: "",
            options: Array(optionCount).fill("") as string[],
            answer: 0,
          })),
        ];
      }
      return resized.slice(0, questionCount);
    });
  }, [questionCount, optionCount]);

  const updateQuestion = (idx: number, value: string) =>
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, question: value } : q));

  const updateOption = (qIdx: number, optIdx: number, value: string) =>
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const opts = [...q.options];
        opts[optIdx] = value;
        return { ...q, options: opts };
      })
    );

  const setAnswer = (qIdx: number, answerIdx: number) =>
    setQuestions((prev) => prev.map((q, i) => i === qIdx ? { ...q, answer: answerIdx } : q));

  const handleSave = async (sendAfterSave = false) => {
    if (!title.trim()) { setError("퀘스트 제목을 입력해주세요."); return; }
    if (!scope.trim()) { setError("학습 범위를 입력해주세요."); return; }
    setSaving(true);
    try {
      const req = {
        title, scope, difficulty, questionCount, targetGroup,
        deadline: deadline || undefined, xp,
        description: description || undefined,
        questions: questions.map((q) => ({
          type: "multiple" as const,
          question: q.question,
          options: [...q.options],
          answer: q.answer,
        })),
      };
      let saved: Quest;
      if (isEdit && initialData) {
        saved = await updateQuest(courseId, initialData.id, req);
      } else {
        saved = await createQuest(courseId, req);
      }
      if (sendAfterSave && !isEdit) {
        try {
          saved = await apiSendQuest(courseId, saved.id);
        } catch (sendErr) {
          const apiErr = sendErr as ApiError;
          setError(apiErr.message ?? "발송에 실패했습니다. 퀘스트는 임시 저장되었습니다.");
          onSave(saved);
          setSaving(false);
          return;
        }
      }
      onSave(saved);
      onClose();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const targetOptions = [
    "전체 수강생",
    "A 등급 학생",
    "B 등급 학생",
    "C 등급 학생",
    "B,C 등급 학생",
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-gray-900" style={{ fontWeight: 700 }}>{isEdit ? "퀘스트 수정" : "퀘스트 직접 생성"}</h2>
            <p className="text-sm text-gray-400">{isEdit ? "퀘스트 내용을 수정한 후 저장하세요." : "학생들에게 발송할 퀘스트를 직접 만드세요."}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* 기본 정보 */}
          <div>
            <label className="block text-sm text-gray-600 mb-1.5" style={{ fontWeight: 500 }}>퀘스트 제목 *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 4주차 인터페이스 개념 점검"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#37b1b1] focus:ring-1 focus:ring-[#37b1b1]/30 transition-all placeholder:text-gray-300" />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1.5" style={{ fontWeight: 500 }}>학습 범위 *</label>
            <input type="text" value={scope} onChange={(e) => setScope(e.target.value)}
              placeholder="예: 4주차 강의 전체"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#37b1b1] focus:ring-1 focus:ring-[#37b1b1]/30 transition-all placeholder:text-gray-300" />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1.5" style={{ fontWeight: 500 }}>난이도</label>
            <div className="flex gap-1.5">
              {(["쉬움", "보통", "어려움"] as const).map((d) => (
                <button key={d} type="button" onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2 rounded-lg text-xs transition-colors ${difficulty === d ? difficultyColor[d] + " ring-1 ring-current" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
                  style={{ fontWeight: difficulty === d ? 600 : 400 }}>{d}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5" style={{ fontWeight: 500 }}>문항 수</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setQuestionCount((v) => Math.max(1, v - 1))}
                  className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 text-lg flex items-center justify-center leading-none">−</button>
                <span className="flex-1 text-center text-sm text-gray-800" style={{ fontWeight: 600 }}>{questionCount}문항</span>
                <button type="button" onClick={() => setQuestionCount((v) => Math.min(10, v + 1))}
                  className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 text-lg flex items-center justify-center leading-none">+</button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5" style={{ fontWeight: 500 }}>
                보기 수 <span className="text-gray-300" style={{ fontWeight: 400 }}>(문항당 2~5개)</span>
              </label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setOptionCount((v) => Math.max(2, v - 1))}
                  className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 text-lg flex items-center justify-center leading-none">−</button>
                <span className="flex-1 text-center text-sm text-gray-800" style={{ fontWeight: 600 }}>{optionCount}개</span>
                <button type="button" onClick={() => setOptionCount((v) => Math.min(5, v + 1))}
                  className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 text-lg flex items-center justify-center leading-none">+</button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1.5" style={{ fontWeight: 500 }}>대상 학생 그룹</label>
            <div className="relative">
              <select value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-8 text-sm text-gray-700 outline-none focus:border-[#37b1b1] appearance-none bg-white cursor-pointer">
                {targetOptions.map((o) => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5" style={{ fontWeight: 500 }}>
                <span className="flex items-center gap-1"><Calendar size={12} />마감일</span>
              </label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#37b1b1] focus:ring-1 focus:ring-[#37b1b1]/30 transition-all" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5" style={{ fontWeight: 500 }}>
                <span className="flex items-center gap-1"><Zap size={12} />XP 보상</span>
              </label>
              <div className="flex items-center gap-2">
                <input type="number" value={xp} onChange={(e) => setXp(Number(e.target.value))} min={10} max={500} step={10}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#37b1b1] focus:ring-1 focus:ring-[#37b1b1]/30 transition-all" />
                <span className="text-xs text-gray-400 flex-shrink-0">XP</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1.5" style={{ fontWeight: 500 }}>
              퀘스트 안내 문구 <span className="text-gray-300" style={{ fontWeight: 400 }}>(선택)</span>
            </label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 이번 주 강의 핵심 개념을 확인하는 퀘스트입니다."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#37b1b1] focus:ring-1 focus:ring-[#37b1b1]/30 transition-all placeholder:text-gray-300" />
          </div>

          {/* 문항 편집 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-sm text-gray-600" style={{ fontWeight: 600 }}>문항 편집</label>
              <span className="text-xs bg-[#e0f7f7] text-[#1d6e6e] rounded-full px-2 py-0.5">객관식 4지선다</span>
              <span className="text-xs text-gray-400">번호를 클릭하면 정답으로 설정됩니다.</span>
              {contentLoading && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Loader2 size={11} className="animate-spin" />문항 불러오는 중...
                </span>
              )}
            </div>
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
                  <p className="text-xs text-[#1d6e6e]" style={{ fontWeight: 700 }}>문항 {idx + 1}</p>
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => updateQuestion(idx, e.target.value)}
                    placeholder={`문항 ${idx + 1} 질문을 입력하세요`}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#37b1b1] focus:ring-1 focus:ring-[#37b1b1]/20 bg-white placeholder:text-gray-300"
                  />
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAnswer(idx, oi)}
                          title="클릭하여 정답으로 설정"
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs flex-shrink-0 transition-colors ${
                            q.answer === oi
                              ? "border-[#37b1b1] bg-[#37b1b1] text-white"
                              : "border-gray-300 text-gray-500 hover:border-[#37b1b1]/60"
                          }`}
                        >
                          {ALL_NUM_LABELS[oi]}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOption(idx, oi, e.target.value)}
                          placeholder={`보기 ${oi + 1}`}
                          className={`flex-1 border rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-1 bg-white placeholder:text-gray-300 transition-colors ${
                            q.answer === oi
                              ? "border-[#37b1b1] focus:border-[#37b1b1] focus:ring-[#37b1b1]/20 bg-[#f0fdfd]"
                              : "border-gray-200 focus:border-[#37b1b1] focus:ring-[#37b1b1]/20"
                          }`}
                        />
                        {q.answer === oi && (
                          <span className="text-[10px] text-[#37b1b1] flex-shrink-0" style={{ fontWeight: 600 }}>정답</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex-shrink-0 flex items-center justify-between">
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">취소</button>
          <div className="flex gap-2">
            <button onClick={() => handleSave(false)} disabled={saving}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-60 text-gray-700 rounded-xl px-4 py-2 text-sm transition-colors"
              style={{ fontWeight: 500 }}>
              <Save size={14} />{isEdit ? (saving ? "저장 중..." : "저장") : (saving ? "저장 중..." : "임시 저장")}
            </button>
            {!isEdit && (
              <button onClick={() => handleSave(true)} disabled={saving}
                className="flex items-center gap-2 bg-[#37b1b1] hover:bg-[#2a9090] disabled:opacity-60 text-white rounded-xl px-4 py-2 text-sm transition-colors"
                style={{ fontWeight: 600 }}>
                <Send size={14} />{saving ? "발송 중..." : "바로 발송"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AI Draft Modal ───────────────────────────────────────────────────────────

interface AiDraftModalProps {
  courseId: string;
  onClose: () => void;
  onDraftReady: (draft: DraftData) => void;
}

function AiDraftModal({ courseId, onClose, onDraftReady }: AiDraftModalProps) {
  const { files } = useLectureFiles();
  const [selectedWeek, setSelectedWeek] = useState("");
  const [scope, setScope] = useState("");
  const [difficulty, setDifficulty] = useState<QuestDifficulty>("보통");
  const [questionCount, setQuestionCount] = useState(3);
  const [optionCount, setOptionCount] = useState(4);
  const [targetGroup, setTargetGroup] = useState("전체 수강생");
  const [xp, setXp] = useState(100);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 업로드된 파일 기준 사용 가능한 주차 목록
  const availableWeeks = useMemo(() => {
    const weeks = [...new Set(files.filter((f) => f.week).map((f) => f.week))];
    return weeks.sort((a, b) => {
      const na = parseInt(a) || 0;
      const nb = parseInt(b) || 0;
      return na - nb || a.localeCompare(b);
    });
  }, [files]);

  const handleWeekSelect = (week: string) => {
    setSelectedWeek(week);
    if (!week) { setScope(""); return; }
    const weekFiles = files.filter((f) => f.week === week);
    const topic = weekFiles.find((f) => f.topic)?.topic ?? "";
    setScope(topic ? `${week} ${topic}` : `${week} 강의 전체`);
  };

  const targetOptions = [
    "전체 수강생",
    "A 등급 학생",
    "B 등급 학생",
    "C 등급 학생",
    "B,C 등급 학생",
  ];

  const handleGenerate = async () => {
    if (!scope.trim()) { setError("학습 범위를 입력해주세요."); return; }
    setLoading(true);
    setError("");
    try {
      const req: AiDraftRequest = {
        scope, difficulty, questionCount, optionCount, targetGroup,
        xp, description: description || undefined,
        week: selectedWeek || undefined,
      };
      const res = await generateAiDraft(courseId, req);
      const mcQuestions: MCQuestion[] = res.questions.map((q) => ({
        question: q.question,
        options: q.options,
        answer: q.answer,
      }));
      onDraftReady({
        scope, difficulty, questionCount, optionCount,
        targetGroup, xp, description, questions: mcQuestions,
      });
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "AI 초안 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-gray-900" style={{ fontWeight: 700 }}>AI 초안 생성</h2>
              <span className="text-xs bg-[#e0f7f7] text-[#1d6e6e] rounded-full px-2 py-0.5 flex items-center gap-1" style={{ fontWeight: 500 }}>
                <Sparkles size={10} />AI
              </span>
            </div>
            <p className="text-sm text-gray-400">조건을 설정하면 AI가 문항 초안을 생성합니다.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* 주차 선택 */}
          <div>
            <label className="block text-sm text-gray-600 mb-1.5" style={{ fontWeight: 500 }}>
              주차 선택 <span className="text-gray-300" style={{ fontWeight: 400 }}>(선택 시 학습 범위 자동 입력)</span>
            </label>
            <div className="relative">
              <select
                value={selectedWeek}
                onChange={(e) => handleWeekSelect(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-8 text-sm text-gray-700 outline-none focus:border-[#37b1b1] appearance-none bg-white cursor-pointer"
              >
                <option value="">주차를 선택하세요</option>
                {availableWeeks.length > 0 ? (
                  availableWeeks.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))
                ) : (
                  WEEK_OPTIONS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))
                )}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {availableWeeks.length === 0 && (
              <p className="text-xs text-amber-500 mt-1">업로드된 강의 자료가 없어 기본 주차 목록을 표시합니다.</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1.5" style={{ fontWeight: 500 }}>학습 범위 *</label>
            <input type="text" value={scope} onChange={(e) => setScope(e.target.value)}
              placeholder="예: 8주차 인터페이스와 추상 클래스"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#37b1b1] focus:ring-1 focus:ring-[#37b1b1]/30 transition-all placeholder:text-gray-300" />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1.5" style={{ fontWeight: 500 }}>난이도</label>
            <div className="flex gap-1.5">
              {(["쉬움", "보통", "어려움"] as const).map((d) => (
                <button key={d} type="button" onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2 rounded-lg text-xs transition-colors ${difficulty === d ? difficultyColor[d] + " ring-1 ring-current" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
                  style={{ fontWeight: difficulty === d ? 600 : 400 }}>{d}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5" style={{ fontWeight: 500 }}>문항 수</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setQuestionCount((v) => Math.max(1, v - 1))}
                  className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 text-lg flex items-center justify-center leading-none">−</button>
                <span className="flex-1 text-center text-sm text-gray-800" style={{ fontWeight: 600 }}>{questionCount}문항</span>
                <button type="button" onClick={() => setQuestionCount((v) => Math.min(10, v + 1))}
                  className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 text-lg flex items-center justify-center leading-none">+</button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5" style={{ fontWeight: 500 }}>
                보기 수 <span className="text-gray-300" style={{ fontWeight: 400 }}>(2~5개)</span>
              </label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setOptionCount((v) => Math.max(2, v - 1))}
                  className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 text-lg flex items-center justify-center leading-none">−</button>
                <span className="flex-1 text-center text-sm text-gray-800" style={{ fontWeight: 600 }}>{optionCount}개</span>
                <button type="button" onClick={() => setOptionCount((v) => Math.min(5, v + 1))}
                  className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 text-lg flex items-center justify-center leading-none">+</button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1.5" style={{ fontWeight: 500 }}>대상 학생 그룹</label>
            <div className="relative">
              <select value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-8 text-sm text-gray-700 outline-none focus:border-[#37b1b1] appearance-none bg-white cursor-pointer">
                {targetOptions.map((o) => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5" style={{ fontWeight: 500 }}>
                <span className="flex items-center gap-1"><Zap size={12} />XP 보상</span>
              </label>
              <div className="flex items-center gap-2">
                <input type="number" value={xp} onChange={(e) => setXp(Number(e.target.value))} min={10} max={500} step={10}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#37b1b1] focus:ring-1 focus:ring-[#37b1b1]/30 transition-all" />
                <span className="text-xs text-gray-400 flex-shrink-0">XP</span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5" style={{ fontWeight: 500 }}>
                <span className="flex items-center gap-1"><Target size={12} />퀘스트 안내</span>
              </label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="예: 이번 주 핵심 개념 위주"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#37b1b1] focus:ring-1 focus:ring-[#37b1b1]/30 transition-all placeholder:text-gray-300" />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <div className="bg-[#f0fdfd] border border-[#b3e5e5] rounded-xl px-4 py-3">
            <p className="text-xs text-[#1d6e6e] leading-relaxed">
              AI가 업로드된 강의 자료를 분석해 조건에 맞는 문항 초안을 생성합니다. 생성 후 직접 수정·검토한 뒤 발송할 수 있습니다.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex-shrink-0 flex items-center justify-between">
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">취소</button>
          <button onClick={handleGenerate} disabled={loading}
            className="flex items-center gap-2 bg-[#37b1b1] hover:bg-[#2a9090] disabled:opacity-60 text-white rounded-xl px-5 py-2 text-sm transition-colors"
            style={{ fontWeight: 600 }}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {loading ? "생성 중..." : "AI 초안 생성"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function InstructorDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();

  const courseName = searchParams.get("name") ? decodeURIComponent(searchParams.get("name")!) : "강의";
  const courseId = searchParams.get("courseId") ?? "";

  const { files, isLoading: filesLoading, fetchFiles, uploadFiles, updateFileMeta, togglePublish, deleteFile } = useLectureFiles();

  const [tab, setTab] = useState<"manage" | "analysis">("manage");
  const [isDragOver, setIsDragOver] = useState(false);

  // Inline file metadata editing
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editWeek, setEditWeek] = useState("");
  const [editTopic, setEditTopic] = useState("");

  // AI 조교 설정
  const [guidePrompt, setGuidePrompt] = useState("");
  const [promptSaved, setPromptSaved] = useState(false);
  const [promptSaving, setPromptSaving] = useState(false);

  // 퀘스트
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questsLoading, setQuestsLoading] = useState(true);
  const [expandedQuest, setExpandedQuest] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [showAiDraftModal, setShowAiDraftModal] = useState(false);
  const [questDraft, setQuestDraft] = useState<DraftData | null>(null);

  // 분석 탭
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [keywordData, setKeywordData] = useState<KeywordStat[]>([]);
  const [proposals, setProposals] = useState<AiProposal[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const displayName = user?.name ?? "교강사";
  const nameInitial = displayName.charAt(0);

  // ─── 데이터 로드 ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!courseId) return;
    fetchFiles(courseId);
  }, [courseId, fetchFiles]);

  useEffect(() => {
    if (!courseId) return;
    getQuests(courseId)
      .then(setQuests)
      .catch(() => setQuests([]))
      .finally(() => setQuestsLoading(false));
    getAiConfig(courseId)
      .then((cfg) => setGuidePrompt(cfg.guidePrompt))
      .catch(() => {});
  }, [courseId]);

  // 분석 탭 진입 시 selectedWeek 초기화 (파일 기반 최신 주차 또는 WEEK_OPTIONS 첫 항목)
  useEffect(() => {
    if (tab !== "analysis") return;
    if (!selectedWeek) {
      const weeks = [...new Set(files.filter((f) => f.week).map((f) => f.week))].sort((a, b) => {
        const na = parseInt(a) || 0; const nb = parseInt(b) || 0;
        return nb - na || b.localeCompare(a);
      });
      setSelectedWeek(weeks[0] ?? WEEK_OPTIONS[0]);
    }
  }, [tab, files]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tab !== "analysis" || !courseId || !selectedWeek) return;
    setAnalyticsLoading(true);
    Promise.all([
      getAnalytics(courseId).then(setKpi).catch(() => {}),
      getKeywordStats(courseId, selectedWeek).then(setKeywordData).catch(() => setKeywordData([])),
      getAiProposals(courseId).then(setProposals).catch(() => setProposals([])),
    ]).finally(() => setAnalyticsLoading(false));
  }, [tab, courseId, selectedWeek]);

  // ─── 핸들러 ─────────────────────────────────────────────────────────────────

  const handleDeleteFile = (id: string) => deleteFile(courseId, id);

  const handleTogglePublish = (id: string) => togglePublish(courseId, id);

  const handleStartEditFile = (file: UploadedFile) => {
    setEditingFileId(file.id);
    setEditWeek(file.week);
    setEditTopic(file.topic);
  };

  const handleSaveFileEdit = async (id: string) => {
    await updateFileMeta(courseId, id, { week: editWeek, topic: editTopic.trim() });
    setEditingFileId(null);
  };

  const handlePickedFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    uploadFiles(courseId, fileList);
  };

  const handleSavePrompt = async () => {
    setPromptSaving(true);
    try {
      await saveAiConfig(courseId, { guidePrompt });
      setPromptSaved(true);
      setTimeout(() => setPromptSaved(false), 2000);
    } catch {
      // 에러 처리는 조용히
    } finally {
      setPromptSaving(false);
    }
  };

  const handleSendQuest = async (id: string) => {
    try {
      const updated = await apiSendQuest(courseId, id);
      setQuests((prev) => prev.map((q) => (q.id === id ? updated : q)));
    } catch { /* no-op */ }
  };

  const handleAddQuest = (q: Quest) => {
    if (editingQuest) {
      setQuests((prev) => prev.map((existing) => existing.id === q.id ? q : existing));
      setEditingQuest(null);
    } else {
      setQuests((prev) => [q, ...prev]);
    }
  };

  const handleDeleteQuest = async (id: string) => {
    try {
      await apiDeleteQuest(courseId, id);
      setQuests((prev) => prev.filter((q) => q.id !== id));
      if (expandedQuest === id) setExpandedQuest(null);
    } catch { /* no-op */ }
  };

  const handleDraftReady = (draft: DraftData) => {
    setQuestDraft(draft);
    setShowAiDraftModal(false);
    setShowCreateModal(true);
  };

  // KPI 카드 데이터 (API 응답 또는 로딩 중 placeholder)
  const kpiCards = kpi ? [
    { label: "전체 수강생", value: `${kpi.studentCount}명`, sub: "현재 수강 인원 기준", icon: Users, color: "bg-[#f0fdfd] text-[#37b1b1]" },
    { label: "이번 주 질문 수", value: `${kpi.weeklyQuestionCount}건`, sub: `지난 주 대비 ${kpi.weeklyQuestionDelta >= 0 ? "+" : ""}${kpi.weeklyQuestionDelta}%`, icon: MessageSquare, color: "bg-[#e0f7f7] text-[#2a9090]" },
    { label: "평균 학습 참여율", value: `${kpi.avgEngagementRate}%`, sub: "목표치 80% 대비", icon: BarChart2, color: "bg-[#f0fdfd] text-[#1d6e6e]" },
    { label: "전체 퀘스트 정답률", value: `${kpi.avgQuestAnswerRate}%`, sub: "전체 학생 기준", icon: Award, color: "bg-[#e0f7f7] text-[#37b1b1]" },
  ] : [];

  const gradeData = kpi?.gradeBreakdown ?? [];

  return (
    <div className="min-h-screen bg-[#F7F6FB] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-4 flex-shrink-0">
        <button onClick={() => navigate("/instructor/courses")} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft size={16} /><span className="text-sm">강의 목록</span>
        </button>
        <div className="w-px h-5 bg-gray-200" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#37b1b1] flex items-center justify-center">
            <span className="text-white text-xs" style={{ fontWeight: 700 }}>CT</span>
          </div>
          <div>
            <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{courseName} — 교강사 대시보드</p>
            <p className="text-xs text-gray-400">Custom-TA</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-gray-500">{displayName}</span>
          <div className="w-8 h-8 rounded-full bg-[#e0f7f7] flex items-center justify-center text-[#1d6e6e] text-sm" style={{ fontWeight: 600 }}>
            {nameInitial}
          </div>
          <button onClick={() => logout().then(() => navigate("/"))} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">로그아웃</button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-100 px-6">
        <div className="flex gap-0 max-w-5xl">
          {[
            { key: "manage", label: "AI 맞춤 조교 관리" },
            { key: "analysis", label: "학생 분석" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key as "manage" | "analysis")}
              className={`px-6 py-4 text-sm border-b-2 transition-colors ${tab === key ? "border-[#37b1b1] text-[#1d6e6e]" : "border-transparent text-gray-400 hover:text-gray-700"}`}
              style={{ fontWeight: tab === key ? 600 : 400 }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">

          {/* ── AI 맞춤 조교 관리 ── */}
          {tab === "manage" && (
            <>
              {/* 강의 자료 관리 */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h2 className="text-gray-800 text-base" style={{ fontWeight: 600 }}>강의 자료 관리</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    전체 업로드 자료로 AI가 강의의 전체를 사전 학습합니다. 주차·주제를 설정하고 학생 공개 여부를 결정하세요.{" "}
                    <span className="text-[#37b1b1]" style={{ fontWeight: 500 }}>PDF 파일만 지원합니다.</span>
                  </p>
                </div>

                <div className="px-6 py-5 space-y-5">
                  {/* 안내 배너 */}
                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-3">
                    <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-blue-700 mb-1" style={{ fontWeight: 600 }}>AI 학습 vs 학생 공개 — 어떻게 다른가요?</p>
                      <p className="text-xs text-blue-600 leading-relaxed">
                        업로드된 모든 PDF는 즉시 AI가 RAG로 색인합니다 (학생에게 보이지 않음). 강의자가 <span style={{ fontWeight: 600 }}>주차·주제를 설정</span>하고{" "}
                        <span style={{ fontWeight: 600 }}>「학생 공개」</span>를 켜면 해당 파일이 학생 워크스페이스의 강의 자료 탭에 표시됩니다.
                      </p>
                    </div>
                  </div>

                  {/* 통계 카드 */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-center">
                      <p className="text-xl text-gray-800" style={{ fontWeight: 700 }}>{files.length}개</p>
                      <p className="text-xs text-gray-400 mt-0.5">전체 파일</p>
                    </div>
                    <div className="rounded-xl border border-[#b3e5e5] bg-[#f0fdfd] px-4 py-3 text-center">
                      <p className="text-xl text-[#1d6e6e]" style={{ fontWeight: 700 }}>{files.filter((f) => f.ragStatus === "ready").length}개</p>
                      <p className="text-xs text-[#37b1b1] mt-0.5">AI 학습 완료</p>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
                      <p className="text-xl text-amber-600" style={{ fontWeight: 700 }}>{files.filter((f) => f.ragStatus === "indexing").length}개</p>
                      <p className="text-xs text-amber-500 mt-0.5">색인 중</p>
                    </div>
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center">
                      <p className="text-xl text-green-600" style={{ fontWeight: 700 }}>{files.filter((f) => f.isPublished && f.week && f.topic).length}개</p>
                      <p className="text-xs text-green-500 mt-0.5">학생 공개</p>
                    </div>
                  </div>

                  {/* 드롭존 */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handlePickedFiles(e.dataTransfer.files); }}
                    className={`border-2 border-dashed rounded-xl flex items-center justify-between px-6 py-4 transition-colors ${isDragOver ? "border-[#37b1b1] bg-[#f0fdfd]" : "border-gray-200 hover:border-[#37b1b1]/50 hover:bg-gray-50"}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#f0fdfd] flex items-center justify-center flex-shrink-0">
                        <Upload size={18} className="text-[#37b1b1]" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-700" style={{ fontWeight: 600 }}>PDF 파일을 드래그하거나 선택하세요</p>
                        <p className="text-xs text-gray-400 mt-0.5">업로드 즉시 AI 색인을 시작합니다 · PDF 형식만 지원 · 여러 파일 동시 업로드 가능</p>
                      </div>
                    </div>
                    <label className="text-sm bg-[#37b1b1] hover:bg-[#2a9090] text-white rounded-xl px-5 py-2.5 transition-colors cursor-pointer flex-shrink-0" style={{ fontWeight: 600 }}>
                      PDF 선택
                      <input type="file" accept=".pdf" className="hidden" multiple onChange={(e) => handlePickedFiles(e.currentTarget.files)} />
                    </label>
                  </div>

                  {/* 파일 목록 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-gray-700" style={{ fontWeight: 600 }}>업로드된 자료 ({files.length}개)</p>
                      <p className="text-xs text-gray-400">「설정」버튼으로 주차·주제를 입력한 뒤 학생 공개 토글을 커세요.</p>
                    </div>

                    {filesLoading && (
                      <div className="flex items-center gap-2 py-6 text-gray-300">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">파일 목록 불러오는 중...</span>
                      </div>
                    )}

                    {!filesLoading && files.length === 0 && (
                      <div className="border-2 border-dashed border-gray-100 rounded-xl p-8 text-center">
                        <p className="text-sm text-gray-300">업로드된 파일이 없습니다.</p>
                        <p className="text-xs text-gray-200 mt-1">위 버튼으로 PDF를 업로드하면 여기에 표시됩니다.</p>
                      </div>
                    )}

                    <div className="space-y-2.5">
                      {files.map((f) => {
                        const isEditing = editingFileId === f.id;
                        const needsSetup = !f.week || !f.topic;

                        return (
                          <div key={f.id}
                            className={`border rounded-xl overflow-hidden transition-all ${isEditing ? "border-[#37b1b1]/50 shadow-sm" : needsSetup ? "border-amber-200" : f.isPublished ? "border-[#b3e5e5]" : "border-gray-100"}`}
                          >
                            <div className="flex items-center gap-3 p-3">
                              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                                <FileText size={16} className="text-red-500" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm text-gray-800 truncate max-w-[200px]" style={{ fontWeight: 500 }}>{f.name}</p>
                                  {f.ragStatus === "ready" ? (
                                    <span className="text-[10px] bg-[#e0f7f7] text-[#1d6e6e] rounded-full px-2 py-0.5 flex-shrink-0">AI 학습 완료</span>
                                  ) : (
                                    <span className="text-[10px] bg-amber-50 text-amber-600 rounded-full px-2 py-0.5 flex items-center gap-1 flex-shrink-0">
                                      <Loader2 size={9} className="animate-spin" />색인 중
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className="text-xs text-gray-400">{f.size} · {f.uploadedAt}</span>
                                  {f.week ? (
                                    <span className="text-xs bg-[#e0f7f7] text-[#1d6e6e] rounded-full px-2 py-0.5" style={{ fontWeight: 600 }}>{f.week}</span>
                                  ) : (
                                    <span className="text-xs text-amber-500">⚠ 주차 미설정</span>
                                  )}
                                  {f.topic && <span className="text-xs text-gray-500 truncate max-w-[120px]">· {f.topic}</span>}
                                  {f.isPublished && !needsSetup && (
                                    <span className="text-[10px] bg-green-50 text-green-600 rounded-full px-2 py-0.5 flex-shrink-0">🌐 학생 공개</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5 flex-shrink-0">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => { if (f.isPublished || !needsSetup) handleTogglePublish(f.id); }}
                                    title={!f.isPublished && needsSetup ? "주차·주제를 먼저 설정하세요" : f.isPublished ? "공개 중 — 클릭하여 비공개" : "비공개 — 클릭하여 학생 공개"}
                                    className={`relative w-9 h-5 rounded-full transition-colors ${!f.isPublished && needsSetup ? "opacity-40 cursor-not-allowed bg-gray-200" : f.isPublished ? "bg-[#37b1b1] cursor-pointer" : "bg-gray-200 cursor-pointer"}`}
                                  >
                                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${f.isPublished ? "left-4" : "left-0.5"}`} />
                                  </button>
                                  <span className="text-[10px] text-gray-400 w-8">{f.isPublished && !needsSetup ? "공개" : "비공개"}</span>
                                </div>

                                <button
                                  onClick={() => isEditing ? setEditingFileId(null) : handleStartEditFile(f)}
                                  className={`flex items-center gap-1 text-xs rounded-lg px-2.5 py-1 transition-colors border ${isEditing ? "border-[#37b1b1] text-[#37b1b1] bg-[#f0fdfd]" : "border-gray-200 text-gray-500 hover:border-[#37b1b1] hover:text-[#37b1b1]"}`}
                                >
                                  <Edit3 size={11} />{isEditing ? "접기" : "설정"}
                                </button>

                                <button onClick={() => handleDeleteFile(f.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {isEditing && (
                              <div className="border-t border-[#b3e5e5]/50 bg-[#f8fffe] px-5 py-4">
                                <p className="text-xs text-[#1d6e6e] mb-3" style={{ fontWeight: 600 }}>📁 주차 및 주제 설정</p>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1.5">주차</label>
                                    <div className="relative">
                                      <select value={editWeek} onChange={(e) => setEditWeek(e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 appearance-none bg-white cursor-pointer focus:border-[#37b1b1] focus:ring-1 focus:ring-[#37b1b1]/20 outline-none">
                                        <option value="">주차 선택</option>
                                        {WEEK_OPTIONS.map((w) => <option key={w} value={w}>{w}</option>)}
                                      </select>
                                      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-500 mb-1.5">주제</label>
                                    <input type="text" value={editTopic} onChange={(e) => setEditTopic(e.target.value)}
                                      placeholder="예: 상속과 다형성"
                                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:border-[#37b1b1] focus:ring-1 focus:ring-[#37b1b1]/20 outline-none placeholder:text-gray-300" />
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-gray-400">주차·주제 설정 후 토글을 켜면 학생 강의 자료 탭에 표시됩니다.</p>
                                  <button onClick={() => handleSaveFileEdit(f.id)}
                                    className="flex items-center gap-1.5 bg-[#37b1b1] hover:bg-[#2a9090] text-white rounded-lg px-4 py-1.5 text-xs transition-colors">
                                    <CheckCircle size={11} />저장
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI 조교 맞춤 설정 */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-gray-800" style={{ fontWeight: 600 }}>AI 조교 맞춤 설정</h2>
                  <p className="text-sm text-gray-400 mt-0.5">AI가 강의자의 의도에 맞게 답변할 수 있도록 가이드를 작성하세요.</p>
                </div>
                <div className="p-6">
                  <textarea value={guidePrompt} onChange={(e) => setGuidePrompt(e.target.value)} rows={5}
                    placeholder={"학생에게 설명할 때 어떤 말투와 기준으로 답변할지 작성하세요.\n예: 시험 위주로 핵심 개념을 먼저 정의하고, 코드 예제를 포함해주세요.\n추상 클래스와 인터페이스 비교처럼 대조 구조로 설명하면 좋습니다.\n어렵거나 모호한 질문에는 '강의 자료를 기반으로 설명드리면'이라는 전제를 붙여주세요."}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 resize-none outline-none focus:border-[#37b1b1] focus:ring-1 focus:ring-[#37b1b1]/30 transition-all placeholder:text-gray-300 leading-relaxed" />
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-gray-400">이 설정은 AI 조교의 답변 스타일과 기준에 직접 반영됩니다.</p>
                    <button onClick={handleSavePrompt} disabled={promptSaving}
                      className={`flex items-center gap-2 text-sm rounded-lg px-4 py-2 transition-colors ${promptSaved ? "bg-green-100 text-green-700" : "bg-[#37b1b1] text-white hover:bg-[#2a9090]"} disabled:opacity-60`}>
                      {promptSaved ? <CheckCircle size={14} /> : <Save size={14} />}
                      {promptSaving ? "저장 중..." : promptSaved ? "저장 완료!" : "저장하기"}
                    </button>
                  </div>
                </div>
              </div>

              {/* 퀘스트 생성 및 보내기 */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-gray-800" style={{ fontWeight: 600 }}>퀘스트 생성 및 보내기</h2>
                    <p className="text-sm text-gray-400 mt-0.5">AI가 강의 자료를 분석해 생성한 퀘스트 초안입니다. 검토 후 발송하세요.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowAiDraftModal(true)}
                      className="flex items-center gap-1.5 text-sm bg-[#e0f7f7] text-[#1d6e6e] hover:bg-[#c8f0f0] rounded-lg px-4 py-2 transition-colors border border-[#b3e5e5]"
                      style={{ fontWeight: 600 }}>
                      <Sparkles size={15} />AI 초안 생성
                    </button>
                    <button onClick={() => setShowCreateModal(true)}
                      className="flex items-center gap-1.5 text-sm bg-[#37b1b1] text-white hover:bg-[#2a9090] rounded-lg px-4 py-2 transition-colors"
                      style={{ fontWeight: 600 }}>
                      <Plus size={15} />직접 생성
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  {questsLoading && (
                    <div className="flex items-center gap-2 py-4 text-gray-300">
                      <Loader2 size={14} className="animate-spin" />
                      <span className="text-sm">퀘스트 불러오는 중...</span>
                    </div>
                  )}
                  {!questsLoading && quests.filter(q => q.source === "ai").length === 0 && (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 opacity-60 select-none">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs bg-gray-100 text-gray-400 rounded-full px-2 py-0.5 flex items-center gap-1">
                              <Sparkles size={10} />예시 — 데이터 축적 후 AI가 자동 생성
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 mb-1" style={{ fontWeight: 600 }}>2주차 핵심 개념 점검 퀘스트</p>
                          <div className="flex items-center gap-3 text-xs text-gray-300">
                            <span>범위: 2주차 강의 전체</span>
                            <span className="rounded-full px-2 py-0.5 bg-gray-100 text-gray-300">보통</span>
                            <span>5문항</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-300 mt-3 text-center">수강생들이 AI 조교를 사용하고 자료가 축적되면 AI가 자동으로 퀘스트를 제안합니다.</p>
                    </div>
                  )}
                  {quests.map((quest) => (
                    <div key={quest.id}
                      className={`border rounded-xl overflow-hidden ${quest.status === "sent" ? "border-green-200 bg-green-50/30" : "border-gray-100"}`}>
                      <div className="p-4 flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {quest.source === "ai" && (
                              <span className="text-xs bg-[#e0f7f7] text-[#1d6e6e] rounded-full px-2 py-0.5 flex items-center gap-1" style={{ fontWeight: 500 }}>
                                <Sparkles size={10} />AI 생성
                              </span>
                            )}
                            {quest.source === "manual" && (
                              <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 flex items-center gap-1" style={{ fontWeight: 500 }}>
                                <Edit3 size={10} />직접 생성
                              </span>
                            )}
                            <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{quest.title}</p>
                            {quest.status === "sent" && (
                              <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">발송 완료</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>범위: {quest.scope}</span>
                            <span className={`rounded-full px-2 py-0.5 ${difficultyColor[quest.difficulty]}`}>{quest.difficulty}</span>
                            <span>{quest.questionCount}문항</span>
                            <span>대상: {quest.targetGroup}</span>
                          </div>
                        </div>
                        {quest.status === "pending" && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {quest.previewContent && (
                              <button onClick={() => setExpandedQuest(expandedQuest === quest.id ? null : quest.id)}
                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#37b1b1] border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
                                <Eye size={12} />미리보기
                              </button>
                            )}
                            <button onClick={() => { setEditingQuest(quest); setShowCreateModal(true); }}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#37b1b1] border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
                              <Edit3 size={12} />수정
                            </button>
                            <button onClick={() => handleSendQuest(quest.id)}
                              className="flex items-center gap-1 text-xs bg-[#37b1b1] text-white hover:bg-[#2a9090] rounded-lg px-3 py-1.5 transition-colors">
                              <Send size={12} />발송
                            </button>
                            <button onClick={() => handleDeleteQuest(quest.id)}
                              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 border border-red-100 hover:border-red-300 rounded-lg px-2 py-1.5 transition-colors">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                        {quest.status === "sent" && (
                          <button onClick={() => handleDeleteQuest(quest.id)}
                            className="flex items-center gap-1 text-xs text-gray-300 hover:text-red-400 rounded-lg px-2 py-1.5 transition-colors flex-shrink-0">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      {expandedQuest === quest.id && quest.previewContent && (
                        <div className="border-t border-gray-100 px-4 pb-4 bg-gray-50">
                          <p className="text-xs text-gray-400 mt-3 mb-2" style={{ fontWeight: 600 }}>미리보기</p>
                          <pre className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{quest.previewContent}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── 학생 분석 ── */}
          {tab === "analysis" && (
            <>
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
                  <Loader2 size={20} className="animate-spin" />
                  <span>분석 데이터 불러오는 중...</span>
                </div>
              ) : (
                <>
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {kpiCards.map((card) => (
                      <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                          <card.icon size={18} />
                        </div>
                        <p className="text-2xl text-gray-900 mb-0.5" style={{ fontWeight: 700 }}>{card.value}</p>
                        <p className="text-sm text-gray-500" style={{ fontWeight: 600 }}>{card.label}</p>
                        <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
                      </div>
                    ))}
                    {kpiCards.length === 0 && !analyticsLoading && (
                      <div className="col-span-4 py-10 text-center text-gray-300">
                        <BarChart2 size={32} className="mx-auto mb-2 opacity-40" />
                        <p className="text-sm">아직 분석 데이터가 없습니다.</p>
                        <p className="text-xs mt-1">수강생이 AI 조교를 이용하면 자동으로 데이터가 쌓입니다.</p>
                      </div>
                    )}
                  </div>

                  {/* Charts — 등급 분포 + 키워드 분석 (독립적으로 표시) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Donut — 등급 분포 */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                      <h3 className="text-gray-800 mb-0.5" style={{ fontWeight: 600 }}>클래스 등급 분포</h3>
                      <p className="text-xs text-gray-400 mb-4">구역 클릭 시 해당 학생 목록 확인 가능</p>
                      {gradeData.length > 0 ? (
                        <>
                          <div className="flex items-center gap-6">
                            <div style={{ width: 160, height: 160 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie data={gradeData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value"
                                    onClick={(d) => setSelectedGrade(selectedGrade === d.name ? null : d.name)} cursor="pointer">
                                    {gradeData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} opacity={selectedGrade && selectedGrade !== entry.name ? 0.4 : 1} />
                                    ))}
                                  </Pie>
                                  <Tooltip formatter={(v) => [`${v}명`, ""]} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="space-y-2 flex-1">
                              {gradeData.map((g) => (
                                <button key={g.name} onClick={() => setSelectedGrade(selectedGrade === g.name ? null : g.name)}
                                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left ${selectedGrade === g.name ? "ring-2 ring-[#7fd9d9]" : "hover:bg-gray-50"}`}
                                  style={{ background: selectedGrade === g.name ? `${g.color}15` : undefined }}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ background: g.color }} />
                                    <span className="text-sm text-gray-700">{g.name}</span>
                                  </div>
                                  <span className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{g.value}명</span>
                                </button>
                              ))}
                            </div>
                          </div>
                          {selectedGrade && (
                            <div className="mt-4 p-3 bg-[#f0fdfd] rounded-xl border border-[#b3e5e5]">
                              <p className="text-xs text-[#1d6e6e] mb-2" style={{ fontWeight: 600 }}>
                                {selectedGrade} 학생 목록 ({gradeData.find((g) => g.name === selectedGrade)?.value}명)
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {Array.from({ length: gradeData.find((g) => g.name === selectedGrade)?.value ?? 0 }).map((_, i) => (
                                  <span key={i} className="text-xs bg-white border border-[#b3e5e5] text-gray-600 rounded-full px-2 py-0.5">학생 {i + 1}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="h-[180px] flex items-center justify-center text-gray-300">
                          <p className="text-sm">등급 데이터가 없습니다.</p>
                        </div>
                      )}
                    </div>

                    {/* Keyword — 키워드 분석 (gradeData 여부와 무관하게 항상 표시) */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="text-gray-800" style={{ fontWeight: 600 }}>학생 질문 키워드 분석</h3>
                        <div className="relative">
                          <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 pr-7 appearance-none bg-white text-gray-600 outline-none cursor-pointer">
                            {/* 업로드된 파일 기준 주차 목록, 없으면 WEEK_OPTIONS fallback */}
                            {files.length > 0
                              ? [...new Set(files.filter((f) => f.week).map((f) => f.week))]
                                  .sort((a, b) => {
                                    const na = parseInt(a) || 0;
                                    const nb = parseInt(b) || 0;
                                    return nb - na || b.localeCompare(a);
                                  })
                                  .map((w) => <option key={w} value={w}>{w}</option>)
                              : WEEK_OPTIONS.map((w) => <option key={w} value={w}>{w}</option>)
                            }
                          </select>
                          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mb-4">주차별로 자주 나온 질문 키워드를 확인하세요</p>
                      {keywordData.length > 0 ? (
                        <div style={{ height: 180 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={keywordData} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                              <XAxis type="number" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                              <YAxis type="category" dataKey="keyword" tick={{ fontSize: 12, fill: "#4B5563" }} axisLine={false} tickLine={false} width={52} />
                              <Tooltip formatter={(v) => [`${v}회`, "질문 수"]} cursor={{ fill: "#F3F4F6" }} />
                              <Bar dataKey="count" fill="#37b1b1" radius={[0, 6, 6, 0]} barSize={18} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-[180px] flex items-center justify-center text-gray-300">
                          <p className="text-sm">해당 주차 데이터가 없습니다.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI 제안 */}
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <div className="flex items-start gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <h2 className="text-gray-800" style={{ fontWeight: 600 }}>AI 제안</h2>
                            <span className="text-xs bg-[#e0f7f7] text-[#1d6e6e] rounded-full px-2 py-0.5 flex items-center gap-1" style={{ fontWeight: 500 }}>
                              <Sparkles size={10} />자동 분석
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">AI 조교가 매주 학생들의 학습 데이터를 분석한 후, 최적의 개입 방법을 자동으로 추천합니다.</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      {!analyticsLoading && proposals.length === 0 && (
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 opacity-55 select-none">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Target size={15} className="text-gray-300" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs text-gray-300" style={{ fontWeight: 500 }}>제안 예시</span>
                                <span className="text-xs bg-gray-100 text-gray-300 rounded-full px-2 py-0.5 flex items-center gap-1">
                                  <Sparkles size={9} />데이터 축적 후 AI 제공
                                </span>
                              </div>
                              <p className="text-sm text-gray-300 leading-relaxed mt-2 bg-gray-50 rounded-lg p-3">
                                수강생들이 AI 조교를 이용해 학습 데이터가 쌓이면, 매주 자동으로 이와 같은 맞춤 제안이 제공됩니다.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {proposals.map((p, idx) => (
                        <div key={p.id} className="border border-gray-100 rounded-xl p-5">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#f0fdfd] flex items-center justify-center flex-shrink-0">
                              <Target size={15} className="text-[#37b1b1]" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-gray-400" style={{ fontWeight: 500 }}>제안 {idx + 1}</span>
                                <span className="text-xs bg-[#e0f7f7] text-[#1d6e6e] rounded-full px-2 py-0.5 flex items-center gap-1">
                                  <Sparkles size={9} />AI 추천
                                </span>
                              </div>
                              <p className="text-sm text-gray-800 mb-2" style={{ fontWeight: 600 }}>{p.title}</p>
                              <div className="space-y-1.5 text-xs text-gray-500">
                                <p><span className="text-gray-600" style={{ fontWeight: 500 }}>대상:</span> {p.targetGroup}</p>
                                <p><span className="text-gray-600" style={{ fontWeight: 500 }}>근거:</span> {p.evidence}</p>
                                <p className="text-sm text-gray-600 leading-relaxed mt-2 bg-gray-50 rounded-lg p-3">{p.content}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* AI Draft Modal */}
      {showAiDraftModal && (
        <AiDraftModal
          courseId={courseId}
          onClose={() => setShowAiDraftModal(false)}
          onDraftReady={handleDraftReady}
        />
      )}

      {/* Create / Edit Quest Modal */}
      {showCreateModal && (
        <CreateQuestModal
          courseId={courseId}
          onClose={() => { setShowCreateModal(false); setEditingQuest(null); setQuestDraft(null); }}
          onSave={handleAddQuest}
          initialData={editingQuest ?? undefined}
          draft={questDraft ?? undefined}
        />
      )}
    </div>
  );
}
