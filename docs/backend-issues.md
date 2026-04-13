# Custom-TA 백엔드 이슈 및 API 요구사항 문서

작성일: 2026-04-13  
대상: 백엔드 개발팀  
버전: v2

---

## 개요

프론트엔드에서 발견된 6가지 이슈 중, 프론트엔드 자체적으로 수정 가능한 부분은 이미 패치 완료되었습니다.  
아래 항목들은 **백엔드 구현 검토 또는 수정이 필요한 사항**입니다.

---

## 이슈 1: 알림 읽음 처리 — 새로고침 시 미반영

### 증상
학생이 알림을 클릭하여 읽음 처리해도, 페이지를 새로고침하면 다시 안 읽음 상태로 돌아옴.

### 원인
프론트엔드는 `PATCH /courses/{courseId}/notifications/{notificationId}/read` 및  
`PATCH /courses/{courseId}/notifications/read-all` 호출 후 로컬 상태를 optimistic update 합니다.  
그러나 새로고침 시 `GET /courses/{courseId}/notifications`를 다시 호출하면 백엔드에서 여전히 `read: false`로 응답하는 것으로 추정됩니다.

### 백엔드 확인 사항
1. `PATCH /courses/{courseId}/notifications/{notificationId}/read`  
   - 해당 알림의 `read` 필드를 DB에 `true`로 업데이트하는지 확인
   - 요청한 사용자 기준으로 읽음 처리되는지 (다른 학생 알림에 영향 없어야 함)

2. `PATCH /courses/{courseId}/notifications/read-all`  
   - 해당 코스 + 해당 사용자의 모든 알림을 `read: true`로 일괄 업데이트하는지 확인

3. `GET /courses/{courseId}/notifications`  
   - 응답에 각 알림의 `read` 상태가 **사용자별로 정확하게** 반영되는지 확인

### 기대 응답 스키마
```json
// GET /courses/{courseId}/notifications 응답
[
  {
    "id": "notif-001",
    "type": "quest",          // "message" | "quest" | "quiz"
    "title": "새 퀘스트 도착",
    "content": "4주차 퀘스트가 발송되었습니다.",
    "from": "홍길동 교수",
    "time": "방금 전",
    "read": true              // 사용자별 읽음 여부
  }
]
```

---

## 이슈 2: 완료한 퀘스트 처리 — 학생 재제출 방지

### 증상
학생이 퀘스트를 완료한 후에도 퀘스트 목록에서 다시 "시작하기" 버튼이 표시되어 재제출 가능.

### 프론트엔드 조치 (완료)
- 퀘스트 제출 성공(`POST /courses/{courseId}/quests/{questId}/submit`) 후, 로컬 상태에서 해당 퀘스트의 `completed: true`로 마킹
- 완료된 퀘스트는 "결과 보기" 버튼만 표시, 재제출 불가 UI 적용

### 백엔드 확인 사항
1. `GET /courses/{courseId}/quests` — 학생 입장에서 호출 시:
   - 응답에 `completed: boolean` 필드가 포함되어야 함 (학생이 이미 제출했는지 여부)
   - 페이지 새로고침 후에도 `completed: true`가 유지되어야 함

2. `POST /courses/{courseId}/quests/{questId}/submit`:
   - 이미 제출한 퀘스트에 재제출 시 `400` 또는 `409` 응답 반환
   - 오류 메시지: `{ "message": "이미 제출한 퀘스트입니다." }`

### Quest 응답 스키마 (추가 필드)
```json
// GET /courses/{courseId}/quests 응답 (학생 기준)
[
  {
    "id": "quest-001",
    "title": "4주차 인터페이스 개념 점검",
    "scope": "4주차 강의 전체",
    "difficulty": "보통",
    "questionCount": 5,
    "targetGroup": "전체 수강생",
    "status": "sent",
    "source": "manual",
    "type": "professor",
    "deadline": "2026-04-20",
    "xp": 100,
    "completed": true         // ← 학생이 이미 제출했으면 true
  }
]
```

---

## 이슈 3: 퀴즈/퀘스트 완료 후 통계(XP, 정답률) 반영

### 증상
퀘스트 제출 후 좌측 패널의 "퀴즈 정답률", "완료한 퀘스트", "XP" 수치가 즉시 반영되지 않음.

### 프론트엔드 조치 (완료)
- 퀘스트 제출 완료 콜백에서 `GET /courses/{courseId}/me/stats`를 재호출하여 즉시 갱신

### 백엔드 확인 사항
1. `POST /courses/{courseId}/quests/{questId}/submit` 처리 시:
   - DB에 제출 기록 저장
   - 학생의 XP를 퀘스트 `xpEarned` 기준으로 즉시 누적
   - `completedQuests` 카운터 즉시 증가

2. `GET /courses/{courseId}/me/stats` — 최신 데이터 반환 확인:
   - 캐싱이 있다면 제출 후 캐시 무효화 처리 필요

3. **채팅 내 O/X 퀴즈** 정답률 반영 (미구현 상태):
   - 현재 채팅 메시지의 `quiz` 필드로 퀴즈가 제공되나, 학생의 정답/오답 결과를 백엔드에 전송하는 API 없음
   - 필요 시 신규 API: `POST /courses/{courseId}/quiz/submit`
   - Request body: `{ "messageId": "msg-001", "selected": 0, "isCorrect": true }`
   - 이 데이터가 `quizAccuracy` 통계에 반영되어야 함

### Stats 응답 스키마
```json
// GET /courses/{courseId}/me/stats 응답
{
  "questionCount": 12,       // 이번 주 AI 질문 횟수
  "quizAccuracy": 75,        // 퀴즈 정답률 (%)
  "completedQuests": 3,      // 완료한 퀘스트 수
  "totalQuests": 5,          // 전체 퀘스트 수
  "grade": "B",
  "xp": 350,
  "xpToNext": 500
}
```

---

## 이슈 4: 학생 데이터가 교강사 대시보드에 정확히 전달되는지 확인

### 증상
교강사 대시보드 "학생 분석" 탭의 KPI 카드, 등급 분포, 키워드 분석 데이터가 실제 학생 활동과 일치하지 않을 수 있음.

### 백엔드 확인 사항

#### KPI 데이터
`GET /courses/{courseId}/analytics`
```json
{
  "studentCount": 50,
  "weeklyQuestionCount": 127,
  "weeklyQuestionDelta": 15,        // 지난 주 대비 증감률 (%)
  "avgEngagementRate": 72,          // 평균 학습 참여율 (%)
  "avgQuestAnswerRate": 85,         // 전체 퀘스트 정답률 (%)
  "gradeBreakdown": [
    { "name": "A 등급", "value": 10, "color": "#37b1b1" },
    { "name": "B 등급", "value": 25, "color": "#7fd9d9" },
    { "name": "C 등급", "value": 15, "color": "#b3e5e5" }
  ]
}
```

#### 키워드 통계
`GET /courses/{courseId}/analytics/keywords?week={주차}`  
- `week` 파라미터는 한국어 문자열: `"4주차"`, `"3주차"` 등 (URL 인코딩된 형태로 전달됨)
- 키워드는 해당 주차에 학생들이 AI에게 질문한 내용에서 추출된 상위 키워드

```json
[
  { "keyword": "인터페이스", "count": 34 },
  { "keyword": "추상 클래스", "count": 28 }
]
```

#### 등급 분포 → 학생 목록 연결
현재 프론트엔드는 등급 클릭 시 해당 등급의 학생 수만큼 더미 "학생 1, 학생 2..." 로 표시함.  
**실제 학생 이름/이메일을 표시하려면 아래 API 추가 검토 필요:**
- `GET /courses/{courseId}/analytics/students?grade=A` → 해당 등급 학생 목록 반환

---

## 이슈 5: AI 초안 생성에서 주차 기반 자료 필터링

### 증상
AI 초안 생성 시 학습 범위를 텍스트로만 입력하여 AI가 어느 주차 자료를 참조해야 하는지 명확하지 않음.

### 프론트엔드 조치 (완료)
- `AiDraftModal`에 주차 선택 드롭다운 추가 (업로드된 파일 기준 주차 목록 표시)
- 주차 선택 시 `scope` 필드 자동 입력
- `POST /courses/{courseId}/quests/ai-draft` 요청에 `week` 필드 추가

### 백엔드 확인/수정 사항
`POST /courses/{courseId}/quests/ai-draft` Request body에 `week` 파라미터 처리:

```json
// 요청 (변경됨)
{
  "scope": "4주차 인터페이스와 추상 클래스",
  "week": "4주차",               // ← 신규 파라미터
  "difficulty": "보통",
  "questionCount": 3,
  "optionCount": 4,
  "targetGroup": "전체 수강생 (50명)",
  "xp": 100,
  "description": "이번 주 핵심 개념 위주"
}
```

`week` 필드가 존재할 경우:
- RAG(검색 증강 생성) 시 해당 주차에 업로드된 파일만 참조
- 없을 경우 기존대로 전체 자료 참조

```json
// 응답 (변경 없음)
{
  "questions": [
    {
      "type": "multiple",
      "question": "인터페이스와 추상 클래스의 가장 큰 차이점은?",
      "options": ["다중 구현 가능 여부", "메서드 개수", "패키지 위치", "변수 타입"],
      "answer": 0
    }
  ]
}
```

---

## 이슈 6: 퀘스트 임시 저장 vs 바로 발송 버그

### 증상
"임시 저장" 버튼을 클릭해도 퀘스트가 바로 발송되는 현상.

### 원인 (프론트엔드 버그)
`CreateQuestModal`의 "임시 저장" 버튼:
```tsx
// 버그: onClick에 함수 참조 전달 시 React SyntheticEvent가 첫 번째 인수로 전달됨
<button onClick={handleSave}>임시 저장</button>

// handleSave 시그니처: async (sendAfterSave = false) => { ... }
// SyntheticEvent 객체는 truthy → sendAfterSave가 true로 평가 → 발송 실행
```

### 프론트엔드 조치 (완료)
```tsx
// 수정 후
<button onClick={() => handleSave(false)}>임시 저장</button>
```

### 백엔드 확인 사항
임시 저장(`createQuest`)과 발송(`sendQuest`)이 별도 API로 구분되어 있는지 확인:

1. `POST /courses/{courseId}/quests` → 퀘스트 생성 (status: "pending", 학생에게 미발송)
2. `POST /courses/{courseId}/quests/{questId}/send` → 발송 처리 (status: "sent", 학생에게 알림 전송)

이 두 API가 명확히 분리되어 있어야 프론트엔드의 "임시 저장 → 나중에 수정 → 발송" 워크플로우가 정상 작동합니다.

---

## 추가 권고 사항

### 알림 발송 트리거 (백엔드)
퀘스트 발송(`POST /courses/{courseId}/quests/{questId}/send`) 시 자동으로:
- 해당 퀘스트의 `targetGroup`에 속하는 학생들에게 알림 생성
- 알림 타입: `"quest"`, 제목: `"새 퀘스트 도착"`, 내용: 퀘스트 제목 포함

### 퀘스트 제출 응답 스키마
```json
// POST /courses/{courseId}/quests/{questId}/submit 응답
{
  "score": 4,
  "total": 5,
  "xpEarned": 80
}
```
- `score`: 맞은 개수
- `total`: 전체 문항 수
- `xpEarned`: 획득한 XP (비율 기반 계산 권장: `xp * score/total`)

---

## API 엔드포인트 전체 목록 (프론트엔드 기준)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/courses/{courseId}/notifications` | 알림 목록 조회 (학생용) |
| PATCH | `/courses/{courseId}/notifications/{id}/read` | 알림 읽음 처리 |
| PATCH | `/courses/{courseId}/notifications/read-all` | 전체 알림 읽음 처리 |
| GET | `/courses/{courseId}/quests` | 퀘스트 목록 (completed 필드 포함) |
| GET | `/courses/{courseId}/quests/{id}/content` | 퀘스트 문항 조회 |
| POST | `/courses/{courseId}/quests/{id}/submit` | 퀘스트 제출 |
| POST | `/courses/{courseId}/quests` | 퀘스트 임시 생성 |
| PUT | `/courses/{courseId}/quests/{id}` | 퀘스트 수정 |
| POST | `/courses/{courseId}/quests/{id}/send` | 퀘스트 발송 |
| DELETE | `/courses/{courseId}/quests/{id}` | 퀘스트 삭제 |
| POST | `/courses/{courseId}/quests/ai-draft` | AI 초안 생성 (week 파라미터 추가) |
| GET | `/courses/{courseId}/me/stats` | 학생 개인 통계 |
| GET | `/courses/{courseId}/me/weak-points` | 취약 개념 조회 |
| GET | `/courses/{courseId}/analytics` | 교강사 KPI 조회 |
| GET | `/courses/{courseId}/analytics/keywords?week=` | 키워드 통계 |
| GET | `/courses/{courseId}/ai-proposals` | AI 제안 목록 |
| GET | `/courses/{courseId}/ai-config` | AI 설정 조회 |
| PUT | `/courses/{courseId}/ai-config` | AI 설정 저장 |
