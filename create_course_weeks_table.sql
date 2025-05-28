-- course_weeks 테이블 생성
CREATE TABLE IF NOT EXISTS course_weeks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url TEXT,
    materials JSONB DEFAULT '[]'::jsonb,
    duration_minutes INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_course_weeks_course_id ON course_weeks(course_id);
CREATE INDEX IF NOT EXISTS idx_course_weeks_order ON course_weeks(course_id, order_index);

-- RLS (Row Level Security) 정책 활성화
ALTER TABLE course_weeks ENABLE ROW LEVEL SECURITY;

-- 읽기 정책: 모든 사용자가 읽을 수 있음
CREATE POLICY "course_weeks_select_policy" ON course_weeks
    FOR SELECT USING (true);

-- 삽입 정책: 인증된 사용자만 삽입 가능
CREATE POLICY "course_weeks_insert_policy" ON course_weeks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 업데이트 정책: 인증된 사용자만 업데이트 가능
CREATE POLICY "course_weeks_update_policy" ON course_weeks
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 삭제 정책: 인증된 사용자만 삭제 가능
CREATE POLICY "course_weeks_delete_policy" ON course_weeks
    FOR DELETE USING (auth.role() = 'authenticated');

-- 트리거 함수 생성 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_course_weeks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER course_weeks_updated_at_trigger
    BEFORE UPDATE ON course_weeks
    FOR EACH ROW
    EXECUTE FUNCTION update_course_weeks_updated_at();