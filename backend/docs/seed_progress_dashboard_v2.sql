-- ===========================================================================
-- 시드 v2: 두 계정에 진행 프로젝트 3건 풀세트
--   client_hylee (id=3024) ↔ hyleeyou (id=3023)
--   대상 프로젝트: 1101, 1102, 1107 (이미 client_hylee 소유)
-- 멱등: 각 프로젝트의 자식 데이터 모두 정리 후 재삽입
-- ===========================================================================

SET @client_id  = (SELECT id FROM users WHERE username = 'client_hylee');
SET @partner_id = (SELECT id FROM users WHERE username = 'hyleeyou');

-- ───────────────────────────────────────────────────────────────────────────
-- 0) 기존 자식 데이터 정리 (1101, 1102, 1107)
-- ───────────────────────────────────────────────────────────────────────────
DELETE FROM project_milestones  WHERE project_id IN (1101, 1102, 1107);
DELETE FROM project_escrows     WHERE project_id IN (1101, 1102, 1107);
DELETE FROM project_attachments WHERE project_id IN (1101, 1102, 1107);
DELETE FROM project_meetings    WHERE project_id IN (1101, 1102, 1107);
DELETE FROM project_application WHERE project_id IN (1101, 1102, 1107) AND partner_user_id = @partner_id;
DELETE FROM notification        WHERE user_id IN (@client_id, @partner_id)
                                  AND related_entity_type IN ('milestone','escrow','message');

-- ───────────────────────────────────────────────────────────────────────────
-- 1) budget_amount 정상화 (단위가 만원으로 작게 들어가있어 KRW 단위로 보정)
-- ───────────────────────────────────────────────────────────────────────────
UPDATE projects SET budget_amount = 65000000  WHERE id = 1101;
UPDATE projects SET budget_amount = 50000000  WHERE id = 1102;
UPDATE projects SET budget_amount = 100000000 WHERE id = 1107;

-- ───────────────────────────────────────────────────────────────────────────
-- 2) 파트너 매칭 (hyleeyou 가 3개 모두 진행 중)
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO project_application (project_id, partner_user_id, status, message, applied_at, updated_at) VALUES
  (1101, @partner_id, 'IN_PROGRESS', '핀테크 도메인 + AI 추천 경험 기반으로 4개월 안에 납품 가능합니다.', '2026-01-08 10:00:00', NOW()),
  (1102, @partner_id, 'IN_PROGRESS', 'PG/카드/페이 연동 5건 이상 실적 보유. 안정적으로 진행하겠습니다.', '2026-02-10 11:00:00', NOW()),
  (1107, @partner_id, 'IN_PROGRESS', '관련 RAG/추천시스템 구축 경험 보유. 4개월 안에 마일스톤 단위 납품 가능합니다.', '2026-03-01 09:30:00', NOW());

-- ───────────────────────────────────────────────────────────────────────────
-- 3) 결제수단 (멱등 — 이미 있을 수 있음)
-- ───────────────────────────────────────────────────────────────────────────
DELETE FROM payment_methods WHERE user_id IN (@client_id, @partner_id);
INSERT INTO payment_methods
  (user_id, brand, last4, holder_name, exp_month, exp_year, is_default, nickname, created_at, updated_at) VALUES
  (@client_id,  'VISA',       '4242', 'HYUNG YEON LEE', 12, 2027, true,  '메인 카드', NOW(), NOW()),
  (@client_id,  'MASTERCARD', '5555', 'HYUNG YEON LEE',  6, 2026, false, '서브 카드', NOW(), NOW()),
  (@partner_id, 'VISA',       '4242', 'HY LEE',         11, 2028, true,  '개인 카드', NOW(), NOW());

SET @client_pm_id = (SELECT id FROM payment_methods WHERE user_id = @client_id AND last4 = '4242' LIMIT 1);

-- ═══════════════════════════════════════════════════════════════════════════
-- 프로젝트 1101 — AI 기반 개인 자산 관리 플랫폼 개발 (총 65,000,000)
--   진행 상태: M1 정산 완료, M2 작업 중(보관), M3 결제 대기
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO project_milestones
  (project_id, seq, title, description, completion_criteria, amount,
   start_date, end_date, submitted_at, submission_note, submission_file_url,
   approved_at, revision_reason, status, created_at, updated_at)
VALUES
  (1101, 1, '요구사항 분석 + UX 와이어프레임',
   '사용자 페르소나 정의, 자산 카테고리 분류 체계 설계, 메인/리스트/상세 와이어프레임.',
   '① 페르소나 3종 + 사용자 여정맵 / ② 정보구조도 IA / ③ Figma 와이어프레임 (메인·자산리스트·상세·세팅 4화면) / ④ 클라이언트 시각 승인',
   18000000, '2026-01-10', '2026-01-25',
   '2026-01-24 18:00:00', '와이어프레임과 IA 문서 첨부했습니다. 자산 카테고리 트리 구조 검토 부탁드립니다.',
   'https://figma.com/file/mock-asset-wireframe-v1',
   '2026-01-25 11:30:00', NULL,
   'APPROVED', '2026-01-10 09:00:00', NOW()),

  (1101, 2, '핵심 자산 집계 API + 데이터 파이프라인',
   '오픈뱅킹 API 연동, 자산 정규화, 일일 스냅샷 배치 작업.',
   '① 오픈뱅킹 OAuth 흐름 정상 / ② 자산 5종(예적금/주식/펀드/암호화폐/부동산) 집계 정상 / ③ 일일 배치 스냅샷 7일 누적 / ④ 응답 P95 < 400ms',
   25000000, '2026-01-26', '2026-02-25',
   NULL, NULL, NULL,
   NULL, NULL,
   'IN_PROGRESS', '2026-01-26 09:00:00', NOW()),

  (1101, 3, '대시보드 UI + 리포트 PDF 생성',
   '메인 대시보드 차트 위젯 4종, 월간 리포트 PDF 자동 생성.',
   '① 차트 위젯 4종 (자산추이/카테고리비중/수익률/현금흐름) / ② 월간 PDF 리포트 자동 생성 / ③ Lighthouse 성능 점수 90+',
   22000000, '2026-02-26', '2026-03-30',
   NULL, NULL, NULL,
   NULL, NULL,
   'PENDING', '2026-01-10 09:00:00', NOW());

SET @p1_m1 = (SELECT id FROM project_milestones WHERE project_id=1101 AND seq=1);
SET @p1_m2 = (SELECT id FROM project_milestones WHERE project_id=1101 AND seq=2);
SET @p1_m3 = (SELECT id FROM project_milestones WHERE project_id=1101 AND seq=3);

INSERT INTO project_escrows
  (project_id, milestone_id, amount, payer_user_id, payee_user_id, status,
   payment_method, payment_method_id, payment_tx_id, deposited_at, released_at, refunded_at,
   created_at, updated_at) VALUES
  (1101, @p1_m1, 18000000, @client_id, @partner_id, 'RELEASED',
   'CARD_MOCK', @client_pm_id, 'MOCK-P1M1-RELEASED',
   '2026-01-10 10:00:00', '2026-01-25 11:35:00', NULL, '2026-01-10 09:30:00', NOW()),
  (1101, @p1_m2, 25000000, @client_id, @partner_id, 'DEPOSITED',
   'CARD_MOCK', @client_pm_id, 'MOCK-P1M2-DEPOSITED',
   '2026-01-26 10:00:00', NULL, NULL, '2026-01-26 09:30:00', NOW()),
  (1101, @p1_m3, 22000000, @client_id, @partner_id, 'PENDING',
   NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-26 09:30:00', NOW());

INSERT INTO project_meetings (project_id, frequency_label, next_at, location_label, agenda, created_at, updated_at)
VALUES (1101, '정기: 격주 화요일', '2026-04-28 14:00:00', 'Virtual (Zoom)',
        '오픈뱅킹 API 인증 흐름 데모 + 자산 정규화 룰 확정', NOW(), NOW());

INSERT INTO project_attachments (project_id, kind, name, url, mime_type, size_bytes, uploader_user_id, created_at) VALUES
  (1101, 'FILE', 'WireFrame_v1.fig', 'https://files.example.com/wf_v1.fig', 'application/octet-stream', 18874368, @partner_id, '2026-01-22 14:10:00'),
  (1101, 'FILE', 'IA_Document.pdf', 'https://files.example.com/ia.pdf', 'application/pdf', 1572864, @partner_id, '2026-01-23 16:00:00'),
  (1101, 'LINK', 'GitHub Repo (private)', 'https://github.com/example/asset-platform', NULL, NULL, @partner_id, '2026-01-26 11:00:00');

-- ═══════════════════════════════════════════════════════════════════════════
-- 프로젝트 1102 — 결제 시스템 고도화 (총 50,000,000)
--   진행 상태: M1 승인됨, M2 검토중(SUBMITTED), M3 결제 대기
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO project_milestones
  (project_id, seq, title, description, completion_criteria, amount,
   start_date, end_date, submitted_at, submission_note, submission_file_url,
   approved_at, revision_reason, status, created_at, updated_at)
VALUES
  (1102, 1, 'PG 3사 연동 (토스/카카오/네이버)',
   '결제 추상화 레이어 + 3사 SDK 연동 + 콜백 처리.',
   '① 3사 결제 sandbox 정상 / ② 부분 취소·환불 시나리오 4종 / ③ Webhook 재처리 idempotency 보장',
   18000000, '2026-02-15', '2026-03-05',
   '2026-03-04 17:00:00', '3사 sandbox 결제·취소·환불 모두 통과. 통합 테스트 리포트 첨부.',
   'https://drive.example.com/pg-test-report.pdf',
   '2026-03-05 10:00:00', NULL,
   'APPROVED', '2026-02-15 09:00:00', NOW()),

  (1102, 2, '간편결제 토큰화 + Vault 저장',
   '카드 토큰화(EMV), Vault 분리, PCI-DSS 준수 점검.',
   '① EMV 토큰화 정상 / ② Vault 컨테이너 분리 (KMS 암호화) / ③ PCI-DSS Self-Assessment 체크리스트 100%',
   17000000, '2026-03-06', '2026-04-10',
   '2026-04-09 19:00:00', 'EMV 토큰 발급/사용 테스트 + Vault 격리 환경 셋업 완료. PCI 체크리스트는 SAQ-D 기준 작성.',
   'https://drive.example.com/vault-poc-demo.mp4',
   NULL, NULL,
   'SUBMITTED', '2026-03-06 09:00:00', NOW()),

  (1102, 3, '관리자 결제 콘솔 + 정산 리포트',
   '운영자용 결제 검색/취소/환불 콘솔, 일/월 정산 리포트.',
   '① 콘솔 권한 분리(매니저/관리자) / ② 일·월 정산 CSV·PDF 자동 생성 / ③ 권한별 감사 로그 기록',
   15000000, '2026-04-11', '2026-05-15',
   NULL, NULL, NULL, NULL, NULL,
   'PENDING', '2026-02-15 09:00:00', NOW());

SET @p2_m1 = (SELECT id FROM project_milestones WHERE project_id=1102 AND seq=1);
SET @p2_m2 = (SELECT id FROM project_milestones WHERE project_id=1102 AND seq=2);
SET @p2_m3 = (SELECT id FROM project_milestones WHERE project_id=1102 AND seq=3);

INSERT INTO project_escrows
  (project_id, milestone_id, amount, payer_user_id, payee_user_id, status,
   payment_method, payment_method_id, payment_tx_id, deposited_at, released_at, refunded_at,
   created_at, updated_at) VALUES
  (1102, @p2_m1, 18000000, @client_id, @partner_id, 'RELEASED',
   'CARD_MOCK', @client_pm_id, 'MOCK-P2M1-RELEASED',
   '2026-02-15 10:00:00', '2026-03-05 10:05:00', NULL, '2026-02-15 09:30:00', NOW()),
  (1102, @p2_m2, 17000000, @client_id, @partner_id, 'DEPOSITED',
   'CARD_MOCK', @client_pm_id, 'MOCK-P2M2-DEPOSITED',
   '2026-03-06 10:00:00', NULL, NULL, '2026-03-06 09:30:00', NOW()),
  (1102, @p2_m3, 15000000, @client_id, @partner_id, 'PENDING',
   NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-11 09:30:00', NOW());

INSERT INTO project_meetings (project_id, frequency_label, next_at, location_label, agenda, created_at, updated_at)
VALUES (1102, '정기: 주 1회 목요일', '2026-04-23 15:00:00', '클라이언트 본사 회의실 A',
        'Vault PoC 데모 검토 + PCI-DSS 체크리스트 합의', NOW(), NOW());

INSERT INTO project_attachments (project_id, kind, name, url, mime_type, size_bytes, uploader_user_id, created_at) VALUES
  (1102, 'FILE', 'PG_Integration_Spec.pdf', 'https://files.example.com/pg_spec.pdf', 'application/pdf', 3145728, @partner_id, '2026-02-20 11:00:00'),
  (1102, 'FILE', 'Vault_Architecture.png', 'https://files.example.com/vault.png', 'image/png', 524288, @partner_id, '2026-03-15 09:30:00'),
  (1102, 'LINK', 'Notion 작업 문서', 'https://notion.so/example/payment-upgrade', NULL, NULL, @partner_id, '2026-02-15 10:30:00');

-- ═══════════════════════════════════════════════════════════════════════════
-- 프로젝트 1107 — AI 기반 지능형 큐레이터 플랫폼 고도화 (총 100,000,000)
--   진행 상태: M1 승인, M2 작업중(보관), M3 수정요청됨
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO project_milestones
  (project_id, seq, title, description, completion_criteria, amount,
   start_date, end_date, submitted_at, submission_note, submission_file_url,
   approved_at, revision_reason, status, created_at, updated_at)
VALUES
  (1107, 1, 'UI 디자인 시스템 v1',
   '서비스 전반의 컴포넌트 라이브러리 + 컬러/타이포 토큰 정의.',
   '① Figma 시안 v1.0 (메인/리스트/상세 3개 화면) / ② 컴포넌트 라이브러리 PDF (24개 이상) / ③ 클라이언트 시각 승인',
   25000000, '2026-03-01', '2026-03-15',
   '2026-03-14 18:30:00', 'Figma 링크와 컴포넌트 라이브러리 PDF 첨부. 검토 부탁드립니다.',
   'https://figma.com/file/mock-design-system-v1',
   '2026-03-15 11:00:00', NULL,
   'APPROVED', '2026-03-01 09:00:00', NOW()),

  (1107, 2, '핵심 API 5종 구현',
   'OpenAPI 3.0 명세 작성 후 핵심 5개 엔드포인트 구현 + 통합 테스트.',
   '① OpenAPI Spec YAML 제출 / ② 5개 엔드포인트 200/4xx 응답 정상 / ③ Postman 컬렉션 100% 통과 / ④ 응답시간 P95 < 300ms',
   40000000, '2026-03-16', '2026-04-25',
   NULL, NULL, NULL, NULL, NULL,
   'IN_PROGRESS', '2026-03-16 09:00:00', NOW()),

  (1107, 3, '인증/인가 모듈',
   'OAuth2 + 자체 JWT 발급 + 권한 RBAC.',
   '① OAuth2 (Google/Kakao) 로그인 동작 / ② JWT 발급/갱신/만료 처리 / ③ 단위 테스트 80% 이상 / ④ 권한별 엔드포인트 차단 검증',
   35000000, '2026-03-10', '2026-04-15',
   '2026-04-15 17:00:00', '인증 흐름 데모 영상과 테스트 리포트 첨부드립니다.',
   'https://drive.example.com/auth-demo.mp4',
   NULL, '리프레시 토큰 만료 시 자동 갱신 로직 누락. 단위테스트 커버리지 추가 부탁드립니다.',
   'REVISION_REQUESTED', '2026-03-10 09:00:00', NOW());

SET @p3_m1 = (SELECT id FROM project_milestones WHERE project_id=1107 AND seq=1);
SET @p3_m2 = (SELECT id FROM project_milestones WHERE project_id=1107 AND seq=2);
SET @p3_m3 = (SELECT id FROM project_milestones WHERE project_id=1107 AND seq=3);

INSERT INTO project_escrows
  (project_id, milestone_id, amount, payer_user_id, payee_user_id, status,
   payment_method, payment_method_id, payment_tx_id, deposited_at, released_at, refunded_at,
   created_at, updated_at) VALUES
  (1107, @p3_m1, 25000000, @client_id, @partner_id, 'RELEASED',
   'CARD_MOCK', @client_pm_id, 'MOCK-P3M1-RELEASED',
   '2026-03-01 10:00:00', '2026-03-15 11:05:00', NULL, '2026-03-01 09:30:00', NOW()),
  (1107, @p3_m2, 40000000, @client_id, @partner_id, 'DEPOSITED',
   'CARD_MOCK', @client_pm_id, 'MOCK-P3M2-DEPOSITED',
   '2026-03-16 10:00:00', NULL, NULL, '2026-03-16 09:30:00', NOW()),
  (1107, @p3_m3, 35000000, @client_id, @partner_id, 'PENDING',
   NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-10 09:30:00', NOW());

INSERT INTO project_meetings (project_id, frequency_label, next_at, location_label, agenda, created_at, updated_at)
VALUES (1107, '정기: 주 1회 월요일', '2026-04-27 14:00:00', 'Virtual (Zoom)',
        'API 명세서 최종 검토 + 추천 엔진 데이터 파이프라인 일정 조율', NOW(), NOW());

INSERT INTO project_attachments (project_id, kind, name, url, mime_type, size_bytes, uploader_user_id, created_at) VALUES
  (1107, 'FILE', 'API_Spec_V2.pdf', 'https://files.example.com/api_spec.pdf', 'application/pdf', 2516582, @partner_id, '2026-04-14 16:20:00'),
  (1107, 'FILE', 'Design_System_Draft.fig', 'https://files.example.com/ds.fig', 'application/octet-stream', 15728640, @client_id, '2026-03-12 10:05:00'),
  (1107, 'LINK', 'GitHub Repo (private)', 'https://github.com/example/curator-platform', NULL, NULL, @partner_id, '2026-03-11 09:50:00');

-- ───────────────────────────────────────────────────────────────────────────
-- 4) 알림 (양쪽에 골고루)
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO notification (user_id, notification_type, title, message, related_entity_type, related_entity_id, is_read, created_at) VALUES
  -- client_hylee 받을 알림
  (@client_id, 'MILESTONE_SUBMITTED', '마일스톤 제출됨',
   '''결제 시스템 고도화'' 의 ''간편결제 토큰화 + Vault 저장'' 마일스톤이 제출되었습니다.',
   'milestone', @p2_m2, false, '2026-04-09 19:01:00'),
  (@client_id, 'MILESTONE_SUBMITTED', '마일스톤 제출됨',
   '''AI 기반 지능형 큐레이터 플랫폼 고도화'' 의 ''인증/인가 모듈'' 마일스톤이 제출되었습니다.',
   'milestone', @p3_m3, false, '2026-04-15 17:01:00'),
  (@client_id, 'NEW_MESSAGE', '새 메시지',
   'hyleeyou 님이 메시지를 보냈습니다: "API 응답 형식 한 가지 더 여쭤봐도 될까요?"',
   'message', NULL, false, '2026-04-16 09:42:00'),
  -- hyleeyou 받을 알림
  (@partner_id, 'MILESTONE_REVISION_REQUESTED', '수정 요청됨',
   '''인증/인가 모듈'' 마일스톤에 수정 요청이 접수되었습니다.',
   'milestone', @p3_m3, false, '2026-04-15 18:30:00'),
  (@partner_id, 'DEPOSIT_RECEIVED', '에스크로 보관 완료',
   '₩40,000,000 가 에스크로에 안전하게 보관되었습니다.',
   'escrow', NULL, true, '2026-03-16 10:01:00'),
  (@partner_id, 'MILESTONE_APPROVED', '마일스톤 승인됨',
   '''UI 디자인 시스템 v1'' 마일스톤이 승인되어 정산이 완료되었습니다.',
   'milestone', @p3_m1, true, '2026-03-15 11:06:00');

-- ===========================================================================
-- 검증
-- ===========================================================================
SELECT 'projects'    AS k, COUNT(*) AS n FROM projects WHERE id IN (1101,1102,1107)
UNION ALL SELECT 'milestones',  COUNT(*) FROM project_milestones  WHERE project_id IN (1101,1102,1107)
UNION ALL SELECT 'escrows',     COUNT(*) FROM project_escrows     WHERE project_id IN (1101,1102,1107)
UNION ALL SELECT 'attachments', COUNT(*) FROM project_attachments WHERE project_id IN (1101,1102,1107)
UNION ALL SELECT 'meetings',    COUNT(*) FROM project_meetings    WHERE project_id IN (1101,1102,1107)
UNION ALL SELECT 'partner_apps',COUNT(*) FROM project_application WHERE project_id IN (1101,1102,1107) AND partner_user_id = @partner_id;
