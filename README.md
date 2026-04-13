# Custom-TA v2

> AI 기반 맞춤형 교육 보조 플랫폼 — 학생과 강사를 위한 스마트 학습 환경

---

## 서비스 소개

**Custom-TA v2**는 강사가 강의 자료를 업로드하면, AI가 해당 자료를 학습하여 학생들의 질문에 답변하고 퀘스트(학습 과제)를 자동 생성해주는 AI 기반 교육 플랫폼입니다.

| 역할 | 주요 기능 |
|------|-----------|
| **학생** | AI 채팅 질의응답, 퀘스트 풀기, 강의 자료 열람 |
| **강사** | 강의 자료 업로드, 퀘스트 생성/배포, 학생 참여도 분석 대시보드 |

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
│       ├── AuthContext.tsx       # 인증 상태 전역 관리
│       ├── AuthPage.tsx          # 로그인/회원가입
│       ├── CodeEntryPage.tsx     # 수강 코드 입력
│       ├── LandingPage.tsx       # 메인 랜딩
│       ├── StudentWorkspace.tsx  # 학생 3-column 워크스페이스
│       ├── InstructorCoursePage.tsx
│       ├── InstructorDashboard.tsx
│       ├── ProtectedRoute.tsx    # 역할 기반 라우트 보호
│       └── ui/                   # shadcn/ui 공통 컴포넌트
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
│   └── index.ts      # 도메인 타입 정의 (AuthUser, Course, Quest, ChatMessage …)
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
AuthUser   → id, name, email, role (student | instructor)
Course     → id, name, description, studentCount, authCode
Quest      → id, title, scope, difficulty, questionCount, status
ChatMessage → id, role (ai | user), content, sources, quiz
UploadedFile → id, name, week, topic, ragStatus (indexing | ready)
```

---

## 라이선스

- UI 컴포넌트: [shadcn/ui](https://ui.shadcn.com/) — MIT License
- 이미지: [Unsplash](https://unsplash.com/) — Unsplash License
- 자세한 내용: [`ATTRIBUTIONS.md`](./ATTRIBUTIONS.md)
