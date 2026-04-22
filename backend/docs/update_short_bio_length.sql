-- ========================================
-- shortBio 컬럼 길이 확장: 150자 -> 200자
-- ========================================

USE devbridge_db;

-- CLIENT_PROFILE 테이블: short_bio 컬럼 길이 변경
ALTER TABLE client_profile 
MODIFY COLUMN short_bio VARCHAR(200);

-- PARTNER_PROFILE 테이블: short_bio 컬럼 길이 변경
ALTER TABLE partner_profile 
MODIFY COLUMN short_bio VARCHAR(200);

-- 완료 메시지
SELECT 'shortBio column length updated to 200 characters!' AS Status;
