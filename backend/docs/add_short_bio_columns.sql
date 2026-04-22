-- partner_profile과 client_profile에 short_bio 컬럼 추가 (한줄 자기소개, 150자 제한)
USE devbridge_db;

-- PartnerProfile에 short_bio 추가
ALTER TABLE partner_profile 
ADD COLUMN short_bio VARCHAR(150) AFTER hashtags;

-- ClientProfile에 short_bio 추가
ALTER TABLE client_profile 
ADD COLUMN short_bio VARCHAR(150) AFTER slogan_sub;

-- 변경 확인
DESCRIBE partner_profile;
DESCRIBE client_profile;
