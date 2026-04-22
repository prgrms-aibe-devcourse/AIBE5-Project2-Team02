-- ===========================================================================
-- 진행 프로젝트 대시보드 시드 데이터
-- 시나리오: client_hylee (클라이언트) ↔ hyleeyou (파트너) 진행 중인 프로젝트 1건
-- 사전 조건: docs/insert_test_data.sql 이 먼저 실행되어 두 사용자가 존재해야 함.
-- 멱등성: 동일 title 의 프로젝트가 있으면 먼저 정리 후 재삽입.
-- ===========================================================================

SET @hylee_user_id        = (SELECT id FROM users WHERE email = 'hylee132@gmail.com');
SET @client_hylee_user_id = (SELECT id FROM users WHERE email = 'yeonalee.researcher@gmail.com');
SET @proj_title = 'AI 기반 지능형 큐레이터 플랫폼 고도화';

-- ───────────────────────────────────────────────────────────────────────────
-- 0) 기존 동일 시드 정리 (재실행 안전)
-- ───────────────────────────────────────────────────────────────────────────
SET @old_proj_id = (SELECT id FROM projects WHERE title = @proj_title AND user_id = @client_hylee_user_id LIMIT 1);

DELETE FROM project_milestones  WHERE project_id = @old_proj_id;
DELETE FROM project_escrows     WHERE project_id = @old_proj_id;
DELETE FROM project_attachments WHERE project_id = @old_proj_id;
DELETE FROM project_meetings    WHERE project_id = @old_proj_id;
DELETE FROM project_application WHERE project_id = @old_proj_id;
DELETE FROM project_modules     WHERE project_id = @old_proj_id;
DELETE FROM notification        WHERE related_entity_type IN ('milestone','escrow','project','message')
                                  AND user_id IN (@hylee_user_id, @client_hylee_user_id)
                                  AND created_at >= '2024-03-01';
DELETE FROM projects            WHERE id = @old_proj_id;

-- 카드 결제수단 시드 (멱등): 사용자별 last4 중복 제거
DELETE FROM payment_methods WHERE user_id IN (@hylee_user_id, @client_hylee_user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 1) 결제수단 (PCI 마스킹: last4 + brand 만 보관)
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO payment_methods
  (user_id, brand, last4, holder_name, exp_month, exp_year, is_default, nickname, created_at, updated_at)
VALUES
  (@client_hylee_user_id, 'VISA',       '4242', 'HYUNG YEON LEE', 12, 2027, true,  '메인 카드', NOW(), NOW()),
  (@client_hylee_user_id, 'MASTERCARD', '5555', 'HYUNG YEON LEE',  6, 2026, false, '서브 카드', NOW(), NOW()),
  (@hylee_user_id,        'VISA',       '4242', 'HY LEE',         11, 2028, true,  '개인 카드', NOW(), NOW());

-- ───────────────────────────────────────────────────────────────────────────
-- 2) 진행 프로젝트
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO projects
  (user_id, project_type, title, slogan, slogan_sub, `desc`,
   service_field, budget_amount, start_date, duration_months, deadline,
   status, ready_status, created_at, updated_at)
VALUES
  (@client_hylee_user_id, 'OUTSOURCE', @proj_title,
   'AI 추천 엔진 + 큐레이터 워크플로우 통합', 'B2C 콘텐츠 큐레이션',
   '기존 큐레이션 시스템에 AI 추천/검색 모듈을 결합해 클릭률과 잔존을 개선합니다. 프론트(React) 신규 컴포넌트 + 백엔드 RAG 파이프라인 + 운영자 콘솔 3개 영역을 병행 진행.',
   'AI/데이터', 10000000, '2024-03-01', 4, '2024-07-15',
   'IN_PROGRESS', 'DOCUMENT', NOW(), NOW());

SET @project_id = LAST_INSERT_ID();

-- 매칭된 파트너 (지원 → 진행 중)
INSERT INTO project_application (project_id, partner_user_id, status, message, applied_at, updated_at)
VALUES (@project_id, @hylee_user_id, 'IN_PROGRESS',
        '관련 RAG/추천시스템 구축 경험 보유. 4개월 안에 마일스톤 단위 납품 가능합니다.',
        '2024-02-25 10:00:00', NOW());

-- ───────────────────────────────────────────────────────────────────────────
-- 3) 프로젝트 진행 모듈 (전체 진행률 카드 — 7개, 모두 협의완료 → 86~100%)
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO project_modules (project_id, module_key, status, created_at, updated_at) VALUES
  (@project_id, 'requirements',  '협의완료', NOW(), NOW()),
  (@project_id, 'design',        '협의완료', NOW(), NOW()),
  (@project_id, 'api',           '협의완료', NOW(), NOW()),
  (@project_id, 'auth',          '협의완료', NOW(), NOW()),
  (@project_id, 'recommendation','협의완료', NOW(), NOW()),
  (@project_id, 'qa',            '협의완료', NOW(), NOW()),
  (@project_id, 'deploy',        '협의완료', NOW(), NOW());

-- ───────────────────────────────────────────────────────────────────────────
-- 4) 마일스톤 3건 (스크린샷 시나리오)
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO project_milestones
  (project_id, seq, title, description, completion_criteria, amount,
   start_date, end_date, submitted_at, submission_note, submission_file_url,
   approved_at, revision_reason, status, created_at, updated_at)
VALUES
  (@project_id, 1, 'UI 디자인 시스템 v1',
   '서비스 전반의 컴포넌트 라이브러리 + 컬러/타이포 토큰 정의.',
   '① Figma 시안 v1.0 (메인/리스트/상세 3개 화면) + ② 컴포넌트 라이브러리 PDF (24개 이상) + ③ 클라이언트 시각 승인',
   2500000,
   '2024-03-01', '2024-03-10',
   '2024-03-09 18:30:00', 'Figma 링크와 컴포넌트 라이브러리 PDF 첨부. 검토 부탁드립니다.',
   'https://figma.com/file/mock-design-system-v1',
   '2024-03-10 11:00:00', NULL,
   'APPROVED', '2024-03-01 09:00:00', NOW()),

  (@project_id, 2, '핵심 API 5종 구현',
   'OpenAPI 3.0 명세 작성 후 핵심 5개 엔드포인트 구현 + 통합 테스트.',
   '① OpenAPI Spec YAML 제출 + ② 5개 엔드포인트 200/4xx 응답 정상 + ③ Postman 컬렉션 100% 통과 + ④ 응답시간 P95 < 300ms',
   4000000,
   '2024-03-11', '2024-03-25',
   NULL, NULL, NULL,
   NULL, NULL,
   'IN_PROGRESS', '2024-03-11 09:00:00', NOW()),

  (@project_id, 3, '인증/인가 모듈',
   'OAuth2 + 자체 JWT 발급 + 권한 RBAC.',
   '① OAuth2 (Google/Kakao) 로그인 동작 + ② JWT 발급/갱신/만료 처리 + ③ 단위 테스트 80% 이상 + ④ 권한별 엔드포인트 차단 검증',
   3500000,
   '2024-03-05', '2024-03-15',
   '2024-03-15 17:00:00', '인증 흐름 데모 영상과 테스트 리포트 첨부드립니다.',
   'https://drive.example.com/auth-demo.mp4',
   NULL, '리프레시 토큰 만료 시 자동 갱신 로직 누락. 단위테스트 커버리지 추가 부탁드립니다.',
   'REVISION_REQUESTED', '2024-03-05 09:00:00', NOW());

SET @ms1_id = (SELECT id FROM project_milestones WHERE project_id = @project_id AND seq = 1);
SET @ms2_id = (SELECT id FROM project_milestones WHERE project_id = @project_id AND seq = 2);
SET @ms3_id = (SELECT id FROM project_milestones WHERE project_id = @project_id AND seq = 3);

-- ───────────────────────────────────────────────────────────────────────────
-- 5) 에스크로 3건 (마일스톤 1:1)
-- ───────────────────────────────────────────────────────────────────────────
SET @client_pm_id = (SELECT id FROM payment_methods WHERE user_id = @client_hylee_user_id AND last4 = '4242' LIMIT 1);

INSERT INTO project_escrows
  (project_id, milestone_id, amount, payer_user_id, payee_user_id, status,
   payment_method, payment_method_id, payment_tx_id,
   deposited_at, released_at, refunded_at, created_at, updated_at)
VALUES
  -- 1번: 정산 완료
  (@project_id, @ms1_id, 2500000, @client_hylee_user_id, @hylee_user_id, 'RELEASED',
   'CARD_MOCK', @client_pm_id, 'MOCK-A1B2C3D4E5',
   '2024-03-01 10:00:00', '2024-03-10 11:05:00', NULL,
   '2024-03-01 09:30:00', NOW()),
  -- 2번: 보관 중 (작업 중)
  (@project_id, @ms2_id, 4000000, @client_hylee_user_id, @hylee_user_id, 'DEPOSITED',
   'CARD_MOCK', @client_pm_id, 'MOCK-F6G7H8I9J0',
   '2024-03-11 10:00:00', NULL, NULL,
   '2024-03-11 09:30:00', NOW()),
  -- 3번: 결제 대기 (PENDING — 클라이언트가 결제 모달 띄우는 항목)
  (@project_id, @ms3_id, 3500000, @client_hylee_user_id, @hylee_user_id, 'PENDING',
   NULL, NULL, NULL,
   NULL, NULL, NULL,
   '2024-03-05 09:30:00', NOW());

-- ───────────────────────────────────────────────────────────────────────────
-- 6) 정기 미팅
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO project_meetings
  (project_id, frequency_label, next_at, location_label, agenda, created_at, updated_at)
VALUES
  (@project_id, '정기: 주 1회 (월요일)', '2024-05-20 14:00:00', 'Virtual (Zoom)',
   'API 명세서 최종 검토 + 추천 엔진 데이터 파이프라인 일정 조율', NOW(), NOW());

-- ───────────────────────────────────────────────────────────────────────────
-- 7) 첨부 자료
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO project_attachments
  (project_id, kind, name, url, mime_type, size_bytes, uploader_user_id, created_at)
VALUES
  (@project_id, 'FILE', 'API_Spec_V2.pdf',
   'https://files.example.com/devbridge/api_spec_v2.pdf',
   'application/pdf', 2516582, @hylee_user_id, '2024-03-14 16:20:00'),
  (@project_id, 'FILE', 'Design_System_Draft.fig',
   'https://files.example.com/devbridge/design_system_draft.fig',
   'application/octet-stream', 15728640, @client_hylee_user_id, '2024-03-12 10:05:00'),
  (@project_id, 'LINK', 'GitHub Repo (private)',
   'https://github.com/example/devbridge-curator',
   NULL, NULL, @hylee_user_id, '2024-03-11 09:50:00');

-- ───────────────────────────────────────────────────────────────────────────
-- 8) 알림 (둘 다 화면에서 한 번씩 받게)
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO notification
  (user_id, notification_type, title, message, related_entity_type, related_entity_id, is_read, created_at)
VALUES
  -- 클라이언트가 받을 것: 마일스톤 제출됨 + 재요청 후 메시지
  (@client_hylee_user_id, 'MILESTONE_SUBMITTED', '마일스톤 제출됨',
   '''인증/인가 모듈'' 마일스톤이 제출되었습니다. 검토해 주세요.',
   'milestone', @ms3_id, false, '2024-03-15 17:01:00'),
  (@client_hylee_user_id, 'NEW_MESSAGE', '새 메시지',
   'hyleeyou 님이 메시지를 보냈습니다: "API 응답 형식 한 가지 더 여쭤봐도 될까요?"',
   'message', NULL, false, '2024-03-16 09:42:00'),

  -- 파트너가 받을 것: 재요청 + 정산 완료
  (@hylee_user_id, 'MILESTONE_REVISION_REQUESTED', '수정 요청됨',
   '''인증/인가 모듈'' 마일스톤에 수정 요청이 접수되었습니다. 사유: 리프레시 토큰 만료 시 자동 갱신 로직 누락.',
   'milestone', @ms3_id, false, '2024-03-15 18:30:00'),
  (@hylee_user_id, 'DEPOSIT_RECEIVED', '에스크로 보관 완료',
   '₩4,000,000 가 에스크로에 안전하게 보관되었습니다. 작업을 진행해 주세요.',
   'escrow', NULL, true, '2024-03-11 10:01:00');

-- ===========================================================================
-- 검증 쿼리 (선택)
-- ===========================================================================
-- SELECT * FROM projects WHERE id = @project_id;
-- SELECT * FROM project_milestones WHERE project_id = @project_id ORDER BY seq;
-- SELECT * FROM project_escrows WHERE project_id = @project_id ORDER BY id;
-- SELECT * FROM payment_methods WHERE user_id IN (@client_hylee_user_id, @hylee_user_id);
