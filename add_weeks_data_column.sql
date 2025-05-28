-- courses 테이블에 weeks_data 컬럼 추가
ALTER TABLE courses ADD COLUMN IF NOT EXISTS weeks_data JSONB DEFAULT '[]'::jsonb;

-- weeks_data 컬럼에 인덱스 추가 (JSON 검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_courses_weeks_data ON courses USING GIN (weeks_data);