-- ========================================
-- 완료된 프로젝트 확인
-- ========================================

USE devbridge_db;

-- 1. 사용자 ID 확인
SELECT '===== 사용자 확인 =====' AS Info;
SELECT id, email, username, user_type 
FROM users 
WHERE email IN ('hylee132@gmail.com', 'yeonalee.researcher@gmail.com');

SET @hylee_user_id = (SELECT id FROM users WHERE email = 'hylee132@gmail.com');
SET @yeona_user_id = (SELECT id FROM users WHERE email = 'yeonalee.researcher@gmail.com');

-- 2. yeona(클라이언트)가 등록한 완료된 프로젝트 확인
SELECT '===== yeona가 등록한 완료된 프로젝트 =====' AS Info;
SELECT id, title, status, user_id, created_at
FROM projects 
WHERE user_id = @yeona_user_id AND status = 'COMPLETED';

-- 3. hylee(파트너)가 참여한 프로젝트 지원 내역 확인
SELECT '===== hylee의 프로젝트 지원 내역 =====' AS Info;
SELECT pa.id, pa.project_id, pa.partner_user_id, pa.status, p.title, p.status as project_status
FROM project_application pa
JOIN projects p ON pa.project_id = p.id
WHERE pa.partner_user_id = @hylee_user_id;

-- 4. COMPLETED 상태의 지원 내역만 확인
SELECT '===== hylee의 COMPLETED 상태 지원 내역 =====' AS Info;
SELECT pa.id, pa.project_id, pa.status, p.title
FROM project_application pa
JOIN projects p ON pa.project_id = p.id
WHERE pa.partner_user_id = @hylee_user_id 
  AND pa.status = 'COMPLETED';

-- 5. 포트폴리오 항목 확인
SELECT '===== hylee의 포트폴리오 항목 =====' AS Info;
SELECT id, title, source_key, source_project_id, is_added, is_public
FROM partner_portfolios 
WHERE user_id = @hylee_user_id;

-- 6. 모든 COMPLETED 상태 프로젝트 확인
SELECT '===== 모든 COMPLETED 프로젝트 =====' AS Info;
SELECT id, title, user_id, status, created_at
FROM projects 
WHERE status = 'COMPLETED'
ORDER BY created_at DESC;
