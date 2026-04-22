-- 중복 프로젝트 삭제 (ID 확인 후 실행)
USE devbridge_db;

-- 1. 먼저 어떤 ID들이 있는지 확인
SELECT id, title, created_at 
FROM projects 
WHERE title LIKE '%부동산%'
ORDER BY created_at DESC;

-- 2. 삭제할 ID를 확인한 후 아래 주석 해제하고 실행
-- DELETE FROM projects WHERE id = {삭제할_ID};

-- 예시: id가 950인 프로젝트를 삭제한다면
-- DELETE FROM projects WHERE id = 950;
