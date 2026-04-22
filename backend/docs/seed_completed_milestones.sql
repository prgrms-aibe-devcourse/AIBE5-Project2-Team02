-- ============================================================
-- 완료된 프로젝트(1104 Festory, 1105 Alpha-Helix, 1106 DevBridge Platform)
-- 마일스톤 3개 + 에스크로 + 첨부파일 시드 데이터
-- client_hylee(3024) / hyleeyou(3023)
-- ============================================================
USE devbridge_db;

-- ─────────────────────────────────────────
-- 1. Festory (project_id = 1104)
-- ─────────────────────────────────────────
INSERT INTO project_milestones
  (project_id, seq, title, description, completion_criteria, amount,
   start_date, end_date, status, submitted_at, submission_note, submission_file_url, approved_at, created_at, updated_at)
VALUES
(1104, 1,
 '기획 및 요구사항 분석',
 '서비스 기획서 작성, 사용자 스토리 정의, UI/UX 와이어프레임 초안 제작',
 '① 요구사항 정의서 PDF 납품 ② 와이어프레임 Figma 링크 공유 ③ 클라이언트 검토 완료',
 8000000,
 '2025-08-01', '2025-08-20',
 'APPROVED',
 '2025-08-18 10:30:00', '기획서 및 와이어프레임 최종본 제출드립니다. Figma 링크 첨부했습니다.',
 'https://drive.google.com/file/d/festory-planning-v1',
 '2025-08-20 14:00:00',
 NOW(), NOW()),

(1104, 2,
 '핵심 기능 개발',
 '행사 등록/조회/신청 API 구현, 파트너 매칭 알고리즘, 결제 연동',
 '① API 문서(Swagger) 제공 ② 단위 테스트 커버리지 75% 이상 ③ 스테이징 서버 배포',
 15000000,
 '2025-08-21', '2025-09-30',
 'APPROVED',
 '2025-09-28 17:00:00', '핵심 API 개발 완료 및 테스트 리포트 첨부했습니다.',
 'https://drive.google.com/file/d/festory-api-report',
 '2025-09-30 11:00:00',
 NOW(), NOW()),

(1104, 3,
 '최종 테스트 및 배포',
 'QA 전체 테스트, 성능 최적화, 프로덕션 배포, 운영 가이드 문서화',
 '① 버그 0건(Critical) ② 로딩속도 3초 이내 ③ 운영 가이드 문서 납품',
 7000000,
 '2025-10-01', '2025-10-20',
 'APPROVED',
 '2025-10-18 09:00:00', 'QA 완료 및 프로덕션 배포 완료했습니다. 운영 가이드 문서 첨부합니다.',
 'https://drive.google.com/file/d/festory-deploy-guide',
 '2025-10-20 16:30:00',
 NOW(), NOW());

-- Festory 에스크로 (milestone_id는 마지막 3개 삽입 기준 — auto_increment 사용 후 조회하여 연결)
SET @f1 = (SELECT id FROM project_milestones WHERE project_id=1104 AND seq=1);
SET @f2 = (SELECT id FROM project_milestones WHERE project_id=1104 AND seq=2);
SET @f3 = (SELECT id FROM project_milestones WHERE project_id=1104 AND seq=3);

INSERT INTO project_escrows
  (project_id, milestone_id, amount, payer_user_id, payee_user_id,
   status, payment_method, deposited_at, released_at, created_at, updated_at)
VALUES
(1104, @f1, 8000000,  3024, 3023, 'RELEASED', 'CARD', '2025-08-01 10:00:00', '2025-08-20 14:00:00', NOW(), NOW()),
(1104, @f2, 15000000, 3024, 3023, 'RELEASED', 'CARD', '2025-08-21 10:00:00', '2025-09-30 11:00:00', NOW(), NOW()),
(1104, @f3, 7000000,  3024, 3023, 'RELEASED', 'CARD', '2025-10-01 10:00:00', '2025-10-20 16:30:00', NOW(), NOW());

-- Festory 첨부파일
INSERT INTO project_attachments (project_id, kind, name, url, uploader_user_id, created_at)
VALUES
(1104, 'FILE', '요구사항_정의서_v2.pdf',       'https://drive.google.com/file/d/festory-req-doc',   3023, '2025-08-18 10:30:00'),
(1104, 'FILE', 'QA_테스트_리포트_최종.xlsx',   'https://drive.google.com/file/d/festory-qa-report', 3023, '2025-10-18 09:00:00'),
(1104, 'LINK', 'Figma 와이어프레임',           'https://figma.com/file/festory-wireframe',          3023, '2025-08-10 14:00:00'),
(1104, 'LINK', '프로덕션 서비스 URL',          'https://festory.io',                               3023, '2025-10-20 16:30:00');

-- ─────────────────────────────────────────
-- 2. Alpha-Helix (project_id = 1105)
-- ─────────────────────────────────────────
INSERT INTO project_milestones
  (project_id, seq, title, description, completion_criteria, amount,
   start_date, end_date, status, submitted_at, submission_note, submission_file_url, approved_at, created_at, updated_at)
VALUES
(1105, 1,
 '시스템 아키텍처 설계',
 'MSA 설계, DB 스키마 정의, 인프라 구성도, 기술 스택 확정',
 '① 아키텍처 설계서 납품 ② ERD 다이어그램 포함 ③ 기술 스택 문서 작성',
 12000000,
 '2025-06-01', '2025-06-25',
 'APPROVED',
 '2025-06-23 11:00:00', '시스템 아키텍처 설계 완료 및 ERD 포함 문서 제출합니다.',
 'https://drive.google.com/file/d/alpha-arch-doc',
 '2025-06-25 15:00:00',
 NOW(), NOW()),

(1105, 2,
 '백엔드 API 구현',
 'REST API 전 구현, JWT 인증/인가, 데이터 파이프라인, CI/CD 구성',
 '① Swagger API 문서 제공 ② 통합 테스트 통과 ③ Docker 배포 완료',
 20000000,
 '2025-06-26', '2025-08-15',
 'APPROVED',
 '2025-08-13 16:00:00', 'API 전체 구현 및 CI/CD 파이프라인 구성 완료했습니다.',
 'https://drive.google.com/file/d/alpha-backend-doc',
 '2025-08-15 17:00:00',
 NOW(), NOW()),

(1105, 3,
 '프론트엔드 UI 완성',
 'React 기반 대시보드 구현, 실시간 데이터 시각화, 반응형 UI',
 '① 전체 화면 구현 완료 ② 크로스 브라우저 테스트 ③ Lighthouse 90점 이상',
 13000000,
 '2025-08-16', '2025-09-20',
 'APPROVED',
 '2025-09-18 14:00:00', 'UI 전체 구현 완료 및 성능 최적화 결과 첨부합니다.',
 'https://drive.google.com/file/d/alpha-frontend-doc',
 '2025-09-20 16:00:00',
 NOW(), NOW());

SET @a1 = (SELECT id FROM project_milestones WHERE project_id=1105 AND seq=1);
SET @a2 = (SELECT id FROM project_milestones WHERE project_id=1105 AND seq=2);
SET @a3 = (SELECT id FROM project_milestones WHERE project_id=1105 AND seq=3);

INSERT INTO project_escrows
  (project_id, milestone_id, amount, payer_user_id, payee_user_id,
   status, payment_method, deposited_at, released_at, created_at, updated_at)
VALUES
(1105, @a1, 12000000, 3024, 3023, 'RELEASED', 'CARD', '2025-06-01 10:00:00', '2025-06-25 15:00:00', NOW(), NOW()),
(1105, @a2, 20000000, 3024, 3023, 'RELEASED', 'CARD', '2025-06-26 10:00:00', '2025-08-15 17:00:00', NOW(), NOW()),
(1105, @a3, 13000000, 3024, 3023, 'RELEASED', 'CARD', '2025-08-16 10:00:00', '2025-09-20 16:00:00', NOW(), NOW());

INSERT INTO project_attachments (project_id, kind, name, url, uploader_user_id, created_at)
VALUES
(1105, 'FILE', '시스템_아키텍처_설계서_v1.pdf',    'https://drive.google.com/file/d/alpha-arch-final',    3023, '2025-06-23 11:00:00'),
(1105, 'FILE', 'API_명세서_Swagger_export.json',   'https://drive.google.com/file/d/alpha-swagger',       3023, '2025-08-13 16:00:00'),
(1105, 'FILE', 'Lighthouse_성능_리포트.pdf',        'https://drive.google.com/file/d/alpha-lighthouse',    3023, '2025-09-18 14:00:00'),
(1105, 'LINK', 'GitHub 레포지토리',                'https://github.com/alpha-helix/backend',              3023, '2025-06-26 09:00:00'),
(1105, 'LINK', '스테이징 서버 URL',                'https://staging.alpha-helix.io',                      3023, '2025-09-01 10:00:00');

-- ─────────────────────────────────────────
-- 3. DevBridge Platform (project_id = 1106)
-- ─────────────────────────────────────────
INSERT INTO project_milestones
  (project_id, seq, title, description, completion_criteria, amount,
   start_date, end_date, status, submitted_at, submission_note, submission_file_url, approved_at, created_at, updated_at)
VALUES
(1106, 1,
 '플랫폼 설계 및 DB 구성',
 'AI 매칭 엔진 설계, 사용자/프로젝트/계약 DB 스키마 설계, 인증 시스템 구축',
 '① ERD 완성 및 승인 ② 인증 API(로그인/회원가입) 동작 확인 ③ 스키마 마이그레이션 스크립트 제공',
 10000000,
 '2025-04-01', '2025-04-30',
 'APPROVED',
 '2025-04-28 10:00:00', 'DB 설계 완료 및 인증 API 구현 완료했습니다. ERD 문서 첨부합니다.',
 'https://drive.google.com/file/d/devbridge-erd-v1',
 '2025-04-30 17:00:00',
 NOW(), NOW()),

(1106, 2,
 '핵심 매칭 알고리즘 개발',
 'AI 기반 파트너-클라이언트 매칭 로직, 프로젝트 추천 엔진, 실시간 채팅 연동',
 '① 매칭 정확도 테스트 결과 제공 ② Stream Chat 연동 완료 ③ 추천 API 문서화',
 25000000,
 '2025-05-01', '2025-06-30',
 'APPROVED',
 '2025-06-27 15:00:00', '매칭 알고리즘 및 Stream Chat 연동 완료. 테스트 결과 첨부합니다.',
 'https://drive.google.com/file/d/devbridge-matching-report',
 '2025-06-30 18:00:00',
 NOW(), NOW()),

(1106, 3,
 '배포 및 운영 환경 구성',
 'AWS 인프라 구성, 모니터링 시스템, 성능 최적화, 운영 매뉴얼 작성',
 '① AWS 배포 완료 ② 모니터링 대시보드 구성 ③ 운영 매뉴얼 납품',
 15000000,
 '2025-07-01', '2025-07-31',
 'APPROVED',
 '2025-07-29 11:00:00', '배포 및 운영 환경 구성 완료. 모니터링 대시보드 및 운영 매뉴얼 첨부합니다.',
 'https://drive.google.com/file/d/devbridge-ops-manual',
 '2025-07-31 15:00:00',
 NOW(), NOW());

SET @d1 = (SELECT id FROM project_milestones WHERE project_id=1106 AND seq=1);
SET @d2 = (SELECT id FROM project_milestones WHERE project_id=1106 AND seq=2);
SET @d3 = (SELECT id FROM project_milestones WHERE project_id=1106 AND seq=3);

INSERT INTO project_escrows
  (project_id, milestone_id, amount, payer_user_id, payee_user_id,
   status, payment_method, deposited_at, released_at, created_at, updated_at)
VALUES
(1106, @d1, 10000000, 3024, 3023, 'RELEASED', 'CARD', '2025-04-01 10:00:00', '2025-04-30 17:00:00', NOW(), NOW()),
(1106, @d2, 25000000, 3024, 3023, 'RELEASED', 'CARD', '2025-05-01 10:00:00', '2025-06-30 18:00:00', NOW(), NOW()),
(1106, @d3, 15000000, 3024, 3023, 'RELEASED', 'CARD', '2025-07-01 10:00:00', '2025-07-31 15:00:00', NOW(), NOW());

INSERT INTO project_attachments (project_id, kind, name, url, uploader_user_id, created_at)
VALUES
(1106, 'FILE', 'ERD_다이어그램_최종본.pdf',         'https://drive.google.com/file/d/devbridge-erd-final',     3023, '2025-04-28 10:00:00'),
(1106, 'FILE', 'AI_매칭_테스트_결과_리포트.pdf',    'https://drive.google.com/file/d/devbridge-match-result',  3023, '2025-06-27 15:00:00'),
(1106, 'FILE', '운영_매뉴얼_v1.0.pdf',              'https://drive.google.com/file/d/devbridge-ops-v1',        3023, '2025-07-29 11:00:00'),
(1106, 'LINK', 'GitHub — DevBridge Backend',       'https://github.com/devbridge/backend',                    3023, '2025-05-01 09:00:00'),
(1106, 'LINK', '프로덕션 서비스',                  'https://devbridge.io',                                    3023, '2025-07-31 15:00:00'),
(1106, 'LINK', 'AWS CloudWatch 대시보드',           'https://cloudwatch.aws/devbridge-prod',                   3023, '2025-07-31 16:00:00');

SELECT 'Seed data inserted successfully!' AS result;
SELECT 
  p.id, p.title, COUNT(m.id) AS milestone_count, SUM(e.amount) AS total_escrow
FROM projects p
LEFT JOIN project_milestones m ON m.project_id = p.id
LEFT JOIN project_escrows e ON e.project_id = p.id
WHERE p.id IN (1104, 1105, 1106)
GROUP BY p.id, p.title;
