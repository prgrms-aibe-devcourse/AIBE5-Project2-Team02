-- profile_image_url 컬럼을 TEXT 타입으로 변경 (base64 이미지 저장을 위해)
USE devbridge_db;

ALTER TABLE users 
MODIFY COLUMN profile_image_url TEXT;

-- 변경 확인
DESCRIBE users;
