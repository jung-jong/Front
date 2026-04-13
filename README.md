# Custom-TA v2

> **강사의 시간을 돌려주고, 학생의 성장을 가시화하는** AI 맞춤형 교육 보조 플랫폼

[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://vercel.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss)](https://tailwindcss.com)

---

## 우리가 해결하는 문제 (Pain Points)

현장 교육에는 구조적으로 해결되지 않은 두 가지 고질적 문제가 있습니다.

### 강사 측

| 페인 포인트 | 현실 |
|-------------|------|
| **반복 질의에 소모되는 시간** | 수업 외 시간에도 동일한 질문이 반복되어 강의 준비 시간이 줄어든다 |
| **학생 수준 파악의 어려움** | 수십~수백 명의 개별 이해도를 강사 혼자 실시간으로 파악하기 불가능하다 |
| **문제 출제의 높은 비용** | 퀘스트·시험 문제를 직접 제작하는 데 많은 시간과 노력이 든다 |
| **강의 방향성과 AI의 불일치** | 범용 AI는 강사의 교육 철학과 강의 자료를 반영하지 못한다 |

### 학생 측

| 페인 포인트 | 현실 |
|-------------|------|
| **질문 기회의 부재** | 수업 시간 외에 즉각적으로 질문할 창구가 없다 |
| **자기 약점을 모른다** | 어디서 막히는지, 무엇이 부족한지 객관적으로 알 수 없다 |
| **일방향 학습의 한계** | 개인 수준에 맞춰진 피드백 없이 동일한 속도로만 진행된다 |
| **성취감 없는 공부** | 진도와 성취도가 눈에 보이지 않아 동기 부여가 어렵다 |

---

## 서비스 소개

**Custom-TA v2**는 강사가 업로드한 강의 자료를 기반으로 작동하는 **교육 특화 RAG(Retrieval-Augmented Generation) AI 플랫폼**입니다.

범용 AI가 아닌, **강사의 자료와 방향성에 완전히 맞춰진 AI**가 학생 질의응답을 처리하고, 학생 데이터를 분석하여 강사에게 객관적 지표를 제공합니다.

```
강사가 자료를 올린다
        ↓
AI가 해당 자료만을 학습한 전용 지식 베이스를 구축한다 (RAG)
        ↓
학생은 언제든 AI에게 질문하고, 맞춤 퀘스트를 받는다
        ↓
강사는 대시보드에서 학생별 성취도·참여도를 객관적으로 확인한다
```

---

## 핵심 가치 제안

### 강사를 위한 가치

| 기능 | 해결하는 문제 |
|------|--------------|
| **강의 자료 기반 맞춤 RAG AI** | 강사의 방향성과 일치하는 AI 응답 — 범용 AI의 오답·방향 이탈 없음 |
| **AI 문제 초안 자동 생성** | 강사는 검토·수정만 하면 됨 — 출제 시간 대폭 단축 |
| **학생 성취도 대시보드** | 참여율·퀘스트 정답률·빈출 질문 키워드를 한눈에 파악 |
| **취약 개념 자동 감지** | AI가 학생 데이터를 분석해 반복 오답 키워드를 강사에게 리포트 |
| **AI 기반 퀘스트 배포 제안** | 취약 그룹에 맞는 퀘스트를 AI가 직접 제안 |

### 학생을 위한 가치

| 기능 | 해결하는 문제 |
|------|--------------|
| **24/7 AI 질의응답** | 수업 시간 외에도 강의 자료 기반으로 즉시 답변 |
| **출처 명시 응답** | AI 답변의 신뢰도 보장 — 어떤 자료에서 왔는지 표시 |
| **맞춤형 퀘스트** | 내 수준과 취약점에 맞게 강사가 배포한 퀘스트 수행 |
| **XP 기반 성취 시각화** | 퀘스트 완료 시 XP 적립 — 내 성장이 눈에 보인다 |
| **진도·성취도 객관적 지표** | 학습 이력을 바탕으로 한 진도 추적 및 개인 약점 파악 |

---

## 사용자 흐름

### 강사 흐름

```
회원가입(강사) → 강의 개설 → 수강 코드 발급
→ 강의 자료 업로드 (RAG 인덱싱 자동 진행)
→ AI 퀘스트 초안 생성 → 검토 후 배포
→ 대시보드에서 학생 성취도 모니터링
```

### 학생 흐름

```
회원가입(학생) → 수강 코드 입력 → 강의 입장
→ AI 채팅으로 질문 → 출처 포함 답변 수신
→ 퀘스트 수행 → XP 획득 → 성취도 확인
```

---

## 관련 레포지토리

| 구분 | 링크 |
|------|------|
| **Frontend (이 레포)** | 현재 위치 |
| **Backend** | *(링크 추가 예정)* |

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui (MIT) |
| Charts | Recharts |
| Icons | Lucide React |
| Routing | React Router v7 |
| State | React Context + useState |
| API | REST (fetch / Bearer Token) |
| AI | RAG 기반 LLM (Backend 연동) |
| Deployment | Vercel |

---

## 화면 구성 (라우트)

```
/                    → 랜딩 페이지
/auth                → 로그인 / 회원가입 (학생 · 강사 선택)
/student/code        → 수강 코드 입력
/student             → 학생 워크스페이스 (3-column 레이아웃)
/instructor/courses  → 강사 강의 관리
/instructor          → 강사 대시보드 (분석)
```

---

## 프로젝트 구조

```
src/
├── app/
│   ├── App.tsx
│   ├── routes.tsx
│   └── components/
│       ├── AuthContext.tsx          # 인증 상태 전역 관리
│       ├── AuthPage.tsx             # 로그인/회원가입
│       ├── CodeEntryPage.tsx        # 수강 코드 입력
│       ├── LandingPage.tsx          # 메인 랜딩
│       ├── StudentWorkspace.tsx     # 학생 3-column 워크스페이스
│       ├── InstructorCoursePage.tsx # 강의 자료 관리
│       ├── InstructorDashboard.tsx  # 성취도 분석 대시보드
│       ├── ProtectedRoute.tsx       # 역할 기반 라우트 보호
│       └── ui/                      # shadcn/ui 공통 컴포넌트
├── lib/
│   └── api.ts        # fetch 래퍼 (Bearer Token 자동 주입)
├── services/         # API 호출 레이어
│   ├── auth.ts
│   ├── chat.ts
│   ├── courses.ts
│   ├── files.ts
│   ├── quests.ts
│   └── students.ts
├── types/
│   └── index.ts      # 도메인 타입 (AuthUser, Course, Quest, ChatMessage …)
└── styles/
    ├── theme.css
    └── tailwind.css
```

---

## 로컬 개발 환경 설정

### 사전 요구사항

- Node.js 18+
- npm 9+
- Backend 서버 실행 중 (기본 포트: `8000`)

### 설치 및 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.production .env
# .env 파일에서 VITE_API_BASE_URL을 백엔드 주소로 변경

# 3. 개발 서버 실행
npm run dev
```

### 환경 변수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `VITE_API_BASE_URL` | 백엔드 API 주소 | `http://localhost:8000` |

### 빌드 / 미리보기

```bash
npm run build      # 프로덕션 빌드 (dist/)
npm run preview    # 빌드 결과 로컬 미리보기
npm run lint       # ESLint 검사
```

---

## 디자인 시스템 요약

| 항목 | 값 |
|------|----|
| Primary Color | `#37b1b1` |
| Primary Hover | `#2a9090` |
| Background | `#071f1f` → `#0d4545` (dark gradient) |
| Border Radius | `rounded-2xl` |
| Base Font Size | 14px |
| Spacing Unit | 8px |
| Animation | 200ms transition |

> 상세 가이드라인 → [`guidelines/Guidelines.md`](./guidelines/Guidelines.md)

---

## 주요 도메인 모델

```
AuthUser     → id, name, email, role (student | instructor)
Course       → id, name, description, studentCount, authCode
Quest        → id, title, scope, difficulty, questionCount, status, xp, completed
ChatMessage  → id, role (ai | user), content, sources, quiz
UploadedFile → id, name, week, topic, ragStatus (indexing | ready), isPublished
Notification → id, type (message | quest | quiz), title, content, from, time, read
WeakPoint    → keyword, wrongCount, summary, material
KpiData      → studentCount, weeklyQuestionCount, avgEngagementRate, gradeBreakdown
AiDraftRequest → scope, difficulty, questionCount, optionCount, targetGroup, week
```

---

## 최근 변경 이력

### v2.1 (2026-04-13)

| 분류 | 내용 |
|------|------|
| **버그 수정** | 알림 읽음 처리 — API 실패 시 서버 상태 재조회로 안정적 복원 |
| **버그 수정** | 임시 저장 버튼이 실제로 발송되던 버그 수정 (`SyntheticEvent → sendAfterSave` 오전달 문제) |
| **기능 개선** | 완료한 퀘스트 재풀기 방지 — "완료" 뱃지 표시 및 "결과 보기" 전용 뷰 |
| **기능 개선** | 퀘스트 완료 즉시 XP·통계(정답률, 완료 수) 좌측 패널에 실시간 반영 |
| **신규 기능** | AI 초안 생성에서 주차(week) 선택 드롭다운 추가 — 선택한 주차 자료 기반으로 문항 생성 |
| **문서** | 백엔드 이슈 및 API 요구사항 문서 추가 (`docs/backend-issues.md`) |

---

## 라이선스

- UI 컴포넌트: [shadcn/ui](https://ui.shadcn.com/) — MIT License
- 이미지: [Unsplash](https://unsplash.com/) — Unsplash License
- 자세한 내용: [`ATTRIBUTIONS.md`](./ATTRIBUTIONS.md)
