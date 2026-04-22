-- 중복 프로젝트 정리 (같은 user_id + 같은 title 중 가장 오래된 것만 유지)
USE devbridge_db;

-- 1️⃣ 먼저 어떤 중복이 있는지 확인
SELECT user_id, title, COUNT(*) AS cnt, GROUP_CONCAT(id ORDER BY id) AS ids
FROM projects
GROUP BY user_id, title
HAVING COUNT(*) > 1
ORDER BY cnt DESC;

-- 2️⃣ 삭제 미리보기 (실제로 지우지 않음, SELECT만)
SELECT p.id, p.user_id, p.title, p.created_at
FROM projects p
JOIN (
  SELECT user_id, title, MIN(id) AS keep_id
  FROM projects
  GROUP BY user_id, title
  HAVING COUNT(*) > 1
) k ON p.user_id = k.user_id AND p.title = k.title
WHERE p.id <> k.keep_id
ORDER BY p.user_id, p.title, p.id;

-- 3️⃣ ⚠️ 실제 삭제 (위 미리보기 결과 확인 후 주석 해제하여 실행)
-- 외래키 때문에 실패하면 관련 테이블(applications, contracts 등)부터 정리해야 할 수 있음

-- DELETE p FROM projects p
-- JOIN (
--   SELECT user_id, title, MIN(id) AS keep_id
--   FROM projects
--   GROUP BY user_id, title
--   HAVING COUNT(*) > 1
-- ) k ON p.user_id = k.user_id AND p.title = k.title
-- WHERE p.id <> k.keep_id;

-- 4️⃣ 삭제 후 검증 (중복 0건이어야 정상)
-- SELECT user_id, title, COUNT(*) AS cnt
-- FROM projects
-- GROUP BY user_id, title
-- HAVING COUNT(*) > 1;
