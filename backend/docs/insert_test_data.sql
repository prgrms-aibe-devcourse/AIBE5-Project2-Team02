-- ========================================
-- DevBridge 테스트 데이터 삽입
-- hylee132@gmail.com (파트너) - username: hyleeyou
-- yeonalee.researcher@gmail.com (클라이언트) - username: client_hylee
-- ========================================

USE devbridge_db;

-- MySQL Workbench safe update mode 해제 (서브쿼리 DELETE 허용)
SET SQL_SAFE_UPDATES = 0;

-- ========================================
-- 기존 테스트 데이터 삭제 (재실행 시 중복 방지)
-- ========================================

-- 사용자 ID 조회 (삭제 전에 필요)
SET @hylee_user_id = (SELECT id FROM users WHERE email = 'hylee132@gmail.com');
SET @client_hylee_user_id = (SELECT id FROM users WHERE email = 'yeonalee.researcher@gmail.com');
-- 역순으로 삭제 (FK 제약 고려)
-- 1) projects를 참조하는 모든 자식 테이블을 먼저 정리
--    client_hylee/hylee 소유 프로젝트들의 id 목록을 기준으로 자식 행 제거
DELETE FROM partner_portfolios WHERE user_id = @hylee_user_id;
DELETE FROM partner_portfolios WHERE source_project_id IN (SELECT id FROM projects WHERE user_id IN (@hylee_user_id, @client_hylee_user_id));
DELETE FROM client_review WHERE client_profile_id IN (SELECT id FROM client_profile WHERE user_id = @client_hylee_user_id);
DELETE FROM client_review WHERE project_id IN (SELECT id FROM projects WHERE user_id IN (@hylee_user_id, @client_hylee_user_id));
DELETE FROM partner_review WHERE partner_profile_id IN (SELECT id FROM partner_profile WHERE user_id = @hylee_user_id);
DELETE FROM partner_review WHERE project_id IN (SELECT id FROM projects WHERE user_id IN (@hylee_user_id, @client_hylee_user_id));
DELETE FROM project_application WHERE partner_user_id = @hylee_user_id OR project_id IN (SELECT id FROM projects WHERE user_id IN (@hylee_user_id, @client_hylee_user_id));
DELETE FROM project_skill_mapping WHERE project_id IN (SELECT id FROM projects WHERE user_id IN (@hylee_user_id, @client_hylee_user_id));
DELETE FROM project_tags WHERE project_id IN (SELECT id FROM projects WHERE user_id IN (@hylee_user_id, @client_hylee_user_id));
DELETE FROM user_interest_projects WHERE project_id IN (SELECT id FROM projects WHERE user_id IN (@hylee_user_id, @client_hylee_user_id));
DELETE FROM projects WHERE user_id IN (@hylee_user_id, @client_hylee_user_id);
DELETE FROM partner_profile_stats WHERE partner_profile_id IN (SELECT id FROM partner_profile WHERE user_id = @hylee_user_id);
DELETE FROM client_profile_stats WHERE client_profile_id IN (SELECT id FROM client_profile WHERE user_id = @client_hylee_user_id);
DELETE FROM partner_skill WHERE partner_profile_id IN (SELECT id FROM partner_profile WHERE user_id = @hylee_user_id);
DELETE FROM partner_profile WHERE user_id = @hylee_user_id;
DELETE FROM client_profile WHERE user_id = @client_hylee_user_id;
-- 2) users 테이블을 참조하는 나머지 자식 행들 정리
DELETE FROM client_review WHERE reviewer_user_id IN (@hylee_user_id, @client_hylee_user_id);
DELETE FROM partner_review WHERE reviewer_user_id IN (@hylee_user_id, @client_hylee_user_id);
DELETE FROM user_career WHERE user_id IN (@hylee_user_id, @client_hylee_user_id);
DELETE FROM user_certification WHERE user_id IN (@hylee_user_id, @client_hylee_user_id);
DELETE FROM user_education WHERE user_id IN (@hylee_user_id, @client_hylee_user_id);
DELETE FROM user_award WHERE user_id IN (@hylee_user_id, @client_hylee_user_id);
DELETE FROM user_skill_detail WHERE user_id IN (@hylee_user_id, @client_hylee_user_id);
DELETE FROM user_profile_detail WHERE user_id IN (@hylee_user_id, @client_hylee_user_id);
DELETE FROM user_interest_partners WHERE user_id IN (@hylee_user_id, @client_hylee_user_id);
DELETE FROM user_interest_projects WHERE user_id IN (@hylee_user_id, @client_hylee_user_id);
DELETE FROM users WHERE id IN (@hylee_user_id, @client_hylee_user_id);

-- ========================================
-- 1. Users 테이블에 계정 추가 (이미 있으면 스킵)
-- hylee132@gmail.com -> 파트너
INSERT IGNORE INTO users (email, phone, username, password, user_type, interests, contact_email, gender, birth_date, region, profile_image_url, bank_verified, created_at, updated_at)
VALUES ('hylee132@gmail.com', '010-1234-5678', 'hyleeyou', '$2b$10$mockHashedPassword', 'PARTNER', 'React, Spring Boot, AI', 'hylee132@gmail.com', 'FEMALE', '1995-03-15', '서울시 강남구', '/assets/hero_default.png', false, NOW(), NOW());

-- yeonalee.researcher@gmail.com -> 클라이언트
INSERT IGNORE INTO users (email, phone, username, password, user_type, interests, contact_email, gender, birth_date, region, profile_image_url, bank_verified, created_at, updated_at)
VALUES ('yeonalee.researcher@gmail.com', '010-8765-4321', 'client_hylee', '$2b$10$mockHashedPassword', 'CLIENT', '핑테크, AI, 커머스', 'yeonalee.researcher@gmail.com', 'FEMALE', '1993-08-20', '서울시 서초구', '/assets/hero_check.png', false, NOW(), NOW());


-- 사용자 ID 조회용 변수 (실제 실행 시 조회 필요)
SET @hylee_user_id = (SELECT id FROM users WHERE email = 'hylee132@gmail.com');
SET @client_hylee_user_id = (SELECT id FROM users WHERE email = 'yeonalee.researcher@gmail.com');

-- 2. Partner Profile 추가 (hylee)
INSERT IGNORE INTO partner_profile (
    user_id, title, hero_key, service_field, work_category, job_roles, partner_type,
    preferred_project_type, work_available_hours, communication_channels,
    dev_level, dev_experience, work_preference, slogan, short_bio, strength_desc, bio,
    avatar_color, salary_hour, salary_month, github_url, grade
)
VALUES (
    @hylee_user_id,
    '풀스택 개발자 & AI 엔지니어',
    'hero_default.png',
    'AI',
    'DEVELOP',
    '["프론트엔드", "백엔드", "AI/ML"]',
    'INDIVIDUAL',
    'FREELANCE',
    '["평일 오전", "평일 오후"]',
    '["슬랙", "디스코드", "카카오톡"]',
    'SENIOR_5_7Y',
    'EXP_3_5Y',
    'HYBRID',
    'React + Spring Boot + AI로 혁신적인 솔루션 제공',
    '6년차 풀스택 개발자, AI/ML 통합 전문가입니다.',
    '주요 기술: React, Spring Boot, Python | 하이브리드 | 6년 경력',
    'AI 기반 웹 애플리케이션 개발에 강점이 있습니다. 특히 LLM 통합과 실시간 데이터 처리에 전문성을 보유하고 있습니다.',
    '#60A5FA',
    50000,
    8000000,
    'https://github.com/hylee132',
    'DIAMOND'
);

SET @hylee_partner_profile_id = (SELECT id FROM partner_profile WHERE user_id = @hylee_user_id);

-- Partner Skills 추가 (AWS, C/C++, Docker, FastAPI, GCP, React, Spring Boot)
-- skill_master에 이미 존재하는 스킬들의 ID를 찾아서 연결
INSERT IGNORE INTO partner_skill (partner_profile_id, skill_id)
SELECT @hylee_partner_profile_id, id FROM skill_master WHERE name IN ('AWS', 'C/C++', 'Docker', 'FastAPI', 'GCP', 'React', 'Spring Boot', 'Python')
AND @hylee_partner_profile_id IS NOT NULL;

-- 3. Client Profile 추가 (client_hylee)
INSERT IGNORE INTO client_profile (
    user_id, client_type, slogan, short_bio, industry, grade, bio, strength_desc,
    preferred_levels, preferred_work_type, budget_min, budget_max, avg_project_budget, avatar_color, hero_key
)
VALUES (
    @client_hylee_user_id,
    'TEAM',
    '혁신적인 AI 솔루션을 만들어갑니다',
    '10년차 금융 기획자, AI 도메인 전문가입니다.',
    'AI',
    'GOLD',
    '금융 도메인에서 10년 이상의 경험을 바탕으로 혁신적인 서비스를 기획합니다.',
    'AI 기반 금융 서비스 전문',
    '["미들", "시니어"]',
    0,
    5000000,
    15000000,
    10000000,
    '#4BAA7B',
    'hero_check.png'
);

SET @client_hylee_profile_id = (SELECT id FROM client_profile WHERE user_id = @client_hylee_user_id);

-- 4. 프로젝트 3개 생성
-- 프로젝트 1: 공동 진행 (client_hylee가 의뢰, hylee가 참여)
INSERT INTO projects (
    user_id, project_type, title, slogan, slogan_sub, `desc`, service_field, grade,
    work_scope, category, visibility, budget_min, budget_max, budget_amount,
    is_partner_free, start_date_negotiable, start_date, duration_months,
    schedule_negotiable, detail_content, meeting_type, meeting_freq, meeting_tools,
    deadline, gov_support, req_tags, it_exp, collab_planning, collab_design,
    collab_publishing, collab_dev, status, avatar_color, created_at, updated_at
)
VALUES (
    @client_hylee_user_id,
    'OUTSOURCE',
    'AI 기반 개인 자산 관리 플랫폼 개발',
    '똑똑한 자산관리, AI가 도와드립니다',
    'AI 기반 개인 맞춤 투자 추천 서비스',
    'OpenAI API를 활용한 개인 맞춤형 자산 관리 및 투자 추천 서비스입니다. 사용자의 소비 패턴을 분석하여 최적의 저축 및 투자 전략을 제안합니다.',
    'AI',
    'GOLD',
    '["기획", "디자인", "개발", "배포"]',
    '["AI", "핀테크", "웹"]',
    'PUBLIC',
    5000,
    8000,
    6500,
    false,
    false,
    '2025-01-15',
    6,
    false,
    '- React + Vite 프론트엔드\n- Spring Boot 백엔드\n- OpenAI GPT-4 통합\n- 실시간 주식 데이터 연동\n- 사용자 맞춤 추천 알고리즘',
    'ONLINE',
    'WEEKLY',
    '["슬랙", "줌", "노션"]',
    '2025-07-15',
    false,
    '["AI", "핀테크", "React", "Spring Boot", "머신러닝"]',
    true,
    80,
    20,
    0,
    100,
    'IN_PROGRESS',
    '#3B82F6',
    '2024-12-01 10:00:00',
    NOW()
);

-- 프로젝트 2: client_hylee의 다른 프로젝트 (진행중)
INSERT INTO projects (
    user_id, project_type, title, slogan, `desc`, service_field, grade,
    budget_min, budget_max, budget_amount, start_date, duration_months,
    status, avatar_color, created_at, updated_at
)
VALUES (
    @client_hylee_user_id,
    'OUTSOURCE',
    '결제 시스템 고도화',
    '안전하고 빠른 결제 경험',
    '기존 결제 시스템의 보안 및 성능 개선 프로젝트입니다.',
    '핀테크',
    'GOLD',
    4000,
    6000,
    5000,
    '2025-02-01',
    4,
    'IN_PROGRESS',
    '#10B981',
    '2025-01-10 14:30:00',
    NOW()
);

-- 프로젝트 3: client_hylee의 또 다른 프로젝트 (진행중)
INSERT INTO projects (
    user_id, project_type, title, slogan, `desc`, service_field, grade,
    budget_min, budget_max, budget_amount, start_date, duration_months,
    status, avatar_color, created_at, updated_at
)
VALUES (
    @client_hylee_user_id,
    'OUTSOURCE',
    '모바일 뱅킹 앱 리뉴얼',
    '새로운 모바일 뱅킹 경험',
    'UI/UX 전면 개편 및 신규 기능 추가',
    '모바일',
    'PLATINUM',
    10000,
    15000,
    12000,
    '2025-03-01',
    8,
    'IN_PROGRESS',
    '#8B5CF6',
    '2025-02-15 09:00:00',
    NOW()
);

-- 프로젝트 ID 저장
SET @project1_id = (SELECT id FROM projects WHERE title = 'AI 기반 개인 자산 관리 플랫폼 개발' LIMIT 1);
SET @project2_id = (SELECT id FROM projects WHERE title = '결제 시스템 고도화' LIMIT 1);
SET @project3_id = (SELECT id FROM projects WHERE title = '모바일 뱅킹 앱 리뉴얼' LIMIT 1);

-- 5. 프로젝트 지원/매칭 (hylee가 project1에 참여)
INSERT INTO project_application (
    project_id, partner_user_id, status, message, applied_at, updated_at
)
VALUES (
    @project1_id,
    @hylee_user_id,
    'ACCEPTED',
    '안녕하세요! AI 및 풀스택 개발 경험을 바탕으로 고품질 솔루션을 제공하겠습니다.',
    '2024-12-05 11:00:00',
    '2024-12-10 15:30:00'
);

-- ========================================
-- UNIQUE 제약 변경: 리뷰는 (대상, 리뷰어, 프로젝트) 조합으로 유니크
-- (같은 리뷰어가 여러 프로젝트에 대해 각각 리뷰 작성 가능하도록)
-- 재실행 안전: (profile_id, reviewer_user_id) 2컬럼 UNIQUE 인덱스를 동적으로 모두 drop
-- ========================================
SET @db := DATABASE();

-- partner_review: (partner_profile_id, reviewer_user_id)로만 구성된 2컬럼 UNIQUE 인덱스 찾아서 모두 drop
DROP PROCEDURE IF EXISTS _drop_partner_review_2col_unique;
DELIMITER //
CREATE PROCEDURE _drop_partner_review_2col_unique()
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE iname VARCHAR(64);
  DECLARE cur CURSOR FOR
    SELECT index_name FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = 'partner_review' AND non_unique = 0
       AND index_name <> 'PRIMARY'
     GROUP BY index_name
    HAVING GROUP_CONCAT(column_name ORDER BY seq_in_index) = 'partner_profile_id,reviewer_user_id';
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO iname;
    IF done THEN LEAVE read_loop; END IF;
    SET @sql := CONCAT('ALTER TABLE partner_review DROP INDEX `', iname, '`');
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
  END LOOP;
  CLOSE cur;
END//
DELIMITER ;
CALL _drop_partner_review_2col_unique();
DROP PROCEDURE _drop_partner_review_2col_unique;

-- partner_review: 새 (partner_profile_id, reviewer_user_id, project_id) 인덱스 추가 (없을 때만)
SET @idx := (SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = @db AND table_name = 'partner_review'
      AND index_name = 'uk_partner_review_partner_reviewer_proj');
SET @sql := IF(@idx = 0, 'ALTER TABLE partner_review ADD UNIQUE KEY uk_partner_review_partner_reviewer_proj (partner_profile_id, reviewer_user_id, project_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- client_review: (client_profile_id, reviewer_user_id)로만 구성된 2컬럼 UNIQUE 인덱스 찾아서 모두 drop
DROP PROCEDURE IF EXISTS _drop_client_review_2col_unique;
DELIMITER //
CREATE PROCEDURE _drop_client_review_2col_unique()
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE iname VARCHAR(64);
  DECLARE cur CURSOR FOR
    SELECT index_name FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = 'client_review' AND non_unique = 0
       AND index_name <> 'PRIMARY'
     GROUP BY index_name
    HAVING GROUP_CONCAT(column_name ORDER BY seq_in_index) = 'client_profile_id,reviewer_user_id';
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO iname;
    IF done THEN LEAVE read_loop; END IF;
    SET @sql := CONCAT('ALTER TABLE client_review DROP INDEX `', iname, '`');
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
  END LOOP;
  CLOSE cur;
END//
DELIMITER ;
CALL _drop_client_review_2col_unique();
DROP PROCEDURE _drop_client_review_2col_unique;

-- client_review: 새 (client_profile_id, reviewer_user_id, project_id) 인덱스 추가 (없을 때만)
SET @idx := (SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = @db AND table_name = 'client_review'
      AND index_name = 'uk_client_review_client_reviewer_proj');
SET @sql := IF(@idx = 0, 'ALTER TABLE client_review ADD UNIQUE KEY uk_client_review_client_reviewer_proj (client_profile_id, reviewer_user_id, project_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 6. 파트너 리뷰 (client_hylee가 hylee에게) - project1만 먼저 작성, 나머지 portfolio 프로젝트 리뷰는 아래쪽에서
INSERT INTO partner_review (partner_profile_id, reviewer_user_id, project_id, rating, content, created_at)
VALUES
(@hylee_partner_profile_id, @client_hylee_user_id, @project1_id, 5.0, '정말 훌륭한 파트너였습니다! 기술력과 커뮤니케이션 모두 완벽했어요. AI 통합 부분에서 특히 전문성이 돋보였고, 일정도 철저히 지켜주셨습니다.', '2025-01-20 14:00:00');

-- 7. 클라이언트 리뷰 (hylee가 client_hylee에게) - project1만 먼저 작성
INSERT INTO client_review (client_profile_id, reviewer_user_id, project_id, rating, content, created_at)
VALUES
(@client_hylee_profile_id, @hylee_user_id, @project1_id, 5.0, '요구사항이 명확하고 의사결정이 빨라서 작업하기 좋았습니다! 도메인 지식이 풍부해 많은 도움이 되었고, 피드백도 구체적이고 건설적이었습니다.', '2025-01-21 10:00:00');

-- 8. Partner Profile Stats 업데이트
INSERT INTO partner_profile_stats (
    partner_profile_id, experience_years, rating, completed_projects,
    response_rate, repeat_rate, availability_days
)
VALUES (
    @hylee_partner_profile_id,
    6,
    4.91,
    12,
    95,
    80,
    30
)
ON DUPLICATE KEY UPDATE
    rating = 4.91,
    completed_projects = 12;

-- 9. Client Profile Stats 업데이트
INSERT INTO client_profile_stats (
    client_profile_id, rating, completed_projects, posted_projects, repeat_rate
)
VALUES (
    @client_hylee_profile_id,
    4.91,
    8,
    12,
    75
)
ON DUPLICATE KEY UPDATE
    rating = 4.91,
    completed_projects = 8,
    posted_projects = 12;

-- 완료 메시지
SELECT 'Test data inserted successfully!' AS Status;

-- ========================================
-- 완료된 프로젝트 3개 추가 (포트폴리오용)
-- client_hylee가 클라이언트, hylee가 파트너로 참여
-- ========================================

-- 프로젝트 4: Festory (완료된 프로젝트)
INSERT INTO projects (
    user_id, project_type, title, slogan, slogan_sub, `desc`, service_field, grade,
    work_scope, category, visibility, budget_min, budget_max, budget_amount,
    start_date, duration_months, status, avatar_color, created_at, updated_at
)
VALUES (
    @client_hylee_user_id,
    'OUTSOURCE',
    'Festory',
    '축제 정보 통합 플랫폼',
    '위치 기반 추천 · 실시간 업데이트',
    '전국의 축제 정보를 한 곳에서 확인하고 공유할 수 있는 통합 플랫폼입니다. 사용자 위치 기반 추천과 실시간 업데이트를 제공합니다.',
    'AI',
    'PLATINUM',
    '["기획", "디자인", "개발", "배포"]',
    '["웹", "모바일"]',
    'PUBLIC',
    5000,
    8000,
    6500,
    '2024-03-01',
    6,
    'COMPLETED',
    '#F97316',
    '2024-03-01 10:00:00',
    '2024-09-01 18:00:00'
);

SET @festory_project_id = LAST_INSERT_ID();
SET @festory_source_key = CONCAT('project-', @festory_project_id);

-- 프로젝트 5: Alpha-Helix (완료된 프로젝트)
INSERT INTO projects (
    user_id, project_type, title, slogan, slogan_sub, `desc`, service_field, grade,
    work_scope, category, visibility, budget_min, budget_max, budget_amount,
    start_date, duration_months, status, avatar_color, created_at, updated_at
)
VALUES (
    @client_hylee_user_id,
    'OUTSOURCE',
    'Alpha-Helix',
    '단백질 구조 분석 AI 플랫폼',
    'AlphaFold 기반 생명과학 연구 도구',
    'AI 기반 단백질 구조 예측 및 분석 도구입니다. AlphaFold 알고리즘을 활용하여 생명과학 연구를 지원합니다.',
    'AI',
    'DIAMOND',
    '["기획", "개발", "배포"]',
    '["AI", "바이오", "웹"]',
    'PUBLIC',
    12000,
    18000,
    15000,
    '2024-06-01',
    4,
    'COMPLETED',
    '#3B82F6',
    '2024-06-01 09:00:00',
    '2024-10-01 17:00:00'
);

SET @alpha_helix_project_id = LAST_INSERT_ID();
SET @alpha_helix_source_key = CONCAT('project-', @alpha_helix_project_id);

-- 프로젝트 6: DevBridge Platform (완료된 프로젝트)
INSERT INTO projects (
    user_id, project_type, title, slogan, slogan_sub, `desc`, service_field, grade,
    work_scope, category, visibility, budget_min, budget_max, budget_amount,
    start_date, duration_months, status, avatar_color, created_at, updated_at
)
VALUES (
    @client_hylee_user_id,
    'OUTSOURCE',
    'DevBridge Platform',
    '개발자와 클라이언트를 연결하는 매칭 플랫폼',
    'AI 매칭 · 실시간 채팅 · 포트폴리오 관리',
    'AI 기반 개발자-클라이언트 매칭 플랫폼. 프로젝트 추천, 실시간 채팅, 포트폴리오 관리 기능을 제공합니다.',
    'AI',
    'PLATINUM',
    '["기획", "디자인", "개발", "배포"]',
    '["AI", "웹", "SaaS"]',
    'PUBLIC',
    18000,
    25000,
    21000,
    '2024-09-01',
    5,
    'COMPLETED',
    '#10B981',
    '2024-09-01 10:00:00',
    '2025-02-01 18:00:00'
);

SET @devbridge_project_id = LAST_INSERT_ID();
SET @devbridge_source_key = CONCAT('project-', @devbridge_project_id);

-- ========================================
-- 프로젝트 지원 내역 추가 (hylee가 완료된 프로젝트 3개에 참여)
-- ========================================

INSERT INTO project_application (project_id, partner_user_id, status, message, applied_at, updated_at)
VALUES
(@festory_project_id, @hylee_user_id, 'COMPLETED', '축제 정보 플랫폼 개발 경험을 바탕으로 최상의 결과를 제공하겠습니다.', '2024-02-20 10:00:00', '2024-09-01 18:00:00'),
(@alpha_helix_project_id, @hylee_user_id, 'COMPLETED', 'AI/ML 전문성을 바탕으로 단백질 구조 분석 플랫폼을 구현하겠습니다.', '2024-05-15 09:00:00', '2024-10-01 17:00:00'),
(@devbridge_project_id, @hylee_user_id, 'COMPLETED', '풀스택 개발 및 AI 통합 경험으로 매칭 플랫폼을 완성하겠습니다.', '2024-08-20 14:00:00', '2025-02-01 18:00:00');

-- ========================================
-- 프로젝트 태그 추가 (각 프로젝트별 주요 기술/키워드)
-- ========================================
INSERT INTO project_tags (project_id, tag) VALUES
-- AI 자산관리
(@project1_id, '#React'), (@project1_id, '#SpringBoot'), (@project1_id, '#Python'), (@project1_id, '#OpenAI'), (@project1_id, '#ML'),
-- 결제 시스템
(@project2_id, '#Spring'), (@project2_id, '#보안'), (@project2_id, '#결제'), (@project2_id, '#핀테크'),
-- 모바일 뱅킹
(@project3_id, '#ReactNative'), (@project3_id, '#UIUX'), (@project3_id, '#모바일'), (@project3_id, '#뱅킹'),
-- Festory
(@festory_project_id, '#React'), (@festory_project_id, '#NodeJS'), (@festory_project_id, '#MongoDB'), (@festory_project_id, '#Redis'),
-- Alpha-Helix
(@alpha_helix_project_id, '#Python'), (@alpha_helix_project_id, '#TensorFlow'), (@alpha_helix_project_id, '#FastAPI'), (@alpha_helix_project_id, '#AI'),
-- DevBridge
(@devbridge_project_id, '#React'), (@devbridge_project_id, '#SpringBoot'), (@devbridge_project_id, '#MySQL'), (@devbridge_project_id, '#OpenAI'), (@devbridge_project_id, '#WebSocket');

-- ========================================
-- 완료된 프로젝트별 리뷰 (client_hylee ↔ hylee 상호 평가)
-- ========================================

-- 파트너 리뷰 (client_hylee → hylee): festory, alpha-helix, devbridge 프로젝트별로
INSERT INTO partner_review (partner_profile_id, reviewer_user_id, project_id, rating, content, created_at)
VALUES
(@hylee_partner_profile_id, @client_hylee_user_id, @festory_project_id, 4.9, 'Festory 프로젝트에서 위치 기반 추천 알고리즘을 훌륭하게 구현해주셨습니다. MongoDB 활용 능력이 인상적이었어요.', '2024-09-05 14:00:00'),
(@hylee_partner_profile_id, @client_hylee_user_id, @alpha_helix_project_id, 5.0, 'Alpha-Helix의 AI 모델 통합 작업이 정말 완벽했습니다. 복잡한 단백질 구조 시각화도 부드럽게 동작합니다.', '2024-10-10 11:30:00'),
(@hylee_partner_profile_id, @client_hylee_user_id, @devbridge_project_id, 5.0, 'DevBridge 플랫폼 전체를 책임감 있게 완성해주셨습니다. OpenAI 매칭 알고리즘 설계가 특히 뛰어났어요.', '2025-02-10 16:00:00');

-- 클라이언트 리뷰 (hylee → client_hylee): festory, alpha-helix, devbridge 프로젝트별로
INSERT INTO client_review (client_profile_id, reviewer_user_id, project_id, rating, content, created_at)
VALUES
(@client_hylee_profile_id, @hylee_user_id, @festory_project_id, 4.8, 'Festory 기획이 명확해서 작업하기 좋았습니다. 사용자 시나리오에 대한 인사이트가 풍부했어요.', '2024-09-06 10:00:00'),
(@client_hylee_profile_id, @hylee_user_id, @alpha_helix_project_id, 5.0, 'Alpha-Helix는 도메인 지식이 깊은 클라이언트와 협업해서 최고의 결과물을 만들 수 있었습니다.', '2024-10-11 13:00:00'),
(@client_hylee_profile_id, @hylee_user_id, @devbridge_project_id, 5.0, 'DevBridge 비전을 명확히 제시해주셔서 개발에 집중할 수 있었습니다. 다음에도 꼭 함께 일하고 싶습니다!', '2025-02-12 15:30:00');

-- ========================================
-- 포트폴리오 항목 추가
-- ========================================

-- 포트폴리오 1: Festory
INSERT INTO partner_portfolios (
    user_id, source_key, source_project_id, title, period, role,
    thumbnail_url, work_content, vision, core_features, technical_challenge, solution,
    tech_tags, github_url, live_url, sections_json, is_added, is_public, created_at, updated_at
)
VALUES (
    @hylee_user_id,
    @festory_source_key,
    @festory_project_id,
    'Festory - 축제 정보 통합 플랫폼',
    '2024.03 - 2024.09 (6개월)',
    'Full-stack Developer & Tech Lead',
    '/portfolio/festory_thumb.png',
    '전국의 다양한 축제 정보를 한 곳에서 확인하고 공유할 수 있는 통합 플랫폼을 개발했습니다. 사용자 위치 기반 추천 시스템과 실시간 축제 정보 업데이트 기능을 구현하여 사용자 경험을 극대화했습니다.',
    '축제를 사랑하는 모든 사람들이 쉽게 정보를 찾고 공유할 수 있는 플랫폼을 만들고자 했습니다.',
    '[{"title":"위치 기반 추천","desc":"GPS를 활용한 주변 축제 자동 추천"},{"title":"실시간 업데이트","desc":"축제 정보 실시간 반영 및 알림"},{"title":"커뮤니티 기능","desc":"후기 공유 및 사진 업로드"}]',
    '대량의 축제 데이터를 실시간으로 처리하고, 사용자 위치 기반 최적화된 추천을 제공하는 것이 가장 큰 기술적 과제였습니다.',
    'MongoDB를 활용한 비정형 데이터 저장, Redis 캐싱으로 응답 속도 개선, Geospatial 쿼리를 통한 위치 기반 검색 최적화를 구현했습니다.',
    '["React","Node.js","MongoDB","Redis","Express","Google Maps API"]',
    'https://github.com/hylee/festory',
    'https://festory.demo.com',
    '{"workContent":true,"vision":true,"coreFeatures":true,"technicalChallenge":true,"solution":true}',
    true,
    true,
    '2024-09-15 10:00:00',
    NOW()
);

-- 포트폴리오 2: Alpha-Helix
INSERT INTO partner_portfolios (
    user_id, source_key, source_project_id, title, period, role,
    thumbnail_url, work_content, vision, core_features, technical_challenge, solution,
    tech_tags, github_url, live_url, sections_json, is_added, is_public, created_at, updated_at
)
VALUES (
    @hylee_user_id,
    @alpha_helix_source_key,
    @alpha_helix_project_id,
    'Alpha-Helix - AI 단백질 구조 분석',
    '2024.06 - 2024.10 (4개월)',
    'AI/ML Engineer & Backend Developer',
    '/portfolio/alpha_helix_thumb.png',
    'AlphaFold 알고리즘을 활용한 단백질 구조 예측 및 분석 플랫폼을 개발했습니다. 생명과학 연구자들이 쉽게 단백질 구조를 예측하고 시각화할 수 있는 웹 기반 도구를 제공합니다.',
    '복잡한 AI 모델을 웹에서 간편하게 사용할 수 있도록 하여 생명과학 연구를 가속화하고자 했습니다.',
    '[{"title":"AI 구조 예측","desc":"AlphaFold 기반 단백질 3D 구조 예측"},{"title":"3D 시각화","desc":"Three.js를 활용한 인터랙티브 구조 뷰어"},{"title":"배치 처리","desc":"다중 서열 동시 분석 지원"}]',
    '대용량 AI 모델을 웹 환경에서 효율적으로 실행하고, 복잡한 3D 구조를 브라우저에서 부드럽게 렌더링하는 것이 핵심 과제였습니다.',
    'GPU 서버에서 모델 추론을 비동기로 처리하고, WebGL 최적화를 통해 브라우저 렌더링 성능을 개선했습니다. FastAPI로 비동기 작업 큐를 구현하여 다중 요청을 효율적으로 처리했습니다.',
    '["Python","TensorFlow","React","FastAPI","Three.js","Docker","Redis"]',
    'https://github.com/hylee/alpha-helix',
    'https://alpha-helix.bio',
    '{"workContent":true,"vision":true,"coreFeatures":true,"technicalChallenge":true,"solution":true}',
    true,
    true,
    '2024-10-15 14:00:00',
    NOW()
);

-- 포트폴리오 3: DevBridge Platform
INSERT INTO partner_portfolios (
    user_id, source_key, source_project_id, title, period, role,
    thumbnail_url, work_content, vision, core_features, technical_challenge, solution,
    tech_tags, github_url, live_url, sections_json, is_added, is_public, created_at, updated_at
)
VALUES (
    @hylee_user_id,
    @devbridge_source_key,
    @devbridge_project_id,
    'DevBridge - 개발자 매칭 플랫폼',
    '2024.09 - 2025.02 (5개월)',
    'Full-stack Developer & Product Owner',
    '/portfolio/devbridge_thumb.png',
    'AI 기반 개발자-클라이언트 매칭 플랫폼을 설계하고 개발했습니다. OpenAI API를 활용한 스마트 매칭, 실시간 채팅, 포트폴리오 관리 등 종합적인 프로젝트 관리 기능을 제공합니다.',
    '개발자와 클라이언트가 더 효율적으로 만나고 협업할 수 있는 생태계를 만들고자 했습니다.',
    '[{"title":"AI 매칭 알고리즘","desc":"OpenAI 기반 개발자-프로젝트 스마트 매칭"},{"title":"실시간 채팅","desc":"WebSocket 기반 즉시 소통"},{"title":"포트폴리오 시스템","desc":"GitHub 연동 자동 포트폴리오 생성"}]',
    'AI를 활용한 정확한 매칭 알고리즘 구현과 대규모 사용자 간 실시간 통신 처리가 가장 큰 도전이었습니다.',
    'OpenAI Embeddings를 활용하여 프로젝트와 개발자 프로필의 의미적 유사도를 계산하고, Spring WebSocket과 STOMP 프로토콜로 확장 가능한 실시간 채팅을 구현했습니다. Redis Pub/Sub을 통해 다중 서버 환경에서도 메시지 동기화를 보장했습니다.',
    '["React","Spring Boot","MySQL","OpenAI API","WebSocket","Redis","Docker","AWS"]',
    'https://github.com/hylee/devbridge',
    'https://devbridge.io',
    '{"workContent":true,"vision":true,"coreFeatures":true,"technicalChallenge":true,"solution":true}',
    true,
    true,
    '2025-02-15 16:00:00',
    NOW()
);

-- 완료 메시지
SELECT 'Portfolio projects inserted successfully!' AS Status;
SELECT '===== Users =====' AS Info;
SELECT id, email, username, user_type FROM users WHERE email IN ('hylee132@gmail.com', 'yeonalee.researcher@gmail.com');
SELECT '===== Projects =====' AS Info;
SELECT id, title, status, created_at FROM projects WHERE user_id IN (@hylee_user_id, @client_hylee_user_id);
SELECT '===== Partner Reviews =====' AS Info;
SELECT COUNT(*) as review_count, AVG(rating) as avg_rating FROM partner_review WHERE partner_profile_id = @hylee_partner_profile_id;
SELECT '===== Client Reviews =====' AS Info;
SELECT COUNT(*) as review_count, AVG(rating) as avg_rating FROM client_review WHERE client_profile_id = @client_hylee_profile_id;
SELECT '===== Portfolio Items =====' AS Info;
SELECT id, title, source_key, is_added FROM partner_portfolios WHERE user_id = @hylee_user_id;
