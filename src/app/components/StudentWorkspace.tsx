import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Send,
  ChevronRight,
  X,
  Star,
  Zap,
  BookMarked,
  AlertCircle,
  CheckCircle,
  FileText,
  Link2,
  ArrowLeft,
  MessageSquare,
  Target,
  Trophy,
  BookOpen,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Play,
  Award,
  Clock,
  ArrowRight,
  Bell,
  Megaphone,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  useLectureFiles,
  buildSummaryFromLatest,
} from "./LectureFilesContext";
import { useAuth } from "./AuthContext";
import { getChatHistory, sendMessage as apiSendMessage } from "@/services/chat";
import { getQuests, getQuestContent, submitQuestAnswers } from "@/services/quests";
import { getMyWeakPoints, getMyStats, getNotifications, markNotificationRead, markAllNotificationsRead } from "@/services/students";
import type {
  ChatMessage,
  Quest,
  QuestContent,
  WeakPoint,
  Notification,
} from "@/types";

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard(props: {
  title: string;
  bullets: string[];
  sources: string[];
}) {
  const { title, bullets, sources } = props;
  return (
    <div className="mx-4 mb-4 rounded-2xl overflow-hidden shadow-sm border border-[#b3e5e5]">
      <div className="bg-[#37b1b1] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
            <BookMarked size={13} className="text-white" />
          </div>
          <span className="text-white text-sm" style={{ fontWeight: 600 }}>{title}</span>
        </div>
        <span className="text-white/80 text-xs bg-white/15 rounded-full px-2 py-0.5">강의 자료 기반</span>
      </div>
      <div className="bg-white p-4 space-y-3">
        <div className="bg-[#f0fdfd] border border-[#c9eded] rounded-xl p-3">
          <p className="text-xs text-[#1d6e6e] mb-2" style={{ fontWeight: 700 }}>📌 요약</p>
          <ul className="space-y-1 text-sm text-gray-700">
            {bullets.slice(0, 3).map((b) => (
              <li key={b}>• {b}</li>
            ))}
          </ul>
        </div>
        {sources.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sources.map((s) => (
              <span key={s}
                className="inline-flex items-center gap-1.5 bg-[#f0fdfd] hover:bg-[#e0f7f7] border border-[#b3e5e5] rounded-lg px-3 py-1.5 text-xs text-[#1d6e6e] transition-colors">
                <Link2 size={10} />{s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface QuestStartModalProps {
  quest: Quest;
  courseId: string;
  onClose: () => void;
}

function QuestStartModal({ quest, courseId, onClose }: QuestStartModalProps) {
  const [content, setContent] = useState<QuestContent | null>(null);
  const [loadingContent, setLoadingContent] = useState(true);
  const [answers, setAnswers] = useState<Record<string, number | boolean | string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; xpEarned: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getQuestContent(courseId, quest.id)
      .then(setContent)
      .catch(() => setContent(null))
      .finally(() => setLoadingContent(false));
  }, [courseId, quest.id]);

  const handleOX = (qid: string, val: boolean) => {
    if (!submitted) setAnswers((p) => ({ ...p, [qid]: val }));
  };

  const handleMultiple = (qid: string, idx: number) => {
    if (!submitted) setAnswers((p) => ({ ...p, [qid]: idx }));
  };

  const handleSubmit = async () => {
    if (!content) return;
    setSubmitting(true);
    try {
      const res = await submitQuestAnswers(courseId, quest.id, answers);
      setResult(res);
      setSubmitted(true);
    } catch {
      // 오프라인 fallback: 로컬에서 채점
      const score = content.questions.filter((q) => answers[q.id] === q.answer).length;
      setResult({ score, total: content.questions.length, xpEarned: Math.round((quest.xp ?? 100) * (score / content.questions.length)) });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const difficultyColor: Record<string, string> = {
    쉬움: "bg-green-100 text-green-700",
    보통: "bg-yellow-100 text-yellow-700",
    어려움: "bg-red-100 text-red-700",
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className={`p-5 border-b border-gray-100 flex-shrink-0 ${quest.type === "professor" ? "bg-yellow-50" : "bg-[#f0fdfd]"}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {quest.type === "professor" && <Star size={14} className="text-yellow-500" />}
                <span className={`text-xs rounded-full px-2 py-0.5 ${quest.type === "professor" ? "bg-yellow-200 text-yellow-800" : "bg-[#e0f7f7] text-[#1d6e6e]"}`} style={{ fontWeight: 600 }}>
                  {quest.type === "professor" ? "교수님 퀘스트" : "AI 퀘스트"}
                </span>
                {quest.difficulty && (
                  <span className={`text-xs rounded-full px-2 py-0.5 ${difficultyColor[quest.difficulty]}`}>{quest.difficulty}</span>
                )}
              </div>
              <h2 className="text-gray-900" style={{ fontWeight: 700 }}>{quest.title}</h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                {quest.deadline && <span className="flex items-center gap-1"><Clock size={11} />마감 {quest.deadline}</span>}
                {quest.xp && <span className="flex items-center gap-1 text-yellow-600"><Zap size={11} />{quest.xp} XP</span>}
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 flex-shrink-0">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {loadingContent && (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-300">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">문제 불러오는 중...</span>
            </div>
          )}

          {!loadingContent && !content && (
            <div className="py-12 text-center text-gray-300">
              <p className="text-sm">문제를 불러오지 못했습니다.</p>
            </div>
          )}

          {content && (
            <>
              <div className="bg-gray-50 rounded-xl p-4 mb-5">
                <p className="text-sm text-gray-600 leading-relaxed">{content.intro}</p>
              </div>

              {submitted && result && (
                <div className={`rounded-xl p-4 mb-5 flex items-center gap-3 ${result.score === result.total ? "bg-green-50 border border-green-200" : "bg-orange-50 border border-orange-200"}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${result.score === result.total ? "bg-green-100" : "bg-orange-100"}`}>
                    {result.score === result.total ? <Trophy size={18} className="text-green-600" /> : <Award size={18} className="text-orange-500" />}
                  </div>
                  <div>
                    <p className={`text-sm ${result.score === result.total ? "text-green-700" : "text-orange-700"}`} style={{ fontWeight: 700 }}>
                      {result.score}/{result.total} 정답 {result.score === result.total ? "— 완벽합니다! 🎉" : "— 틀린 문제를 다시 확인해보세요."}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">+{result.xpEarned} XP 획득</p>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                {content.questions.map((q, idx) => {
                  const answered = answers[q.id] !== undefined;
                  const isCorrect = submitted && answers[q.id] === q.answer;
                  const isWrong = submitted && answers[q.id] !== q.answer && answered;

                  return (
                    <div key={q.id}
                      className={`border rounded-xl p-4 transition-all ${submitted ? (isCorrect ? "border-green-200 bg-green-50/30" : isWrong ? "border-red-200 bg-red-50/30" : "border-gray-100") : "border-gray-100"}`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <span className="w-6 h-6 rounded-full bg-[#e0f7f7] text-[#1d6e6e] text-xs flex items-center justify-center flex-shrink-0" style={{ fontWeight: 700 }}>
                          {idx + 1}
                        </span>
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line" style={{ fontWeight: 500 }}>{q.question}</p>
                        {submitted && (
                          <span className="flex-shrink-0 ml-auto">
                            {isCorrect ? <CheckCircle size={16} className="text-green-500" /> : isWrong ? <X size={16} className="text-red-400" /> : null}
                          </span>
                        )}
                      </div>

                      {q.type === "ox" && (
                        <div className="flex gap-3 ml-9">
                          {[true, false].map((val) => {
                            const label = val ? "O" : "X";
                            const selected = answers[q.id] === val;
                            const correct = submitted && q.answer === val;
                            const wrong = submitted && selected && q.answer !== val;
                            return (
                              <button key={label} onClick={() => handleOX(q.id, val)}
                                className={`flex-1 py-2.5 rounded-xl text-sm transition-all ${wrong ? "bg-red-100 text-red-700 border border-red-300" : correct ? "bg-green-100 text-green-700 border border-green-300" : selected ? "bg-[#e0f7f7] text-[#1d6e6e] border border-[#b3e5e5]" : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-[#f0fdfd]"}`}
                                style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {q.type === "multiple" && (
                        <div className="ml-9 space-y-2">
                          {q.options!.map((opt, oi) => {
                            const selected = answers[q.id] === oi;
                            const correct = submitted && q.answer === oi;
                            const wrong = submitted && selected && q.answer !== oi;
                            return (
                              <button key={oi} onClick={() => handleMultiple(q.id, oi)}
                                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left transition-all ${wrong ? "bg-red-50 text-red-700 border border-red-200" : correct ? "bg-green-50 text-green-700 border border-green-200" : selected ? "bg-[#f0fdfd] text-[#1d6e6e] border border-[#b3e5e5]" : "bg-gray-50 text-gray-600 border border-gray-100 hover:bg-[#f0fdfd]"}`}>
                                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center flex-shrink-0 ${selected || correct ? "bg-[#e0f7f7] text-[#1d6e6e]" : "bg-gray-200 text-gray-500"}`} style={{ fontWeight: 700 }}>
                                  {oi + 1}
                                </span>
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {q.hint && (
                        <p className="ml-9 mt-2 text-xs text-gray-400 flex items-center gap-1">
                          <Link2 size={10} />출처: {q.hint}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex-shrink-0 flex items-center justify-between gap-3">
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">닫기</button>
          {content && !submitted ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length < content.questions.length}
              className="flex items-center gap-2 bg-[#37b1b1] hover:bg-[#2a9090] disabled:opacity-50 text-white rounded-xl px-5 py-2.5 text-sm transition-colors"
              style={{ fontWeight: 600 }}>
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
              {submitting ? "제출 중..." : `제출하기 (${Object.keys(answers).length}/${content.questions.length})`}
            </button>
          ) : submitted ? (
            <button onClick={onClose}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl px-5 py-2.5 text-sm transition-colors"
              style={{ fontWeight: 600 }}>
              <ArrowRight size={15} />완료
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StudentWorkspace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const courseId = searchParams.get("courseId") ?? "";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const [rightTab, setRightTab] = useState<"note" | "material">("note");
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);
  const [expandedWeak, setExpandedWeak] = useState<string | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  const [activeQuiz, setActiveQuiz] = useState<{ msgId: string; selected: number | null; submitted: boolean }>({
    msgId: "", selected: null, submitted: false,
  });

  const [quests, setQuests] = useState<Quest[]>([]);
  const [questsLoading, setQuestsLoading] = useState(true);
  const [weakPoints, setWeakPoints] = useState<WeakPoint[]>([]);
  const [myStats, setMyStats] = useState<{ questionCount: number; quizAccuracy: number; completedQuests: number; totalQuests: number; grade: string; xp: number; xpToNext: number } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { publishedFiles, fetchFiles } = useLectureFiles();

  // ─── 초기 데이터 로드 ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!courseId) return;
    fetchFiles(courseId);

    getChatHistory(courseId)
      .then((history) => {
        const summaryCard: ChatMessage = { id: "summary-1", role: "ai", content: "", isSummary: true };
        setMessages([summaryCard, ...history]);
      })
      .catch(() => {
        setMessages([{ id: "summary-1", role: "ai", content: "", isSummary: true }]);
      })
      .finally(() => setMessagesLoading(false));

    getQuests(courseId)
      .then(setQuests)
      .catch(() => setQuests([]))
      .finally(() => setQuestsLoading(false));

    getMyWeakPoints(courseId).then(setWeakPoints).catch(() => setWeakPoints([]));
    getMyStats(courseId).then(setMyStats).catch(() => {});
    getNotifications(courseId).then(setNotifications).catch(() => setNotifications([]));
  }, [courseId, fetchFiles]);

  // ─── 채팅 자동 스크롤 ────────────────────────────────────────────────────────

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── 알림 외부 클릭 닫기 ─────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── 강의 자료 주차별 그룹핑 ─────────────────────────────────────────────────

  const lectureMaterials = useMemo(() => {
    const grouped: Record<string, { week: string; title: string; publishedAt: string; items: { label: string; pages: string; url?: string }[] }> = {};
    publishedFiles.forEach((f) => {
      if (!grouped[f.week]) {
        grouped[f.week] = { week: f.week, title: f.topic, publishedAt: f.uploadedAt, items: [] };
      }
      grouped[f.week].items.push({ label: f.name.replace(".pdf", ""), pages: f.size, url: f.url });
    });
    return Object.values(grouped).sort((a, b) => {
      const na = parseInt(a.week) || 0;
      const nb = parseInt(b.week) || 0;
      return nb - na;
    });
  }, [publishedFiles]);

  const summary = useMemo(() => buildSummaryFromLatest(publishedFiles), [publishedFiles]);

  // ─── 핸들러 ─────────────────────────────────────────────────────────────────

  const markAllRead = useCallback(() => {
    markAllNotificationsRead(courseId).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [courseId]);

  const markRead = useCallback((id: string) => {
    markNotificationRead(courseId, id).catch(() => {});
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, [courseId]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || sending) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    // 로딩 placeholder
    const loadingId = `loading-${Date.now()}`;
    setMessages((prev) => [...prev, { id: loadingId, role: "ai", content: "…" }]);

    try {
      const aiReply = await apiSendMessage(courseId, input);
      setMessages((prev) => prev.map((m) => m.id === loadingId ? { ...aiReply, id: loadingId } : m));
    } catch {
      setMessages((prev) => prev.map((m) =>
        m.id === loadingId ? { ...m, content: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요." } : m
      ));
    } finally {
      setSending(false);
    }
  }, [courseId, input, sending]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const notifIcon = (type: Notification["type"]) => {
    if (type === "message") return <Megaphone size={14} className="text-[#37b1b1]" />;
    if (type === "quest") return <Target size={14} className="text-yellow-500" />;
    return <Sparkles size={14} className="text-purple-500" />;
  };

  const notifBg = (type: Notification["type"]) => {
    if (type === "message") return "bg-[#f0fdfd]";
    if (type === "quest") return "bg-yellow-50";
    return "bg-purple-50";
  };

  const difficultyColor: Record<string, string> = {
    쉬움: "bg-green-100 text-green-700",
    보통: "bg-yellow-100 text-yellow-700",
    어려움: "bg-red-100 text-red-700",
  };

  const displayName = user?.name ?? "학생";
  const nameInitial = displayName.charAt(0);

  return (
    <div className="h-screen bg-[#F7F6FB] flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-4 flex-shrink-0">
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft size={16} /><span className="text-sm">홈</span>
        </button>
        <div className="w-px h-5 bg-gray-200" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#37b1b1] flex items-center justify-center">
            <span className="text-white text-xs" style={{ fontWeight: 700 }}>CT</span>
          </div>
          <div>
            <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>강의 워크스페이스</p>
            <p className="text-xs text-gray-400">Custom-TA AI 조교</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications((v) => !v)}
              className="relative w-9 h-9 rounded-xl bg-gray-50 hover:bg-[#f0fdfd] border border-gray-200 hover:border-[#37b1b1]/40 flex items-center justify-center transition-colors"
            >
              <Bell size={16} className={unreadCount > 0 ? "text-[#37b1b1]" : "text-gray-400"} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center" style={{ fontWeight: 700 }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Bell size={14} className="text-[#37b1b1]" />
                    <span className="text-sm text-gray-800" style={{ fontWeight: 600 }}>알림</span>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-[#e0f7f7] text-[#1d6e6e] rounded-full px-2 py-0.5" style={{ fontWeight: 600 }}>{unreadCount}개 새 알림</span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-[#37b1b1] hover:text-[#1d6e6e] transition-colors" style={{ fontWeight: 500 }}>
                      모두 읽음
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center">
                      <Bell size={24} className="text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">새 알림이 없습니다.</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <button key={n.id} onClick={() => markRead(n.id)}
                        className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0 ${!n.read ? "bg-[#fafffe]" : ""}`}>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${notifBg(n.type)}`}>
                          {notifIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-xs text-gray-800" style={{ fontWeight: 600 }}>{n.title}</p>
                            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#37b1b1] flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{n.content}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-gray-400">{n.from}</span>
                            <span className="text-[10px] text-gray-300">·</span>
                            <span className="text-[10px] text-gray-400">{n.time}</span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                  <p className="text-[11px] text-gray-400 text-center">교강사가 보내는 메시지와 퀘스트 알림이 표시됩니다.</p>
                </div>
              </div>
            )}
          </div>

          <span className="text-sm text-gray-500">{displayName} 학생</span>
          <div className="w-8 h-8 rounded-full bg-[#e0f7f7] flex items-center justify-center text-[#1d6e6e] text-sm" style={{ fontWeight: 600 }}>
            {nameInitial}
          </div>
          <button onClick={() => logout().then(() => navigate("/"))} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">로그아웃</button>
        </div>
      </header>

      {/* 3-Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <aside className="w-64 bg-white border-r border-gray-100 flex flex-col overflow-y-auto flex-shrink-0">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#e0f7f7] flex items-center justify-center text-[#1d6e6e]" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                {nameInitial}
              </div>
              <div>
                <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{displayName}</p>
                <p className="text-xs text-gray-400">수강생</p>
              </div>
            </div>

            {myStats && (
              <>
                <div className="bg-gradient-to-br from-[#f0fdfd] to-[#e0f7f7] border border-[#b3e5e5] rounded-xl p-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">현재 등급</span>
                    <span className="text-lg">
                      {myStats.grade === "A" ? "🥇" : myStats.grade === "B" ? "🥈" : "🥉"}
                    </span>
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-2xl text-[#1d6e6e]" style={{ fontWeight: 700 }}>{myStats.grade}</span>
                    <span className="text-xs text-gray-400 pb-1">등급</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>다음 등급까지</span>
                    <span className="text-[#37b1b1]" style={{ fontWeight: 600 }}>{myStats.xp} / {myStats.xpToNext} XP</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#37b1b1] to-[#1d6e6e] rounded-full"
                      style={{ width: `${Math.min(100, Math.round(myStats.xp / myStats.xpToNext * 100))}%` }} />
                  </div>
                </div>
              </>
            )}

            <button onClick={() => setShowQuestModal(true)}
              className="w-full flex items-center justify-between bg-[#37b1b1] hover:bg-[#2a9090] text-white rounded-xl px-4 py-2.5 transition-colors">
              <div className="flex items-center gap-2">
                <Target size={16} /><span className="text-sm" style={{ fontWeight: 600 }}>나의 퀘스트</span>
              </div>
              <div className="flex items-center gap-1">
                {questsLoading
                  ? <Loader2 size={12} className="animate-spin opacity-60" />
                  : <span className="text-xs bg-white/20 rounded-full px-1.5 py-0.5">{quests.length}</span>
                }
                <ChevronRight size={14} />
              </div>
            </button>
          </div>

          {myStats && (
            <div className="p-5">
              <p className="text-xs text-gray-400 mb-3" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>이번 주 학습 현황</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><MessageSquare size={14} className="text-blue-500" /></div>
                  <div><p className="text-xs text-gray-400">AI 질문 횟수</p><p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{myStats.questionCount}회</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center"><CheckCircle size={14} className="text-green-500" /></div>
                  <div><p className="text-xs text-gray-400">퀴즈 정답률</p><p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{myStats.quizAccuracy}%</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center"><Trophy size={14} className="text-[#37b1b1]" /></div>
                  <div><p className="text-xs text-gray-400">완료한 퀘스트</p><p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{myStats.completedQuests} / {myStats.totalQuests}</p></div>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Center: Chat */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto py-4">
            {messagesLoading && (
              <div className="flex items-center justify-center py-12 gap-2 text-gray-300">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">대화 내용 불러오는 중...</span>
              </div>
            )}

            {messages.map((msg) => {
              if (msg.isSummary) {
                if (!summary) return null;
                return <SummaryCard key={msg.id} title={summary.title} bullets={summary.bullets} sources={summary.sources} />;
              }
              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="flex justify-end px-4 mb-4">
                    <div className="max-w-[70%] bg-[#37b1b1] text-white rounded-2xl rounded-tr-sm px-4 py-3">
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                );
              }
              // AI message
              const isLoading = msg.content === "…";
              return (
                <div key={msg.id} className="flex gap-3 px-4 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#e0f7f7] flex items-center justify-center flex-shrink-0">
                    <Zap size={14} className="text-[#37b1b1]" />
                  </div>
                  <div className="max-w-[75%]">
                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
                      {isLoading ? (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Loader2 size={13} className="animate-spin" />
                          <span className="text-sm">답변 생성 중...</span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                          {msg.content.split(/\*\*(.*?)\*\*/).map((part, i) =>
                            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                          )}
                        </p>
                      )}
                      {!isLoading && msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-400 mb-1">📎 출처</p>
                          <div className="flex flex-wrap gap-1">
                            {msg.sources.map((src) => (
                              <span key={src} className="inline-flex items-center gap-1 bg-[#f0fdfd] text-[#1d6e6e] text-xs rounded-full px-2 py-0.5">
                                <Link2 size={9} />{src}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {!isLoading && msg.quiz && (
                      <div className="mt-2 bg-[#f0fdfd] border border-[#b3e5e5] rounded-xl p-3">
                        <p className="text-xs text-[#1d6e6e] mb-2" style={{ fontWeight: 600 }}>🧠 O/X 퀴즈</p>
                        <p className="text-sm text-gray-800 mb-3">{msg.quiz.question}</p>
                        <div className="flex gap-2">
                          {msg.quiz.options.map((opt, i) => {
                            const isSelected = activeQuiz.msgId === msg.id && activeQuiz.selected === i;
                            const isCorrect = i === msg.quiz!.answer;
                            const showResult = activeQuiz.msgId === msg.id && activeQuiz.submitted;
                            return (
                              <button key={opt} onClick={() => { if (!activeQuiz.submitted) setActiveQuiz({ msgId: msg.id, selected: i, submitted: true }); }}
                                className={`flex-1 py-2 rounded-lg text-sm transition-colors ${showResult ? isCorrect ? "bg-green-100 text-green-700 border border-green-300" : isSelected ? "bg-red-100 text-red-700 border border-red-300" : "bg-white text-gray-400 border border-gray-200" : isSelected ? "bg-[#e0f7f7] text-[#1d6e6e]" : "bg-white text-gray-700 border border-gray-200 hover:bg-[#f0fdfd]"}`}>
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {activeQuiz.msgId === msg.id && activeQuiz.submitted && (
                          <p className={`text-xs mt-2 ${activeQuiz.selected === msg.quiz!.answer ? "text-green-600" : "text-red-600"}`}>
                            {activeQuiz.selected === msg.quiz!.answer ? "✅ 정답입니다!" : "❌ 오답입니다. 다시 학습해보세요."}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-100 bg-white px-4 py-3">
            <div className="flex gap-2 items-end">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="강의 내용에 대해 질문하세요."
                  disabled={sending}
                  className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 disabled:opacity-60"
                />
              </div>
              <button onClick={sendMessage} disabled={!input.trim() || sending}
                className="w-10 h-10 rounded-xl bg-[#37b1b1] hover:bg-[#2a9090] disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0">
                {sending ? <Loader2 size={16} className="text-white animate-spin" /> : <Send size={16} className="text-white" />}
              </button>
            </div>
            <p className="text-center text-xs text-gray-300 mt-2">이 AI 조교는 교수님이 업로드한 강의 자료만을 기반으로 답변합니다.</p>
          </div>
        </main>

        {/* Right Panel */}
        <aside className="w-72 bg-white border-l border-gray-100 flex flex-col flex-shrink-0">
          <div className="flex border-b border-gray-100 flex-shrink-0">
            <button onClick={() => setRightTab("note")}
              className={`flex-1 py-3 text-sm transition-colors ${rightTab === "note" ? "text-[#37b1b1] border-b-2 border-[#37b1b1] bg-[#f0fdfd]" : "text-gray-400 hover:text-gray-600"}`}
              style={{ fontWeight: rightTab === "note" ? 600 : 400 }}>
              AI 오답 노트
            </button>
            <button onClick={() => setRightTab("material")}
              className={`flex-1 py-3 text-sm transition-colors ${rightTab === "material" ? "text-[#37b1b1] border-b-2 border-[#37b1b1] bg-[#f0fdfd]" : "text-gray-400 hover:text-gray-600"}`}
              style={{ fontWeight: rightTab === "material" ? 600 : 400 }}>
              강의 자료
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {rightTab === "note" ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-400">AI가 분석한 취약 개념 목록입니다. 클릭해서 보충 자료를 확인하세요.</p>
                {weakPoints.length === 0 && (
                  <div className="py-8 text-center text-gray-300">
                    <AlertCircle size={24} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">아직 취약 개념이 없습니다.</p>
                    <p className="text-xs mt-1">AI 조교와 대화하고 퀴즈를 풀면 자동으로 분석됩니다.</p>
                  </div>
                )}
                {weakPoints.map((w) => (
                  <div key={w.id} className="border border-gray-100 rounded-xl overflow-hidden">
                    <button onClick={() => setExpandedWeak(expandedWeak === w.id ? null : w.id)}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                          <AlertCircle size={12} className="text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{w.keyword}</p>
                          <p className="text-xs text-gray-400">오답 {w.wrongCount}회 · {w.lastWrong}</p>
                        </div>
                      </div>
                      {expandedWeak === w.id ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                    </button>
                    {expandedWeak === w.id && (
                      <div className="px-3 pb-3 bg-gray-50 border-t border-gray-100">
                        <p className="text-xs text-gray-600 mt-2 mb-2 leading-relaxed">{w.summary}</p>
                        <a className="inline-flex items-center gap-1.5 text-xs text-[#37b1b1] hover:text-[#1d6e6e] cursor-pointer">
                          <FileText size={11} />{w.material} 다시 보기
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-[#f0fdfd] border border-[#b3e5e5] rounded-xl px-3 py-2.5 flex items-start gap-2">
                  <BookOpen size={12} className="text-[#37b1b1] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-[#1d6e6e] leading-relaxed">
                    강의자가 공개한 자료만 표시됩니다. AI는 전체 강의 자료를 학습해 질문에 답합니다.
                  </p>
                </div>

                {lectureMaterials.length === 0 && (
                  <div className="text-center py-10 text-gray-300">
                    <p className="text-sm">아직 공개된 강의 자료가 없습니다.</p>
                    <p className="text-xs mt-1">교강사가 자료를 공개하면 주차별로 여기에서 확인할 수 있어요.</p>
                  </div>
                )}

                {lectureMaterials.map((week) => (
                  <div key={week.week} className="border border-gray-100 rounded-xl overflow-hidden">
                    <button onClick={() => setExpandedWeek(expandedWeek === week.week ? null : week.week)}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs bg-[#e0f7f7] text-[#1d6e6e] rounded-full px-2 py-0.5" style={{ fontWeight: 600 }}>{week.week}</span>
                          <span className="text-xs text-gray-400">{week.publishedAt} 공개</span>
                        </div>
                        <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{week.title}</p>
                      </div>
                      {expandedWeek === week.week ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                    </button>
                    {expandedWeek === week.week && (
                      <div className="border-t border-gray-100 p-3 space-y-2">
                        {week.items.map((item) => (
                          <div key={item.label} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                                <FileText size={13} className="text-orange-500" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-700 truncate max-w-[150px]" style={{ fontWeight: 500 }}>{item.label}</p>
                                <p className="text-xs text-gray-400">{item.pages}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => item.url && window.open(item.url, "_blank", "noopener,noreferrer")}
                              disabled={!item.url}
                              className="text-gray-400 hover:text-[#37b1b1] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title={item.url ? "파일 열기" : "링크 없음"}
                            >
                              <ExternalLink size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Quest List Modal */}
      {showQuestModal && !activeQuest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-gray-900" style={{ fontWeight: 700 }}>나의 퀘스트 목록</h2>
                <p className="text-sm text-gray-400">완료하면 XP를 획득합니다</p>
              </div>
              <button onClick={() => setShowQuestModal(false)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              {questsLoading && (
                <div className="flex items-center gap-2 py-6 text-gray-300">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-sm">퀘스트 불러오는 중...</span>
                </div>
              )}

              {!questsLoading && quests.filter((q) => q.type === "ai").length > 0 && (
                <>
                  <p className="text-xs text-gray-400 mb-2" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>🤖 AI 퀘스트</p>
                  {quests.filter((q) => q.type === "ai").map((q) => (
                    <div key={q.id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{q.title}</p>
                        {q.difficulty && <span className={`text-xs rounded-full px-2 py-0.5 flex-shrink-0 ${difficultyColor[q.difficulty]}`}>{q.difficulty}</span>}
                      </div>
                      {q.description && <p className="text-xs text-gray-500 mb-3">{q.description}</p>}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          {q.deadline && <span>마감 {q.deadline}</span>}
                          {q.xp && <span className="flex items-center gap-1 text-yellow-600"><Zap size={10} />{q.xp} XP</span>}
                        </div>
                        <button onClick={() => { setShowQuestModal(false); setActiveQuest(q); }}
                          className="flex items-center gap-1.5 text-xs bg-[#37b1b1] text-white rounded-lg px-3 py-1.5 hover:bg-[#2a9090] transition-colors">
                          <Play size={11} />시작하기
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {!questsLoading && quests.filter((q) => q.type === "professor").length > 0 && (
                <>
                  <p className="text-xs text-gray-400 mt-4 mb-2" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>👨‍🏫 교수님 퀘스트</p>
                  {quests.filter((q) => q.type === "professor").map((q) => (
                    <div key={q.id} className="border-2 border-yellow-300 bg-yellow-50 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Star size={14} className="text-yellow-500 flex-shrink-0" />
                          <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{q.title}</p>
                        </div>
                        {q.difficulty && <span className={`text-xs rounded-full px-2 py-0.5 flex-shrink-0 ${difficultyColor[q.difficulty]}`}>{q.difficulty}</span>}
                      </div>
                      {q.description && <p className="text-xs text-gray-600 mb-3">{q.description}</p>}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {q.deadline && <span>마감 {q.deadline}</span>}
                          {q.xp && <span className="flex items-center gap-1 text-yellow-600"><Zap size={10} />{q.xp} XP</span>}
                        </div>
                        <button onClick={() => { setShowQuestModal(false); setActiveQuest(q); }}
                          className="flex items-center gap-1.5 text-xs bg-yellow-500 text-white rounded-lg px-3 py-1.5 hover:bg-yellow-600 transition-colors">
                          <Play size={11} />시작하기
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {!questsLoading && quests.length === 0 && (
                <div className="py-10 text-center text-gray-300">
                  <Target size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">아직 퀘스트가 없습니다.</p>
                  <p className="text-xs mt-1">교수님이 퀘스트를 발송하면 여기에 표시됩니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quest Start Modal */}
      {activeQuest && (
        <QuestStartModal
          quest={activeQuest}
          courseId={courseId}
          onClose={() => setActiveQuest(null)}
        />
      )}
    </div>
  );
}
