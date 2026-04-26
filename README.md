# DevBridge

> AIBE5-Team2 · 3차 프로젝트 — **프리랜서 ↔ 클라이언트 AI 매칭 플랫폼**
>
> 자연어 질의와 구조화된 필터를 결합해 파트너/클라이언트/프로젝트를 서로 매칭합니다.

---

## 🚀 Quick Start

### 1. DB 접속 (`src/main/resources/application.properties`)

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/devbridge_db?serverTimezone=Asia/Seoul
spring.datasource.username=YOUR_USERNAME
spring.datasource.password=YOUR_PASSWORD

# JWT (개발 기본값 OK, 배포 시 교체)
app.jwt.secret=${JWT_SECRET:dev-bridge-default-secret-key-change-in-production-please-32bytes}
app.jwt.ttl-hours=24

# Gemini API (AI 매칭용, 미설정 시 룰베이스 폴백)
gemini.api.key=${GEMINI_API_KEY:}
```

### 2. Backend (Spring Boot)

```bash
./gradlew bootRun         # 8080 포트
```

### 3. Frontend (React + Vite)

```bash
cd frontend
npm install               # 최초 1회
npm run dev               # 5173 포트 (API는 /api → 8080 프록시)
```

### 4. 접속

- 프론트: http://localhost:5173
- 백엔드 API: http://localhost:8080/api

---

## 🛠️ Tech Stack

| 레이어 | 스택 |
|-----|-----|
| Frontend | React 19 (Vite), Zustand (persist), Axios, React Router v7, Lucide Icons |
| Backend | Spring Boot 3.4.0, Java 17, JPA/Hibernate, JJWT, Lombok |
| DB | MySQL 8 (`devbridge_db`) |
| AI | Google Gemini 2.0 Flash (매칭 스코어링) |
| Auth | JWT (HS256, 24h TTL) + Spring Security 의존성 포함(주석 처리) |
| Build | Gradle 9, npm |

---

## 📊 ERD — 현재 DB 연결 기준 최종 스냅샷

> 실제 운영 중인 JPA 엔티티 기준 **32개 테이블** · 최종 업데이트 **2026-04-27**

### 🔌 Feature Wiring Status

각 테이블이 **프론트 ↔ API ↔ DB** 3단 파이프로 연결되어 작동 중인지 표시합니다.

| 테이블 | Entity | Repository | API | Frontend | 상태 |
|-----|:-:|:-:|:-:|:-:|:-:|
| `users` | ✅ | ✅ | `/api/auth/*` | 로그인/회원가입 | 🟢 JWT HttpOnly 쿠키 |
| `users.bank_*` | ✅ | ✅ | `/api/bank/*` | 마이페이지 계좌 카드 | 🟢 1원 인증(TTL 5분/시도 5회) |
| `partner_profile` | ✅ | ✅ | `/api/partners/*` | 파트너 검색/프로필 | 🟢 |
| `client_profile` | ✅ | ✅ | `/api/clients/*` | 클라이언트 검색/프로필 | 🟢 |
| `partner_profile_stats` | ✅ | ✅ | ✅ | 파트너 카드 (평점/경력) | 🟢 |
| `client_profile_stats` | ✅ | ✅ | ✅ | 클라이언트 카드 | 🟢 |
| `partner_skill` | ✅ | ✅ | ✅ | 파트너 태그 | 🟢 |
| `client_preferred_skill` | ✅ | ✅ | ✅ | 선호 스킬 | 🟢 |
| `skill_master` | ✅ | ✅ | `/api/master/*` | 스킬 사전 | 🟢 |
| `project_field_master` | ✅ | ✅ | `/api/master/*` | 분야 드롭다운 | 🟢 |
| `projects` | ✅ | ✅ | `/api/projects/*` | 프로젝트 검색/등록 | 🟢 |
| `project_skill_mapping` | ✅ | ✅ | ✅ | 필수/우대 스킬 | 🟢 |
| `project_tags` | ✅ | ✅ | ✅ | 해시태그 | 🟢 |
| `project_application` | ✅ | ✅ | `/api/applications/*` | 프로젝트 지원/계약 | 🟢 |
| `project_milestones` | ✅ | ✅ | `/api/dashboard/projects/*/milestones` | 진행 대시보드 마일스톤 | 🟢 COMPLETED 가드 적용 |
| `project_escrows` | ✅ | ✅ | `/api/dashboard/projects/*/escrows` | 에스크로 보관/정산 | 🟢 마일스톤 승인 시 자동 RELEASED |
| `project_modules` | ✅ | ✅ | `/api/project-modules/*` | 7모듈 계약 협의 | 🟢 양측 수락 → 협의완료 |
| `project_meetings` | ✅ | ✅ | `/api/dashboard/projects/*/meeting` | 다음 미팅 일정 | 🟢 |
| `project_attachments` | ✅ | ✅ | `/api/dashboard/projects/*/attachments` | 진행 대시보드 파일 | 🟢 path traversal 방지 |
| `chat_room` | ✅ | ✅ | `/api/chat/rooms` | DM/계약/진행 미팅 채팅 | 🟢 Stream Chat |
| `notification` | ✅ | ✅ | `/api/notifications/*` | 진행 대시보드 알림 | 🟢 |
| `payment_methods` | ✅ | ✅ | `/api/payment-methods/*` | 결제수단 등록/삭제 | 🟢 |
| `user_interest_projects` | ✅ | ✅ | `/api/interests/projects` | 검색·대시보드 하트 | 🟢 낙관적 업데이트 |
| `user_interest_partners` | ✅ | ✅ | `/api/interests/partners` | 검색·대시보드 하트 | 🟢 낙관적 업데이트 |
| `partner_review` | ✅ | ✅ | `/api/reviews/partner/*` | 파트너 후기/별점 | 🟢 |
| `client_review` | ✅ | ✅ | `/api/reviews/client/*` | 클라이언트 후기/별점 | 🟢 |
| `partner_portfolios` | ✅ | ✅ | `/api/portfolios/*` | 포트폴리오 CRUD | 🟢 |
| `user_profile_detail` | ✅ | ✅ | `/api/profile/*` | 프로필 상세 (bio/GitHub) | 🟢 |
| `user_skill_detail` | ✅ | ✅ | `/api/profile/*` | 스킬 상세 (숙련도/경력) | 🟢 |
| `user_career` | ✅ | ✅ | `/api/profile/*` | 경력 사항 | 🟢 |
| `user_education` | ✅ | ✅ | `/api/profile/*` | 학력 사항 | 🟢 |
| `user_certification` | ✅ | ✅ | `/api/profile/*` | 자격증 | 🟢 |
| `user_award` | ✅ | ✅ | `/api/profile/*` | 수상 경력 | 🟢 |

> - 🟢 = 사용자가 프론트에서 조작 → 실제 DB에 기록 → 재조회까지 확인됨
> - 🟡 = API 연결 완료, 프론트 연동 작업 진행 중

### 🆕 최근 주요 변경 (2026-04-27)

#### 보안 하드닝 (배포 직전)
- **JWT HttpOnly 쿠키 마이그레이션** — `localStorage.accessToken` 노출 제거 → `Set-Cookie: HttpOnly; Secure(prod); SameSite=Lax`. `JwtAuthenticationFilter` 가 쿠키 우선, Authorization 헤더 fallback.
- **마일스톤 COMPLETED 가드 (HIGH-1)** — `ProgressDashboardService.ensureProjectActive()` 가 7개 mutation 진입점(createMilestone/submit/approve/requestRevision/cancelRevision/createEscrow/payMock) 에서 종료 프로젝트 변경 차단.
- **계좌 인증 레이스 강화 (HIGH-2)** — `BankVerificationService` 가 `Math.random()` → `SecureRandom`, TTL 5분 + 시도 5회 제한, `ConcurrentHashMap.compute()` 로 검증·시도카운트·만료 원자 처리.
- **StreamChatConfig** — 외부 시스템 프로퍼티 `STREAM_KEY`/`STREAM_SECRET` 우선 보존, 빈 값일 때 setProperty 자체 차단, 시크릿 미로깅.
- **`application-prod.properties`** — `ddl-auto=validate`, 모든 시크릿 env-required, actuator 노출 최소화, 쿠키 `secure=true`.

#### Mock → 라이브 전환 (3개 surface)
- **포트폴리오 추가 탭** (Client·Partner) — `MOCK_ONGOING/SELECTED_FOR_PORTFOLIO` → `projectsApi.myList(IN_PROGRESS/COMPLETED)` (Client) / `applicationsApi.myList()` filter (Partner) + `portfolioApi.setAdded()` 토글 영속화.
- **채팅 — 프로젝트 보여주기/제안하기 모달** — `CLIENT_MEETING_PROJECT_OPTIONS` (← `MOCK_INTEREST_PROJECTS`) → `projectsApi.myList()` onDemand fetch.
- **계약 채팅 contacts** — `MOCK_CONTRACT_CONTACTS` 기본값 → 빈 배열 sentinel. BE chat rooms fetch 가 유일한 데이터 소스.
- **Profile modal fallback** — `MOCK_*_FALLBACK` 4종 (careers/edu/portfolio/reviews) 제거 → 빈 배열로 전환, 가짜 정보 노출 차단.
- **데드코드 정리** — `MOCK_ACTIVE/ACCEPTED/CLOSED_PROJS`, `MOCK_PARTNERS_DETAIL`, `MOCK_MANAGE_PROJECTS`, `MOCK_EVAL_PENDING/RECEIVED/EXPIRED`, `MOCK_CONTACTS`, `MOCK_PROJECT_MEETING_CONTACTS` 등 약 1,128 line 삭제 / 250 line 유지.

#### 진행 프로젝트 시스템 완성
- **마일스톤 라이프사이클** — PENDING → IN_PROGRESS → SUBMITTED → APPROVED / REVISION_REQUESTED. 첨부파일 path traversal 방지.
- **에스크로 자동 동기화** — 마일스톤 APPROVED 시 DEPOSITED → RELEASED 자동 전환. 결제 mock + 정산.
- **7모듈 계약 협의** — `project_modules` (scope/deliverable/schedule/payment/revision/completion/terms) 양측 수락 패턴 (`_nego.proposerAccepted` + `workerAccepted`) 으로 협의완료 도달 시 IN_PROGRESS 전이.
- **3채팅방 타입** — DM(자유미팅) / negotiation(계약 협의) / ensure-meeting(진행 프로젝트). Stream Chat Java SDK 기반.

#### Profile/Modal 풀 리뉴얼
- **PartnerProfileModal/ClientProfileModal** — 9단계 통합: 헤더 sky-blue 그라데이션 + 원형 hero, full-text bio, 실제 skills/careers/educations/portfolio/reviews fetch, 탭 순서(intro→reviews→skills→career→education→portfolio), career 카드 expand, 포트폴리오 thumbnail+tags+navigate.
- **PartnerSearch 카드** — 기술 + 서비스분야 chip 통합 행.
- **지원자 배너 / 관심 파트너 카드** — 원형 hero + ⭐ 별점 통합.

#### 회원가입·온보딩 확장
- **업종/서비스분야(industry) 필드 추가** — 회원가입 시 12개 옵션 + "직접 입력" 커스텀.
- **티어 시스템** — SILVER / GOLD / PLATINUM / DIAMOND 4단계, 🥈🥇🌙💎 아이콘.

#### Schedule 탭 UI
- **FullCalendar timeGrid 정렬 수정** — `slotDuration` 30분 → 1시간, 슬롯 높이 24px → 52px. 이벤트가 시간 행 시작점에 정확히 정렬.
- **패널 높이** — 820 → 1100px (Partner+Client 양쪽 dashboard).

---

### 📜 이전 변경 (2026-04-20)

#### Backend 확장
- **프로필 상세 시스템** — `UserProfileDetail` + 5개 하위 테이블 (`UserSkillDetail`, `UserCareer`, `UserEducation`, `UserCertification`, `UserAward`) 추가. `/api/profile/*` 엔드포인트로 일괄 CRUD 지원.
- **포트폴리오 시스템** — `PartnerPortfolio` 테이블 + `/api/portfolios/*` API 완성. 프로젝트 기반 또는 자유 작성 포트폴리오, `isAdded`/`isPublic` 플래그로 공개 범위 제어.
- **리뷰 시스템** — `PartnerReview` 테이블 + `/api/reviews/*` API. 파트너별 별점/후기, 중복 후기 방지 (reviewer + partner 조합 UNIQUE).
- **프로젝트 지원** — `ProjectApplication` 테이블 + `/api/applications/*` API. APPLIED → ACCEPTED/REJECTED → CONTRACTED → IN_PROGRESS → COMPLETED 라이프사이클.

#### Frontend 연동
- **포트폴리오 페이지/에디터** — `Partner_Portfolio.jsx`, `PortfolioDetailEditor.jsx`, `PortfolioAddManagementTab.jsx` 에서 백엔드 API로 CRUD 완료. 저장/불러오기/공개 전환 동작.
- **프로필뷰 확장** — `PartnerProfileView.jsx`, `ClientProfileView.jsx` 에서 `profileApi.getDetailByUsername()`으로 skills/careers/educations/certifications/awards 표시.
- **대시보드 통합** — 관심 프로젝트/파트너, 포트폴리오 관리, 프로젝트 등록 모두 실제 DB 연동 완료.

#### 성능 최적화 (N+1 제거)
- `PartnerService`/`ClientService`/`ProjectService` 의 `findAll()` 이 row 마다 자식 컬렉션을 별도 쿼리 (1000 records → 3000+ SQL) 하던 문제 해결.
- Repository 에 `findAllByProfiles(...)` / `findAllWithUser()` batch 쿼리 추가, `JOIN FETCH` 로 Skill 까지 함께 로드 → **SQL 3001 → 4개**.
- **프론트 표시 샘플링** — `partners.api.js` 외 3곳에 `.slice(0, SAMPLE_SIZE)` (DB 1000개 유지, 렌더링만 500개).

#### 기타
- **계좌 1원 인증 목업** — `users.bank_verified` 컬럼 + `BankVerificationController` 3개 엔드포인트. 마이페이지에서 3자리 코드 발급/검증 후 DB 저장.
- **찜(관심) 기능 end-to-end** — 두 interest 테이블 + 낙관적 UI 업데이트 + 실패 시 롤백.
- **홈 검색 AI 분류** — Home/Client_Home/Partner_Home 검색창 → 키워드 기반 분류 → `/partner_search | /client_search | /project_search?q=...` 로 이동 후 AI 매칭 자동 실행.
- **서비스분야 버튼 DB 정합성 수정** — CATEGORIES 배열에 `dbValue` 추가 (UI 라벨은 유지, 네비게이션만 DB 값 사용).
- **대시보드 수입/정산 달력** — 2025-11 ~ 2026-04, 약 35개 항목의 현실적 금액 목업 데이터.

---

## 📊 ERD 다이어그램

```mermaid
erDiagram
    USERS {
        bigint id PK
        varchar email UK
        varchar username UK
        varchar password
        varchar phone
        enum user_type "PARTNER/CLIENT"
        text interests
        varchar contact_email
        enum gender
        date birth_date
        varchar region
        varchar tax_email
        varchar fax_number
        varchar bank_name
        varchar bank_account_number
        varchar bank_account_holder_name
        boolean bank_verified "1원 인증 완료"
        varchar profile_image_url
        datetime created_at
        datetime updated_at
    }

    USER_PROFILE_DETAIL {
        bigint id PK
        bigint user_id FK_UK "1:1 users"
        text bio
        text strength_desc
        varchar github_url
        varchar github_handle
        varchar github_repo_url
        json profile_menu_toggles
        varchar verified_email_type "school|company"
        varchar verified_email
        datetime updated_at
    }

    USER_SKILL_DETAIL {
        bigint id PK
        bigint user_id FK
        varchar tech_name
        varchar custom_tech
        varchar proficiency "초급|중급|고급|전문가"
        varchar experience "1년 미만|1~3년|3~5년|5년 이상"
        varchar mode
        int sort_order
    }

    USER_CAREER {
        bigint id PK
        bigint user_id FK
        varchar company_name
        varchar main_tech
        varchar job_title
        varchar start_date
        varchar end_date
        boolean is_current
        varchar employment_type
        varchar role
        varchar level
        text description
        json projects "회사 내 프로젝트 목록"
        boolean verified_company
        varchar verified_email
        int sort_order
    }

    USER_EDUCATION {
        bigint id PK
        bigint user_id FK
        varchar school_type
        varchar school_name
        varchar track
        varchar major
        varchar degree_type
        varchar status
        varchar admission_date
        varchar graduation_date
        varchar gpa
        varchar gpa_scale
        varchar research_topic
        boolean verified_school
        varchar verified_email
        int sort_order
    }

    USER_CERTIFICATION {
        bigint id PK
        bigint user_id FK
        varchar cert_name
        varchar issuer
        varchar acquired_date
        int sort_order
    }

    USER_AWARD {
        bigint id PK
        bigint user_id FK
        varchar award_name
        varchar awarding
        varchar award_date
        text description
        int sort_order
    }

    PARTNER_PROFILE {
        bigint id PK
        bigint user_id FK_UK "1:1 users"
        varchar name
        varchar title
        varchar hero_key
        enum work_category
        json job_roles
        enum partner_type "INDIVIDUAL/TEAM/SOLE_PROPRIETOR/CORPORATION"
        enum preferred_project_type
        json work_available_hours
        json communication_channels
        enum dev_level "JUNIOR/MIDDLE/SENIOR_5_7Y/SENIOR_7_10Y/LEAD"
        enum dev_experience
        enum work_preference "REMOTE/ONSITE/HYBRID"
        varchar slogan
        varchar slogan_sub
        int salary_hour
        int salary_month
        varchar github_url
        varchar blog_url
        varchar youtube_url
        text bio
        text strength_desc
        varchar service_field "AI/커머스/웹사이트/교육/의료/핀테크/SaaS/모바일"
        enum grade "SILVER/GOLD/PLATINUM/DIAMOND"
        varchar avatar_color
    }

    CLIENT_PROFILE {
        bigint id PK
        bigint user_id FK_UK "1:1 users"
        enum client_type "INDIVIDUAL/TEAM/SOLE_PROPRIETOR/CORPORATION"
        varchar slogan
        varchar slogan_sub
        varchar org_name
        varchar industry
        varchar manager_name
        text bio
        text strength_desc
        json preferred_levels
        int preferred_work_type "0:대면/1:원격/2:혼합"
        int budget_min
        int budget_max
        int avg_project_budget
        enum grade
        varchar avatar_color
    }

    PARTNER_PROFILE_STATS {
        bigint id PK
        bigint partner_profile_id FK_UK "1:1"
        int experience_years
        int completed_projects
        double rating
        int response_rate
        int repeat_rate
        int availability_days
    }

    CLIENT_PROFILE_STATS {
        bigint id PK
        bigint client_profile_id FK_UK "1:1"
        int completed_projects
        int posted_projects
        double rating
        int repeat_rate
    }

    PARTNER_SKILL {
        bigint id PK
        bigint partner_profile_id FK
        bigint skill_id FK
    }

    CLIENT_PREFERRED_SKILL {
        bigint id PK
        bigint client_profile_id FK
        bigint skill_id FK
    }

    SKILL_MASTER {
        bigint id PK
        varchar name UK
    }

    PROJECT_FIELD_MASTER {
        int id PK
        varchar parent_category
        varchar field_name
    }

    PROJECTS {
        bigint id PK
        bigint user_id FK "등록자"
        enum project_type "OUTSOURCE/FULLTIME"
        varchar title
        varchar slogan
        varchar slogan_sub
        text desc
        text detail_content
        varchar service_field
        enum grade
        json work_scope
        json category
        enum visibility
        int budget_min
        int budget_max
        int budget_amount
        boolean is_partner_free
        date start_date
        int duration_months
        enum meeting_type
        enum meeting_freq
        date deadline
        enum status "RECRUITING/IN_PROGRESS/COMPLETED/CLOSED"
        enum outsource_project_type
        enum ready_status
        enum work_style "REMOTE/ONSITE/HYBRID"
        varchar work_location
        enum work_days
        int monthly_rate
        enum dev_stage
        enum team_size
        varchar avatar_color
        datetime created_at
        datetime updated_at
    }

    PROJECT_SKILL_MAPPING {
        bigint id PK
        bigint project_id FK
        bigint skill_id FK
        boolean is_required "필수T / 우대F"
    }

    PROJECT_TAGS {
        bigint id PK
        bigint project_id FK
        varchar tag
    }

    PROJECT_APPLICATION {
        bigint id PK
        bigint project_id FK
        bigint partner_user_id FK
        enum status "APPLIED/ACCEPTED/REJECTED/CONTRACTED/IN_PROGRESS/COMPLETED/WITHDRAWN"
        text message
        datetime applied_at
        datetime updated_at
    }

    PARTNER_REVIEW {
        bigint id PK
        bigint partner_profile_id FK
        bigint reviewer_user_id FK
        bigint project_id FK "optional"
        double rating "1.0~5.0"
        text content
        datetime created_at
    }

    PARTNER_PORTFOLIOS {
        bigint id PK
        bigint user_id FK
        varchar source_key UK "user_id와 조합"
        bigint source_project_id FK "optional"
        varchar title
        varchar period
        varchar role
        varchar thumbnail_url
        clob work_content
        clob vision
        clob core_features_json "JSON"
        clob technical_challenge
        clob solution
        clob tech_tags_json "JSON"
        varchar github_url
        varchar live_url
        clob sections_json "JSON"
        boolean is_added
        boolean is_public
        datetime created_at
        datetime updated_at
    }

    USER_INTEREST_PARTNERS {
        bigint id PK
        bigint user_id FK
        bigint partner_profile_id FK
        datetime created_at
    }

    USER_INTEREST_PROJECTS {
        bigint id PK
        bigint user_id FK
        bigint project_id FK
        datetime created_at
    }

    PROJECT_MILESTONES {
        bigint id PK
        bigint project_id FK
        int seq
        varchar title
        text description
        text completion_criteria
        bigint amount
        date start_date
        date end_date
        datetime submitted_at
        text submission_note
        varchar submission_file_url
        datetime approved_at
        text revision_reason
        varchar status "PENDING/IN_PROGRESS/SUBMITTED/APPROVED/REVISION_REQUESTED"
        datetime created_at
        datetime updated_at
    }

    PROJECT_ESCROWS {
        bigint id PK
        bigint project_id FK
        bigint milestone_id FK
        bigint amount
        bigint payer_user_id FK
        bigint payee_user_id FK
        varchar status "PENDING/DEPOSITED/RELEASED/REFUNDED"
        varchar payment_method
        bigint payment_method_id
        varchar payment_tx_id
        datetime deposited_at
        datetime released_at
        datetime refunded_at
        datetime created_at
        datetime updated_at
    }

    PROJECT_MODULES {
        bigint id PK
        bigint project_id FK
        varchar module_key "scope/deliverable/schedule/payment/revision/completion/terms"
        varchar status "미확정/논의 중/제안됨/협의완료"
        bigint last_modifier_id FK
        varchar last_modifier_name
        json data "_nego: {proposerAccepted, workerAccepted}"
        datetime created_at
        datetime updated_at
    }

    PROJECT_MEETINGS {
        bigint id PK
        bigint project_id FK_UK "1:1"
        varchar frequency_label
        datetime next_at
        varchar location_label
        text agenda
        datetime created_at
        datetime updated_at
    }

    PROJECT_ATTACHMENTS {
        bigint id PK
        bigint project_id FK
        varchar kind
        varchar name
        varchar url
        varchar mime_type
        bigint size_bytes
        varchar notes
        bigint uploader_user_id FK
        datetime created_at
    }

    CHAT_ROOM {
        bigint id PK
        bigint user1_id FK
        bigint user2_id FK
        varchar room_type "DIRECT_MESSAGE/NEGOTIATION/PROJECT_MEETING"
        bigint contract_negotiation_id
        varchar stream_channel_id UK
        varchar stream_channel_type
        datetime created_at
    }

    NOTIFICATION {
        bigint id PK
        bigint user_id FK
        varchar notification_type
        varchar title
        text message
        varchar related_entity_type
        bigint related_entity_id
        boolean is_read
        datetime created_at
    }

    PAYMENT_METHODS {
        bigint id PK
        bigint user_id FK
        varchar brand
        varchar last4
        varchar holder_name
        int exp_month
        int exp_year
        boolean is_default
        varchar nickname
        datetime created_at
        datetime updated_at
    }

    CLIENT_REVIEW {
        bigint id PK
        bigint client_profile_id FK
        bigint reviewer_user_id FK
        bigint project_id FK "optional"
        double rating
        double expertise
        double schedule
        double communication
        double proactivity
        text content
        datetime created_at
    }

    %% 관계 정의
    USERS ||--o| USER_PROFILE_DETAIL : "1:1"
    USERS ||--o{ USER_SKILL_DETAIL : "has"
    USERS ||--o{ USER_CAREER : "has"
    USERS ||--o{ USER_EDUCATION : "has"
    USERS ||--o{ USER_CERTIFICATION : "has"
    USERS ||--o{ USER_AWARD : "has"
    USERS ||--o| PARTNER_PROFILE : "1:1"
    USERS ||--o| CLIENT_PROFILE : "1:1"
    USERS ||--o{ PROJECTS : "creates"
    USERS ||--o{ USER_INTEREST_PARTNERS : ""
    USERS ||--o{ USER_INTEREST_PROJECTS : ""
    USERS ||--o{ PARTNER_PORTFOLIOS : "creates"
    USERS ||--o{ PROJECT_APPLICATION : "applies"
    USERS ||--o{ PARTNER_REVIEW : "writes"

    PARTNER_PROFILE ||--o| PARTNER_PROFILE_STATS : "1:1"
    PARTNER_PROFILE ||--o{ PARTNER_SKILL : "has"
    PARTNER_PROFILE ||--o{ USER_INTEREST_PARTNERS : ""
    PARTNER_PROFILE ||--o{ PARTNER_REVIEW : "receives"

    CLIENT_PROFILE ||--o| CLIENT_PROFILE_STATS : "1:1"
    CLIENT_PROFILE ||--o{ CLIENT_PREFERRED_SKILL : "prefers"

    SKILL_MASTER ||--o{ PARTNER_SKILL : ""
    SKILL_MASTER ||--o{ CLIENT_PREFERRED_SKILL : ""
    SKILL_MASTER ||--o{ PROJECT_SKILL_MAPPING : ""

    PROJECTS ||--o{ PROJECT_SKILL_MAPPING : ""
    PROJECTS ||--o{ PROJECT_TAGS : ""
    PROJECTS ||--o{ USER_INTEREST_PROJECTS : ""
    PROJECTS ||--o{ PROJECT_APPLICATION : ""
    PROJECTS ||--o{ PARTNER_REVIEW : "context"
    PROJECTS ||--o{ CLIENT_REVIEW : "context"
    PROJECTS ||--o{ PARTNER_PORTFOLIOS : "source"
    PROJECTS ||--o{ PROJECT_MILESTONES : "has"
    PROJECTS ||--o{ PROJECT_ESCROWS : "has"
    PROJECTS ||--o{ PROJECT_MODULES : "has"
    PROJECTS ||--o| PROJECT_MEETINGS : "1:1"
    PROJECTS ||--o{ PROJECT_ATTACHMENTS : "has"

    PROJECT_MILESTONES ||--o| PROJECT_ESCROWS : "1:1"
    USERS ||--o{ PROJECT_ESCROWS : "payer/payee"
    USERS ||--o{ PROJECT_MODULES : "modifies"
    USERS ||--o{ PROJECT_ATTACHMENTS : "uploads"
    USERS ||--o{ CHAT_ROOM : "participates"
    USERS ||--o{ NOTIFICATION : "receives"
    USERS ||--o{ PAYMENT_METHODS : "owns"
    USERS ||--o{ CLIENT_REVIEW : "writes"
    CLIENT_PROFILE ||--o{ CLIENT_REVIEW : "receives"
```

---

## 📋 테이블 설명

### 👤 User 도메인 (공통)
| 테이블 | 역할 | 핵심 포인트 |
|-----|-----|-----|
| **users** | 모든 사용자 공통 계정 | 로그인/연락처/계좌 · `user_type` 으로 파트너/클라이언트 구분 · `bank_verified` 1원 인증 상태 |
| **user_profile_detail** | 프로필 상세 정보 | 자기소개(bio), 강점(strengthDesc), GitHub URL/Handle, 프로필 섹션 가시성 토글, 이메일 인증 |
| **user_skill_detail** | 스킬 상세 | 기술명, 숙련도(초급/중급/고급/전문가), 경력 기간(1년 미만/1~3년/3~5년/5년 이상) |
| **user_career** | 경력 사항 | 회사명, 직책, 기간, 고용 형태, 회사 내 프로젝트 목록(JSON), 회사 이메일 인증 |
| **user_education** | 학력 사항 | 학교 유형/이름/전공, 학위, 재학 상태, 입학/졸업일, GPA, 학교 이메일 인증 |
| **user_certification** | 자격증 | 자격증명, 발급 기관, 취득일 |
| **user_award** | 수상 경력 | 수상명, 수여 기관, 수상일, 설명 |

### 🧑‍💻 Partner 도메인
| 테이블 | 역할 | 핵심 포인트 |
|-----|-----|-----|
| **partner_profile** | 프리랜서/개발자 프로필 | `users` 1:1 · 개발 레벨/경력/근무형태/단가/슬로건/GitHub |
| **partner_profile_stats** | 통계 집계 캐시 | 경력 연수, 완료 프로젝트, 평점, 응답률, 재계약률 — 조회 성능용 비정규화 |
| **partner_skill** | 보유 스킬 매핑 | (partner_profile_id, skill_id) — `skill_master` N:N — 검색/매칭용 |
| **partner_portfolios** | 포트폴리오 항목 | 프로젝트 기반 or 자유 작성, 제목/기간/역할/기술스택/GitHub/Live URL, 공개 범위 제어 |
| **partner_review** | 파트너 후기/별점 | 클라이언트가 파트너에게 남기는 평가, rating 1.0~5.0, (partner + reviewer) 조합 UNIQUE |

### 🏢 Client 도메인
| 테이블 | 역할 | 핵심 포인트 |
|-----|-----|-----|
| **client_profile** | 발주자 프로필 | `users` 1:1 · 조직명/산업/담당자/예산/선호 레벨 |
| **client_profile_stats** | 통계 집계 | 게시/완료 프로젝트, 평점, 재계약률 |
| **client_preferred_skill** | 선호 스킬 매핑 | AI 매칭 알고리즘 입력 |

### 📦 Project 도메인
| 테이블 | 역할 | 핵심 포인트 |
|-----|-----|-----|
| **projects** | 프로젝트 본체 | `project_type` 으로 **외주(OUTSOURCE) / 상주(FULLTIME)** 통합 · 타입별 컬럼 nullable |
| **project_skill_mapping** | 요구 스킬 | `is_required` 플래그로 **필수/우대** 구분 |
| **project_tags** | 해시태그 | 검색·필터용 (`#AI/ML`, `#핀테크` 등) |
| **project_application** | 프로젝트 지원/계약 | APPLIED → ACCEPTED/REJECTED → CONTRACTED → IN_PROGRESS → COMPLETED → WITHDRAWN |
| **project_milestones** | 마일스톤 단위 작업 | PENDING → IN_PROGRESS → SUBMITTED → APPROVED / REVISION_REQUESTED · COMPLETED 프로젝트 변경 차단 |
| **project_escrows** | 에스크로 결제·정산 | PENDING → DEPOSITED → RELEASED · 마일스톤 APPROVED 시 자동 RELEASED |
| **project_modules** | 7모듈 계약 협의 | scope/deliverable/schedule/payment/revision/completion/terms · `_nego` JSON 으로 양측 수락 패턴 |
| **project_meetings** | 다음 미팅 일정 | 1:1 (project) · frequency / next_at / location / agenda |
| **project_attachments** | 진행 대시보드 첨부 파일 | path traversal 방지 적용 · uploader_user_id 추적 |

### 💬 Communication 도메인
| 테이블 | 역할 | 핵심 포인트 |
|-----|-----|-----|
| **chat_room** | 채팅방 메타데이터 | DM/NEGOTIATION/PROJECT_MEETING 3타입 · Stream Chat Java SDK 연동 · stream_channel_id UNIQUE |
| **notification** | 진행 대시보드 알림 | 마일스톤 제출/승인/수정요청 등 시스템 이벤트 · is_read 토글 |

### 💳 Payment 도메인
| 테이블 | 역할 | 핵심 포인트 |
|-----|-----|-----|
| **payment_methods** | 결제수단 (목업) | brand/last4/exp/holder · is_default 토글 · 에스크로 입금에 사용 |

### 📚 Master 도메인 (마스터 데이터)
| 테이블 | 역할 | 핵심 포인트 |
|-----|-----|-----|
| **skill_master** | 플랫폼 전체 스킬 사전 | 3개 매핑 테이블의 단일 출처 |
| **project_field_master** | 프로젝트 분야 계층 | `parent_category` > `field_name` (예: IT 구축 > 웹사이트) |

### ⭐ Interest 도메인 (찜)
| 테이블 | 역할 | 핵심 포인트 |
|-----|-----|-----|
| **user_interest_partners** | 관심 파트너 | (user_id, partner_profile_id) UNIQUE |
| **user_interest_projects** | 관심 프로젝트 | (user_id, project_id) UNIQUE |

---

## 🔌 Backend API 맵 (22개 컨트롤러)

| 컨트롤러 | 엔드포인트 베이스 | 주요 기능 | 인증 |
|-----|-----|-----|:-:|
| `AuthController` | `/api/auth/*` | `signup`, `login`, `logout` — 비번 해시 + JWT 발급, **HttpOnly 쿠키** | ❌ |
| `EmailVerificationController` | `/api/verify/*` | 가입 이메일 인증 코드 발송/검증 | ❌ |
| `BankVerificationController` | `/api/bank/*` | `send-code`, `verify-code`, `account` — 1원 인증 (TTL 5분/시도 5회) | 🔒 |
| `UserController` | `/api/users/*` | 내 정보 조회/수정 | 🔒 |
| `PartnerController` | `/api/partners/*` | `list`, `detail` — batch 로딩 적용 | ❌ (read) |
| `ClientController` | `/api/clients/*` | `list`, `detail` — batch 로딩 적용 | ❌ (read) |
| `ProjectController` | `/api/projects/*` | `list`, `detail`, `create`, `remove`, `myList`, `byUsername` | 🔒 write |
| `ProjectApplicationController` | `/api/applications/*` | `apply`, `myList`, `received`, `updateStatus`, `closeRecruiting`, `ensureActive` | 🔒 |
| `ProgressDashboardController` | `/api/dashboard/projects/*/...` | 마일스톤·에스크로·미팅·첨부 통합 (`/milestones`, `/escrows`, `/meeting`, `/attachments`) — COMPLETED 가드 | 🔒 |
| `ProjectModuleController` | `/api/project-modules/*` | 7모듈 (`scope`/`deliverable`/`schedule`/`payment`/`revision`/`completion`/`terms`) 협의 상태 upsert | 🔒 |
| `ChatController` | `/api/chat/*` | `token`, `rooms`, `rooms/dm`, `rooms/negotiation`, `rooms/ensure-meeting` | 🔒 |
| `NotificationController` | `/api/notifications/*` | `list`, `mark-read`, `mark-all-read` | 🔒 |
| `PaymentMethodController` | `/api/payment-methods/*` | 결제수단 등록/삭제/기본 설정 | 🔒 |
| `InterestController` | `/api/interests/*` | `myProjects`, `myPartners`, `add/remove` | 🔒 |
| `MatchController` | `/api/match/*` | `partners`, `clients`, `projects` — Gemini 호출 | ❌ |
| `MasterController` | `/api/master/*` | `skills`, `fields` — 마스터 조회 | ❌ |
| `AiController` | `/api/ai/*` | AI 기타 유틸 (배너 카드 챗봇 등) | ❌ |
| `ProfileController` | `/api/profile/*` | `getDetail`, `getDetailByUsername`, `upsert` — 프로필 상세 일괄 CRUD | 🔒 |
| `PortfolioController` | `/api/portfolios/*` | `me`, `me/added`, `{username}`, `upsertBySource`, `setAdded` | 🔒 |
| `PartnerReviewController` | `/api/reviews/partner/*` | `listByPartner`, `create` | 🔒 create |
| `ClientReviewController` | `/api/reviews/client/*` | `listByClient`, `create` | 🔒 create |
| `EvaluationController` | `/api/evaluation/*` | 평가 대기 프로젝트 + 후기 통합 응답 (forPartner / forClient) | 🔒 |

> 🔒 = `AuthContext.currentUserId()` 로 JWT(쿠키 우선, Header fallback) 검증 · 비로그인은 401 또는 빈 응답

---

## 🖥️ Frontend 페이지 맵 (38개 라우트)

### 🌐 공개 페이지
| 라우트 | 컴포넌트 | 설명 |
|-----|-----|-----|
| `/` | `LandingPage` | 첫 진입 랜딩 |
| `/home`·`/client_home`·`/partner_home` | `Home` / `Client_Home` / `Partner_Home` | 역할별 홈 (AI 검색바) |
| `/login` | `Login` | 일반/카카오 OAuth |
| `/find-password` | `FindPassword` | 비번 찾기 |
| `/signup` | `Signup` | 통합 회원가입 (industry 필드 포함) |
| `/onboarding` | `Onboarding` | 가입 후 역할별 분기 (티어 4단계) |
| `/oauth/kakao/callback` | `OAuthKakaoCallback` | OAuth 리다이렉트 핸들러 |
| `/loading` | `Loading` | 로딩 화면 (배경 영상) |
| `/solution_market`·`/solution_detail` | `SolutionMarket` / `SolutionDetail` | 솔루션 마켓 |
| `/usage_guide`·`/usage_guide/{portfolio,matching,contract,policy}` | `UsageGuide*` | 이용 가이드 (5개) |

### 🔍 검색·프로필
| 라우트 | 컴포넌트 | 설명 |
|-----|-----|-----|
| `/partner_search` | `PartnerSearch` | 파트너 카드 (기술+분야 통합 chip) |
| `/client_search` | `ClientSearch` | 클라이언트 카드 |
| `/project_search` | `ProjectSearch` | 프로젝트 카드 + 7세부 협의사항 탭 |
| `/partner_profile_view` | `PartnerProfileView` | 공개 파트너 프로필 |
| `/client_profile_view` | `ClientProfileView` | 공개 클라이언트 프로필 |
| `/partner_profile`·`/client_profile` | `PartnerProfile` / `Client_Profile` | 본인 프로필 편집 |

### 📁 프로젝트·포트폴리오·등록
| 라우트 | 컴포넌트 | 설명 |
|-----|-----|-----|
| `/partner_register`·`/client_register` | `PartnerRegister` / `ClientRegister` | 파트너/클라이언트 등록 |
| `/project_register` | `ProjectRegister` | 프로젝트 등록 (외주/상주 통합) |
| `/partner_portfolio`·`/client_portfolio` | `Partner_Portfolio` / `Client_Portfolio` | 포트폴리오 페이지 |
| `/portfolio_detail_editor` | `PortfolioDetailEditor` | 포트폴리오 상세 작성 |
| `/portfolio_project_preview` | `PortfolioProjectPreview` | 포트폴리오 프리뷰 |

### 🤖 AI 챗
| 라우트 | 컴포넌트 | 설명 |
|-----|-----|-----|
| `/ai_chat_project` | `AIchatProject` | 프로젝트 AI 어시스턴트 |
| `/ai_chat_profile` | `AIchatProfile` | 프로필 AI 어시스턴트 |
| `/aichat_portfolio` | `AIchatPortfolio` | 포트폴리오 AI 어시스턴트 |

### 🛠️ 대시보드·미팅·마이페이지
| 라우트 | 컴포넌트 | 설명 |
|-----|-----|-----|
| `/partner_dashboard`·`/client_dashboard` | `PartnerDashboard` / `ClientDashboard` | 통합 대시보드 (스케줄/지원/미팅/관리/평가/포트폴리오 탭) |
| `/chat` | `StreamChatPage` | Stream Chat 통합 채팅 |
| `/mypage` | `Mypage` | 마이페이지 (계좌·결제수단) |

---

## 📦 Frontend API 어댑터 (`frontend/src/api/`)

17개 모듈 + 공통 설정:
`auth.api.js`, `bank.api.js`, `partners.api.js`, `clients.api.js`, `projects.api.js`, `applications.api.js`, `interests.api.js`, `match.api.js`, `master.api.js`, `profile.api.js`, `portfolio.api.js`, `reviews.api.js`, `evaluation.api.js`, `progressDashboard.api.js`, `projectModules.api.js`, `paymentMethods.api.js`, `index.js`(re-export), `axios.js`(공통 설정).

### axios.js 특이사항
- **JWT HttpOnly 쿠키 마이그레이션 완료** — `withCredentials: true` 로 쿠키 자동 송신. `localStorage.accessToken` 직접 노출 제거 (백워드 호환 위해 dbId 같은 비민감 식별자만 localStorage 유지).
- **응답 인터셉터**: 401 시 Zustand persist 정리 후 `/login` 리다이렉트
- **SILENT_401_PATTERNS**: `/bank/*`, `/interests/*` 는 401 나도 자동 redirect 안 함 (사용자 입력 보존)

---

## ⚡ 성능 & 데이터 볼륨

| 지표 | 값 |
|-----|-----|
| DB records | 파트너 1000 · 클라이언트 1000 · 프로젝트 1000 |
| 프론트 표시 샘플 | 각 500개 (API layer `.slice(0, 500)`) |
| `/api/partners` 쿼리 수 | 3001 → **4** (JOIN FETCH + batch IN) |
| AI 매칭 후보 최대치 | 50 (Gemini 호출당) |
| JWT TTL | 24시간 |

---

## 📁 프로젝트 구조

```
devbridge/
├── backend/
│   ├── src/main/java/com/DevBridge/devbridge/
│   │   ├── controller/        # 22개 REST 컨트롤러
│   │   ├── service/           # 도메인 서비스 (batch 로딩 적용됨)
│   │   ├── repository/        # JPA 리포지토리 (findAllBy... batch 쿼리)
│   │   ├── entity/            # 32개 JPA 엔티티
│   │   ├── dto/               # 요청/응답 DTO
│   │   ├── security/          # JwtUtil, JwtAuthenticationFilter, AuthContext (쿠키 우선)
│   │   └── config/            # DataSeeder, StreamChatConfig, CORS 등
│   └── src/main/resources/
│       ├── application.properties              # 공통 + dev 기본값
│       ├── application-local.properties        # 로컬 시크릿 (gitignored)
│       ├── application-prod.properties         # 배포용 (ddl-auto=validate, env-required)
│       └── seed/erd/                            # JSON seed (DataSeeder가 부트 시 로드)
├── docs/
│   ├── ERD_current.md     # 상세 컬럼 스펙 + Enum 정의
│   ├── ERD_v2.md          # 설계 단계 확장안
│   ├── seed_bulk_1000.sql
│   └── seed_partners_projects.sql
└── frontend/
    ├── src/
    │   ├── api/           # axios + 17개 리소스별 API (HttpOnly 쿠키 송신)
    │   ├── pages/         # 38개 라우트 페이지
    │   ├── components/    # Header, Footer, ChatBot, ContractModals,
    │   │                  # PartnerProfileModal/ClientProfileModal (풀 리뉴얼),
    │   │                  # dashboard/{ScheduleTab, StartingProjectsTab,
    │   │                  #            PartnerApplicationsTab, ProjectManageTabLive, ...}
    │   ├── store/         # Zustand (loginUser, interests, profileDetail)
    │   ├── lib/           # erdLookup, utils, portfolio 등
    │   └── assets/
    └── vite.config.js     # /api → localhost:8080 프록시
```

---

## 🔐 Security

- **인증 방식**: JWT (HS256, 24h TTL) — `Set-Cookie: HttpOnly; Secure(prod); SameSite=Lax` 으로 발급. `JwtAuthenticationFilter` 가 **쿠키 우선, Authorization 헤더 fallback** 으로 추출.
- **계좌 인증**: TTL 5분 + 시도 5회 제한, `SecureRandom`, `ConcurrentHashMap.compute()` 원자 처리.
- **마일스톤·에스크로**: COMPLETED 프로젝트 변경 차단 가드 (`ensureProjectActive`).
- **첨부파일**: path traversal 방지 (`ProjectAttachmentService`).
- **CORS**: env-driven (`app.cors.allowed-origins`).
- **401 복구 시나리오**: Mypage 진입 같은 백그라운드 호출에선 redirect 안 하고 빈 응답 반환 → 사용자 입력 보존.
- **배포 환경 분리**: `application-prod.properties` 로 분리 — `ddl-auto=validate`, 모든 시크릿 env-required, actuator 노출 최소화, `cookie.secure=true`.

---

## 📎 관련 문서

- [`docs/ERD_current.md`](docs/ERD_current.md) — 컬럼별 상세 스펙 + 전체 Enum 정의
- [`docs/ERD_v2.md`](docs/ERD_v2.md) — 설계 단계 확장안 (프론트 mock 기준)
- [`docs/ERD_v2_enum_alignment.md`](docs/ERD_v2_enum_alignment.md) — Enum 정합성 체크
- [`docs/seed_bulk_1000.sql`](docs/seed_bulk_1000.sql) — 1000개 클라이언트 시드
- [`docs/seed_partners_projects.sql`](docs/seed_partners_projects.sql) — 파트너·프로젝트 시드

---

## 📝 개발 시 필독

- **서버 구동**: IntelliJ 에서 Spring Boot 실행 + 별도 터미널에서 `npm run dev`
- **포트 충돌**: 8080 선점 시 `netstat -ano | grep 8080` → `taskkill //PID <pid> //F`
- **DB 스키마 동기화**: `spring.jpa.hibernate.ddl-auto=update` 이므로 엔티티 변경 후 재기동 시 자동 반영
- **JWT 만료**: 24시간. 토큰 만료 시 프론트는 `/login` 으로 자동 이동

---

> Made with 💙 by **AIBE5 Team 2** · 2026-04-27
