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

> 실제 운영 중인 JPA 엔티티 기준 **23개 테이블** · 최종 업데이트 **2026-04-20**

### 🔌 Feature Wiring Status

각 테이블이 **프론트 ↔ API ↔ DB** 3단 파이프로 연결되어 작동 중인지 표시합니다.

| 테이블 | Entity | Repository | API | Frontend | 상태 |
|-----|:-:|:-:|:-:|:-:|:-:|
| `users` | ✅ | ✅ | `/api/auth/*` | 로그인/회원가입 | 🟢 |
| `users.bank_*` | ✅ | ✅ | `/api/bank/*` | 마이페이지 계좌 카드 | 🟢 1원 인증(목업) |
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
| `user_interest_projects` | ✅ | ✅ | `/api/interests/projects` | 검색·대시보드 하트 | 🟢 낙관적 업데이트 |
| `user_interest_partners` | ✅ | ✅ | `/api/interests/partners` | 검색·대시보드 하트 | 🟢 낙관적 업데이트 |
| `partner_review` | ✅ | ✅ | `/api/reviews/*` | 파트너 후기/별점 | 🟡 |
| `partner_portfolios` | ✅ | ✅ | `/api/portfolios/*` | 포트폴리오 CRUD | 🟢 |
| `user_profile_detail` | ✅ | ✅ | `/api/profile/*` | 프로필 상세 (bio/GitHub) | 🟢 |
| `user_skill_detail` | ✅ | ✅ | `/api/profile/*` | 스킬 상세 (숙련도/경력) | 🟢 |
| `user_career` | ✅ | ✅ | `/api/profile/*` | 경력 사항 | 🟢 |
| `user_education` | ✅ | ✅ | `/api/profile/*` | 학력 사항 | 🟢 |
| `user_certification` | ✅ | ✅ | `/api/profile/*` | 자격증 | 🟢 |
| `user_award` | ✅ | ✅ | `/api/profile/*` | 수상 경력 | 🟢 |

> - 🟢 = 사용자가 프론트에서 조작 → 실제 DB에 기록 → 재조회까지 확인됨  
> - 🟡 = API 연결 완료, 프론트 연동 작업 진행 중 (특정 계정 mock 표시 예정)

### 🆕 최근 주요 변경 (2026-04-20)

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
    PROJECTS ||--o{ PARTNER_PORTFOLIOS : "source"
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

## 🔌 Backend API 맵 (14개 컨트롤러)

| 컨트롤러 | 엔드포인트 베이스 | 주요 기능 | 인증 |
|-----|-----|-----|:-:|
| `AuthController` | `/api/auth/*` | `signup`, `login` — 비번 해시 + JWT 발급 | ❌ |
| `EmailVerificationController` | `/api/verify/*` | 가입 이메일 인증 코드 발송/검증 | ❌ |
| `BankVerificationController` | `/api/bank/*` | `send-code`, `verify-code`, `account` — 1원 인증 목업 | 🔒 |
| `PartnerController` | `/api/partners/*` | `list`, `detail` — batch 로딩 적용 | ❌ (read) |
| `ClientController` | `/api/clients/*` | `list`, `detail` — batch 로딩 적용 | ❌ (read) |
| `ProjectController` | `/api/projects/*` | `list`, `detail`, `create`, `remove` | 🔒 write |
| `ProjectApplicationController` | `/api/applications/*` | `apply`, `myApplications`, `projectApplications`, `updateStatus` | 🔒 |
| `InterestController` | `/api/interests/*` | `myProjects`, `myPartners`, `add/remove` | 🔒 |
| `MatchController` | `/api/match/*` | `partners`, `clients`, `projects` — Gemini 호출 | ❌ |
| `MasterController` | `/api/master/*` | `skills`, `fields` — 마스터 조회 | ❌ |
| `AiController` | `/api/ai/*` | AI 기타 유틸 | ❌ |
| `ProfileController` | `/api/profile/*` | `getDetail`, `getDetailByUsername`, `upsert` — 프로필 상세 일괄 CRUD | 🔒 |
| `PortfolioController` | `/api/portfolios/*` | `me`, `me/added`, `{username}`, `upsertBySource`, `setAdded` | 🔒 |
| `PartnerReviewController` | `/api/reviews/*` | `listByPartner`, `create` | 🔒 create |

> 🔒 = `AuthContext.currentUserId()` 로 JWT 검증 · 비로그인은 401 또는 빈 응답

---

## 📦 Frontend API 어댑터 (`frontend/src/api/`)

14개 모듈: `auth.api.js`, `bank.api.js`, `partners.api.js`, `clients.api.js`, `projects.api.js`, `applications.api.js`, `interests.api.js`, `match.api.js`, `master.api.js`, `profile.api.js`, `portfolio.api.js`, `reviews.api.js`, `axios.js`(공통 설정)

### axios.js 특이사항
- **요청 인터셉터**: `localStorage.accessToken` 자동 `Bearer` 헤더 첨부
- **응답 인터셉터**: 401 시 토큰 + Zustand persist 정리 후 `/login` 리다이렉트
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
├── src/main/java/com/DevBridge/devbridge/
│   ├── controller/        # 14개 REST 컨트롤러
│   ├── service/           # 도메인 서비스 (batch 로딩 적용됨)
│   ├── repository/        # JPA 리포지토리 (findAllBy... batch 쿼리)
│   ├── entity/            # 23개 JPA 엔티티
│   ├── dto/               # 요청/응답 DTO
│   ├── security/          # JwtUtil, JwtAuthenticationFilter, AuthContext
│   └── config/            # DataSeeder, CORS 등
├── src/main/resources/
│   ├── application.properties
│   └── seed/erd/          # JSON seed (DataSeeder가 부트 시 로드)
├── docs/
│   ├── ERD_current.md     # 상세 컬럼 스펙 + Enum 정의
│   ├── ERD_v2.md          # 설계 단계 확장안
│   ├── seed_bulk_1000.sql
│   └── seed_partners_projects.sql
└── frontend/
    ├── src/
    │   ├── api/           # axios + 14개 리소스별 API
    │   ├── pages/         # Home/Login/Search/Dashboard/Mypage/Profile 등
    │   ├── components/    # Header, Footer, ChatBot, ContractModals
    │   ├── store/         # Zustand (loginUser, interests, profileDetail)
    │   ├── lib/           # erdLookup, utils, portfolio 등
    │   └── assets/
    └── vite.config.js     # /api → localhost:8080 프록시
```

---

## 🔐 Security

- **현재**: Spring Security 의존성 포함이지만 `build.gradle` 에서 주석 처리 (개발 편의). JWT 기반 경량 인증(`JwtAuthenticationFilter`) 만 활성.
- **프론트 토큰 관리**: `localStorage.accessToken` + Zustand `devbridge-storage` persist.
- **401 복구 시나리오**: Mypage 진입 같은 백그라운드 호출에선 redirect 안 하고 빈 응답 반환 → 사용자 입력 보존.
- **배포 전 체크리스트**:
  1. `build.gradle` 에서 `spring-boot-starter-security` 주석 해제
  2. `JWT_SECRET` 환경변수로 교체 (기본값 사용 금지)
  3. `@CrossOrigin` 하드코딩 제거 및 CORS 설정 분리

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

> Made with 💙 by **AIBE5 Team 2** · 2026-04-20
