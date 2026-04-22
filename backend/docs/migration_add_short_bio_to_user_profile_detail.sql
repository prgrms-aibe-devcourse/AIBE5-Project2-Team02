-- ========================================
-- USER_PROFILE_DETAIL 테이블에 short_bio 컬럼 추가
-- ========================================

USE devbridge_db;

-- short_bio 컬럼이 없으면 추가 (재실행 안전)
SET @db_name = DATABASE();
SET @table_name = 'USER_PROFILE_DETAIL';
SET @column_name = 'short_bio';

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        CONCAT('ALTER TABLE ', @table_name, ' ADD COLUMN ', @column_name, ' VARCHAR(200) NULL COMMENT ''한줄 자기소개 (200자 이내)'' AFTER strength_desc;'),
        'SELECT ''Column short_bio already exists'' AS message;'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db_name
      AND TABLE_NAME = @table_name
      AND COLUMN_NAME = @column_name
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 확인
SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'USER_PROFILE_DETAIL'
  AND COLUMN_NAME = 'short_bio';
