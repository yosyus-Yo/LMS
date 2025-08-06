-- 강의별 Q&A 게시판 테이블 생성

-- 1. course_qna 테이블 (질문/답변)
CREATE TABLE IF NOT EXISTS course_qna (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES course_qna(id) ON DELETE CASCADE, -- 답변의 경우 질문 ID
    title VARCHAR(255), -- 질문만 제목을 가짐 (답변은 NULL)
    content TEXT NOT NULL,
    is_question BOOLEAN DEFAULT true, -- true: 질문, false: 답변
    is_private BOOLEAN DEFAULT false, -- 비공개 질문 여부
    status VARCHAR(50) DEFAULT 'pending', -- pending, answered, closed
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. course_qna_likes 테이블 (좋아요)
CREATE TABLE IF NOT EXISTS course_qna_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    qna_id UUID NOT NULL REFERENCES course_qna(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(qna_id, user_id)
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_course_qna_course_id ON course_qna(course_id);
CREATE INDEX IF NOT EXISTS idx_course_qna_author_id ON course_qna(author_id);
CREATE INDEX IF NOT EXISTS idx_course_qna_parent_id ON course_qna(parent_id);
CREATE INDEX IF NOT EXISTS idx_course_qna_status ON course_qna(status);
CREATE INDEX IF NOT EXISTS idx_course_qna_created_at ON course_qna(created_at);

-- 4. RLS 정책 설정
ALTER TABLE course_qna ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_qna_likes ENABLE ROW LEVEL SECURITY;

-- 공개 질문은 수강생과 강사가 볼 수 있음
CREATE POLICY "Users can view public course qna" ON course_qna
FOR SELECT USING (
    is_private = false 
    AND 
    (
        -- 수강생인 경우
        EXISTS (
            SELECT 1 FROM enrollments 
            WHERE enrollments.course_id = course_qna.course_id 
            AND enrollments.user_id = auth.uid()
        )
        OR
        -- 강사인 경우
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_qna.course_id 
            AND courses.instructor_id = auth.uid()
        )
        OR
        -- 관리자인 경우
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    )
);

-- 비공개 질문은 작성자와 강사만 볼 수 있음
CREATE POLICY "Users can view private course qna" ON course_qna
FOR SELECT USING (
    is_private = true 
    AND 
    (
        author_id = auth.uid()
        OR
        -- 강사인 경우
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_qna.course_id 
            AND courses.instructor_id = auth.uid()
        )
        OR
        -- 관리자인 경우
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    )
);

-- 수강생은 자신의 질문을 작성할 수 있음
CREATE POLICY "Students can create questions" ON course_qna
FOR INSERT WITH CHECK (
    is_question = true
    AND
    EXISTS (
        SELECT 1 FROM enrollments 
        WHERE enrollments.course_id = course_qna.course_id 
        AND enrollments.user_id = auth.uid()
    )
    AND
    author_id = auth.uid()
);

-- 강사는 답변을 작성할 수 있음
CREATE POLICY "Instructors can create answers" ON course_qna
FOR INSERT WITH CHECK (
    is_question = false
    AND
    parent_id IS NOT NULL
    AND
    EXISTS (
        SELECT 1 FROM courses 
        WHERE courses.id = course_qna.course_id 
        AND courses.instructor_id = auth.uid()
    )
    AND
    author_id = auth.uid()
);

-- 작성자는 자신의 글을 수정할 수 있음
CREATE POLICY "Users can update own qna" ON course_qna
FOR UPDATE USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

-- 작성자는 자신의 글을 삭제할 수 있음
CREATE POLICY "Users can delete own qna" ON course_qna
FOR DELETE USING (author_id = auth.uid());

-- 좋아요 정책
CREATE POLICY "Users can manage own likes" ON course_qna_likes
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 5. 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_course_qna_updated_at 
    BEFORE UPDATE ON course_qna 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. 트리거 함수: 답변 작성 시 질문 상태 업데이트
CREATE OR REPLACE FUNCTION update_question_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_question = false AND NEW.parent_id IS NOT NULL THEN
        UPDATE course_qna 
        SET status = 'answered', updated_at = NOW()
        WHERE id = NEW.parent_id AND status = 'pending';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_question_status_trigger
    AFTER INSERT ON course_qna 
    FOR EACH ROW EXECUTE FUNCTION update_question_status();

-- 7. 샘플 데이터 확인용 뷰
CREATE OR REPLACE VIEW course_qna_with_details AS
SELECT 
    q.*,
    author.first_name || ' ' || author.last_name as author_name,
    author.email as author_email,
    author.role as author_role,
    c.title as course_title,
    (
        SELECT COUNT(*) 
        FROM course_qna answers 
        WHERE answers.parent_id = q.id AND answers.is_question = false
    ) as answer_count
FROM course_qna q
LEFT JOIN user_profiles author ON q.author_id = author.id
LEFT JOIN courses c ON q.course_id = c.id
ORDER BY q.created_at DESC;