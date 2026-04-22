-- 부동산 프로젝트 중복 확인
USE devbridge_db;

SELECT id, title, user_id, status, created_at 
FROM projects 
WHERE title LIKE '%부동산%'
ORDER BY created_at DESC;

-- 모든 중복 프로젝트 확인 (같은 제목으로 2개 이상)
SELECT title, COUNT(*) as count, GROUP_CONCAT(id) as project_ids
FROM projects 
GROUP BY title 
HAVING COUNT(*) > 1;
