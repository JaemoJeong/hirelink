# HireLink — 작업 위임 문서 (Handoff)

> 다른 AI/개발자가 이어서 작업할 수 있도록 정리한 인수인계 문서.
> 사용자(JaemoJeong)의 채용 매칭 플랫폼 사이드 프로젝트.

> **⚠️ 토큰/시크릿은 이 파일에 직접 적지 않음.** 다른 채널(Notion, 1Password, 비공개 채팅 등)로 별도 공유.
> 로컬 토큰 모음은 `~/.hirelink-secrets.env` (gitignore됨, 사용자가 채팅으로 직접 전달)에 있다고 가정.

---

## 1. 한 줄 요약

**HireLink**는 명문대생-기업 매칭에 특화된 커리어 플랫폼 (엘리트잡 elitejob.co.kr 벤치마킹).
React + Vite + Supabase + Vercel 스택. **MVP 배포 완료 상태**, 디자이너 1명과 협업 중.

---

## 2. 즉시 접속 가능한 자원

| 항목 | URL |
|---|---|
| **라이브 사이트** | https://hirelink-app.vercel.app |
| **GitHub Repo** | https://github.com/JaemoJeong/hirelink |
| **Supabase 대시보드** | https://supabase.com/dashboard/project/ycoxhcplwzxegtjjeuec |
| **Vercel 대시보드** | https://vercel.com (프로젝트명: `hirelink`) |
| **Google Analytics** | https://analytics.google.com (측정 ID: `G-8892DXGPXJ`) |
| **Resend 대시보드** | https://resend.com |
| **로컬 작업 디렉토리** | `/home/jaemo/elite-clone` |

---

## 3. 사용자(JaemoJeong) 정보

- **이메일**: cbssun02@gmail.com (모든 외부 서비스 가입 계정)
- **GitHub 사용자명**: JaemoJeong
- **테스트 계정 (KAIST)**: gosfl4760@kaist.ac.kr — 학교 인증 완료 상태
- **언어**: 한국어 선호. 짧고 직설적인 답변 원함

### 협업자
- **디자이너**: hwiOh-afk (GitHub) / hwi040518@gmail.com
- GitHub repo collaborator 권한 부여됨 (수락 여부는 확인 필요)
- 테스트 계정 발급: `hwi040518@gmail.com` / 비번은 별도 전달

---

## 4. 필요한 토큰 (별도 채널로 전달)

운영에 필요한 토큰 종류:
- **Supabase Access Token** (CLI용, `sbp_...` 형식)
- **GitHub PAT** (push 권한, `ghp_...` 형식 — 한 번 채팅에 노출됐으므로 폐기/재발급 권장)
- **Vercel API Token** (`vcp_...` 형식)
- **Resend API Key** (`re_...` 형식, Supabase Edge Function 시크릿으로만 사용)

→ 사용자에게 직접 받아서 환경변수로 등록 후 사용. 절대 git에 커밋하지 말 것.

### 프로덕션 환경변수 (Vercel + 로컬 `.env`)
```
VITE_SUPABASE_URL=https://ycoxhcplwzxegtjjeuec.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable_key>   # 사용자한테 받아서 채울 것
```
- `VITE_SUPABASE_PUBLISHABLE_KEY`는 anon/publishable 키라 클라이언트에 노출되는 게 정상.
- 실제 값은 사용자가 별도로 알려줌 (Vercel 환경변수에는 이미 설정되어 있음).

### Supabase Edge Function 시크릿 (이미 설정됨)
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL=EliteJob <onboarding@resend.dev>` — Resend 무료 발신 도메인. 본인 도메인 미인증 상태라 `cbssun02@gmail.com`으로만 실제 메일 발송됨
- `ALLOW_DEV_VERIFICATION_CODE_RESPONSE` (미설정 = false) — true로 두면 OTP를 응답에 노출. **절대 프로덕션에서 켜지 말 것**

---

## 5. 기술 스택

- **Frontend**: React 19 + Vite 8, React Router v7, 순수 CSS
- **Fonts**: Pretendard (한글) + Fraunces (영문 세리프) + JetBrains Mono
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Email**: Resend (학교 OTP 인증)
- **분석**: Google Analytics G-8892DXGPXJ (index.html에 직접 삽입)
- **배포**: Vercel (main 브랜치 push 시 자동 배포)
- **Supabase 리전**: 도쿄 (무료 플랜 — 7일 비활동 시 자동 일시정지됨)

---

## 6. 디렉토리 구조

```
/home/jaemo/elite-clone/
├── HANDOFF.md                              # 이 문서
├── HireLink_디자인_가이드.md                # 디자인 시스템 가이드 (디자이너 작성)
├── vercel.json                             # SPA rewrite 설정
├── index.html                              # GA + 폰트 로딩
├── .env                                    # Supabase 키 (gitignore됨)
├── src/
│   ├── App.jsx                             # 라우터 + ScrollToTop
│   ├── App.css                             # 전역 스타일 시스템 (~4500줄)
│   ├── index.css                           # 컬러/폰트 변수
│   ├── main.jsx                            # AuthProvider wrap
│   ├── components/
│   │   ├── SiteLayout.jsx                  # 헤더/푸터/네비
│   │   └── ProtectedRoute.jsx              # 로그인 필수 가드
│   ├── lib/
│   │   ├── supabase.js                     # Supabase 클라이언트
│   │   └── platformApi.js                  # 모든 API 함수 (~3500줄)
│   ├── providers/
│   │   └── AuthProvider.jsx                # 인증 컨텍스트
│   ├── pages/
│   │   ├── HomePage.jsx                    # 디자이너가 새 레이아웃으로 리뉴얼
│   │   ├── JobsPage.jsx                    # 디자이너가 리뉴얼
│   │   ├── JobDetailPage.jsx               # 디자이너가 리뉴얼 (profile 매칭 패널 추가)
│   │   ├── CompaniesPage.jsx
│   │   ├── CompanyDetailPage.jsx
│   │   ├── BusinessPage.jsx
│   │   ├── AuthPage.jsx
│   │   ├── VerifyPage.jsx                  # 학교 인증
│   │   ├── CandidateDashboardPage.jsx      # /me 마이페이지
│   │   ├── CommunityPage.jsx + PostPage
│   │   ├── InboxPage.jsx
│   │   ├── NotificationsPage.jsx
│   │   ├── ResumeMakerPage.jsx             # 라우트 미연결 (App.jsx에 없음)
│   │   └── NotFoundPage.jsx
│   └── data/mockData.js                    # 폴백용 샘플 데이터
└── supabase/
    ├── README.md
    ├── functions/send-school-verification-code/
    │   └── index.ts                        # OTP 메일 발송 Edge Function
    └── migrations/                         # 33개 SQL 마이그레이션
        ├── 0001~0028: 초기 스키마
        ├── 0029: 학교 OTP 인증
        ├── 0030: (deleted dev RPC 흔적)
        ├── 0031: digest() 스키마 fix
        ├── 0032: 시드 데이터 (15 기업 + 23 공고)
        └── 0033: 보안 hardening (RLS 강화)
```

### 삭제된 페이지 (이전에 있었으나 제거됨)
- `AdminPanelPage.jsx`, `AdminApplicationsPage.jsx`, `AdminOpsPage.jsx`
- `PartnerPage.jsx`, `PartnerInvitePage.jsx`
- `SetupStatusPage.jsx`, `DemoPlaybookPage.jsx`

---

## 7. 활성 라우트

| 경로 | 보호 | 설명 |
|---|---|---|
| `/` | 공개 | 홈 (히어로 + 추천 공고 + 인증 학교) |
| `/jobs` | 공개 | 채용공고 목록 + 필터 |
| `/jobs/:slug` | 공개 | 공고 상세 (지원은 로그인 필수) |
| `/companies` | 공개 | 기업 디렉토리 |
| `/companies/:slug` | 공개 | 기업 상세 + 질문 |
| `/business` | 공개 | B2B 랜딩 |
| `/auth` | 공개 | 로그인/회원가입 |
| `/me` | 로그인 | 마이페이지 (지원 현황) |
| `/verify` | 로그인 | 학교 이메일 OTP 인증 |

---

## 8. 최근 작업 히스토리 (가장 최신 순)

### 직전 세션 (보수자 점검 결과 P0/P1 수정)
- **commit 407bc20**: 보안/배포 hardening
  - `vercel.json` 추가 — SPA 딥링크 rewrite
  - Edge Function: Resend 실패 시 challenge row 삭제 후 502. `debugCode` 응답에서 기본 비활성화
  - `platformApi.requestSchoolEmailVerificationCode`: dev RPC 폴백 제거
  - `VerifyPage`: 응답의 `debugCode` 화면 노출 제거
  - `0033_security_hardening.sql`:
    - `school_email_verification_challenges` SELECT → admin only
    - `applications` UPDATE 정책에서 `user_id=auth.uid()` 제거 (RPC 경유 강제)
    - `dev_request_school_email_verification_code` RPC DROP

### 이전 세션들 (요약)
- **commit e0a9eba**: 관리자/파트너 페이지 전부 삭제, 일반 유저 구조로 단순화
- **commit 036a1ae**: (디자이너) JobDetailPage 프로필 매칭 패널
- **commit 8353eb4**: (디자이너) 홈/공고 럭셔리 에디토리얼 리디자인
- **commit efb1a10**: 디자인 리뉴얼 시도 (이후 디자이너가 다시 리뉴얼)
- **commit 10b0cd0**: 브랜딩 엘리트잡 → HireLink
- **commit cc35d0d**: API 타임아웃 6초로 확대
- **commit 80fedb6**: Google Analytics 연결
- **commit 48ce68e**: 초기 커밋

---

## 9. 외부 보수자 점검 결과 (직전 세션 직전)

P0/P1은 모두 수정 완료. 남은 항목:

### 보수자 지적 — UX/품질 (미해결, 디자이너 작업 영역으로 미룸)
- `npm run lint` 실패 (8 errors, 5 warnings)
- 푸터에 `/community`, `/terms`, `/privacy`, `/support`, `/notice` 링크 있으나 라우트 없음
- `CompanyDetailPage.jsx`에 깨진 한글 (`로���`, `소��`, `포지���` 등)
- 홈은 실제 Supabase 공고가 아니라 `mockData` 사용 중
- SEO: `index.html` 고정 메타만 있음 (페이지별 동적 변경 없음)

### 보수자가 칭찬한 부분
- 라우팅 구조, AuthProvider, Supabase API 레이어
- 마이그레이션 관리, lazy loading
- 디자인 톤 일관성

---

## 10. DB 상태

### 시드 데이터 (현재 DB에 있음)
- **companies**: 15개 (쏘카, 토스, 배민, 카카오, 네이버, 쿠팡, 크래프톤, 스마트마인드AI, 오늘의집, 몰로코, 당근마켓, 센드버드, 하이퍼커넥트, 두나무, 채널톡)
- **jobs**: 23개 (개발/디자인/마케팅/데이터/보안/연구/기획 다양)
- **universities**: SNU, 연세, 고려, KAIST, POSTECH, MIT, Stanford, Oxford 등

### 주요 테이블
- `auth.users` (Supabase 기본)
- `profiles` (확장 프로필 — university_id, verification_status, user_role)
- `universities`, `university_domains`
- `companies`, `company_members`, `jobs`, `job_tags`
- `applications`, `application_status_history`
- `school_email_verification_challenges` (admin-only 읽기)
- `verification_requests`, `audit_logs`, `notifications`
- `coffee_chat_requests`, `inbox_threads`, `thread_messages`
- `community_posts`, `community_comments`, `community_reactions`, `community_reports`
- `resumes`, `resume_versions`
- `company_info_requests` (Q&A)

### Supabase CLI 사용법
```bash
cd /home/jaemo/elite-clone
export SUPABASE_ACCESS_TOKEN=<사용자에게 받은 토큰>
npx supabase link --project-ref ycoxhcplwzxegtjjeuec
npx supabase db query --linked "SELECT ..."
npx supabase db query --linked -f supabase/migrations/0033_security_hardening.sql
npx supabase functions deploy send-school-verification-code --no-verify-jwt
```

### DB 마이그레이션 적용 시 주의
- `npx supabase db push`는 0001부터 다시 적용하려고 시도해서 충돌 발생함
- 새 마이그레이션 적용은 `db query --linked -f <file>` 로 개별 실행

---

## 11. 로컬 개발 환경

```bash
cd /home/jaemo/elite-clone
npm install             # 처음 한 번만
npm run dev             # http://localhost:5173
npm run build           # 빌드 검증
npm run lint            # 린트 (현재 실패)
```

### 사용자 환경
- **OS**: Linux 6.8.0-52-generic (Ubuntu)
- **Shell**: bash
- **Node**: v20.19.3
- **외부 IP (현재 보고된 값)**: 143.248.55.96 (KAIST 네트워크)

### Git remote
- 토큰 없는 형태로 설정됨: `https://github.com/JaemoJeong/hirelink.git`
- push 시 토큰이 필요한 경우 GITHUB_PAT 환경변수로 주입. **URL에 박아넣지 말 것** (이전에 그렇게 했다가 채팅에 토큰 노출됨)

---

## 12. Supabase 무료 플랜 주의사항

- **일시정지 (pause)**: 7일간 활동 없으면 프로젝트 자동 정지
  - 증상: API 응답 없음, "project is paused" 에러, `ENOTFOUND` DNS 에러
  - 해결: 대시보드에서 Resume 버튼 클릭 (1-2분 소요)
- **콜드 스타트**: 첫 요청이 1-3초 느림
- **메일 발송 제한**: `cbssun02@gmail.com`로만 실제 발송 (Resend 무료 + 본인 도메인 미인증)

### 본인 도메인 인증 시
1. 도메인 구매 (예: `hirelink.kr`)
2. Resend dashboard → Domains → Add → DNS 레코드 등록
3. `RESEND_FROM_EMAIL` 시크릿 업데이트
4. Vercel custom domain 연결

---

## 13. 사용자 작업 스타일 (메모리)

- **결정 빠르고 짧게 답함**: 긴 설명 싫어함. "ok", "ㅇㅇ" 같은 짧은 답변 많음
- **승인 없이 진행하라고 요청한 적 있음**: 위에서 명시적으로 그러라고 했음
- **풀스택 작업을 한 번에 위임함**: 작은 confirm 단계 안 거치고 끝까지 처리하는 걸 선호
- **법적/보안 관점도 고려**: 단순 코딩 외에 비즈니스 관점도 가끔 물어봄
- **현재 DSP/AI 연구를 본업으로 함**: 사이드 프로젝트로 이 사이트 진행 중

---

## 14. 다음에 할 만한 작업 (Backlog)

### 즉시 처리 가능 (UX/품질)
- [ ] `CompanyDetailPage.jsx` 깨진 한글 수정 (`로딩`, `소개`, `포지션` 등)
- [ ] `npm run lint` 8 errors 해결 (대부분 unused vars, missing deps)
- [ ] `/community`, `/terms`, `/privacy`, `/support`, `/notice` 라우트 추가 또는 푸터 링크 비활성화
- [ ] HomePage가 mockData 대신 실제 `listJobs()` 호출

### 기능 확장
- [ ] 커피챗 기능 (현재 DB 스키마는 있으나 UI 미연결)
- [ ] 이력서 빌더 (`ResumeMakerPage.jsx` 존재하지만 라우트 미연결)
- [ ] 프로필 편집 (마이페이지에서 직접 수정)
- [ ] SEO 메타 (react-helmet-async)

### 운영 준비
- [ ] 커스텀 도메인 (`hirelink.kr` 등) + Resend 도메인 인증
- [ ] 개인정보처리방침 / 이용약관 페이지
- [ ] 사업자등록 (실제 서비스 런칭 시)
- [ ] mock 시드 데이터를 실제 파트너 기업으로 교체 또는 가상 회사로 변경

### 인프라
- [ ] Supabase 유료 플랜 (월 $25) — pause 방지 + 더 빠른 응답
- [ ] 모바일 반응형 점검 (1080px / 720px 브레이크포인트)
- [ ] 접근성 (aria 강화)

---

## 15. 인계 시 추천 첫 액션

1. **이 문서 끝까지 읽기**
2. **현재 라이브 사이트 접속** → 동작 확인 (https://hirelink-app.vercel.app)
3. **Supabase가 paused인지 확인** → 필요 시 Resume
4. **`git pull origin main`** → 최신 코드 받기 (디자이너가 push 했을 수 있음)
5. **`npm install && npm run dev`** → 로컬 환경 검증
6. 사용자에게 토큰 4종(`SUPABASE_ACCESS_TOKEN`, `GITHUB_PAT`, `VERCEL_TOKEN`, `RESEND_API_KEY`) 받기
7. 사용자에게 "이어서 뭐 할까요?" 짧게 물어보고 시작

---

## 16. 톤 & 응답 스타일

- 짧고 직설적. 영어 술어 섞임 OK
- 코드 변경은 먼저 짧게 설명 → 변경 → 결과 보고
- 사용자가 "ㅇㅋ" 하면 confirm 없이 끝까지 진행
- 한국어 답변 기본. 기술 용어는 영어 그대로

---

*마지막 commit (이 문서 추가 직전): 407bc20 "보안/배포 hardening (P0~P1)"*
