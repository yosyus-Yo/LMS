-- 수료증 관련 데이터베이스 스키마

-- 1. 수료증 테이블
CREATE TABLE certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  certificate_number VARCHAR(20) UNIQUE NOT NULL, -- 수료증 번호 (예: CERT-2025-000001)
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completion_date DATE NOT NULL, -- 수강 완료일
  final_score DECIMAL(5,2), -- 최종 점수 (0-100)
  total_study_hours INTEGER DEFAULT 0, -- 총 학습 시간 (분 단위)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- 중복 발급 방지
  UNIQUE(user_id, course_id)
);

-- 2. 수강 진도 추적 테이블 (기존 테이블이 없다면 생성)
CREATE TABLE IF NOT EXISTS course_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  video_id VARCHAR(255), -- 비디오 식별자
  completed_at TIMESTAMP WITH TIME ZONE,
  watch_duration INTEGER DEFAULT 0, -- 시청 시간 (초 단위)
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, course_id, week_number, video_id)
);

-- 3. 퀴즈 결과 테이블 (기존 테이블이 없다면 생성)
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  quiz_data JSONB NOT NULL, -- 퀴즈 문제와 답안
  score DECIMAL(5,2) NOT NULL, -- 점수 (0-100)
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, course_id, week_number)
);

-- 4. 인덱스 생성
CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_certificates_course_id ON certificates(course_id);
CREATE INDEX idx_certificates_issued_at ON certificates(issued_at);
CREATE INDEX idx_certificates_number ON certificates(certificate_number);

CREATE INDEX IF NOT EXISTS idx_course_progress_user_course ON course_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_completion ON course_progress(user_id, course_id, is_completed);

CREATE INDEX IF NOT EXISTS idx_quiz_results_user_course ON quiz_results(user_id, course_id);

-- 5. RLS 정책 설정
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- 수료증 정책
CREATE POLICY "Users can view their own certificates" ON certificates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own certificates" ON certificates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 강사와 관리자는 자신의 강의 수료증 조회 가능
CREATE POLICY "Instructors can view their course certificates" ON certificates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = course_id 
      AND (courses.instructor_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'))
    )
  );

-- 진도 추적 정책
CREATE POLICY "Users can manage their own progress" ON course_progress
  FOR ALL USING (auth.uid() = user_id);

-- 퀴즈 결과 정책  
CREATE POLICY "Users can manage their own quiz results" ON quiz_results
  FOR ALL USING (auth.uid() = user_id);

-- 6. 수료증 번호 생성 함수
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  year_str TEXT;
  cert_number TEXT;
BEGIN
  -- 현재 연도 추출
  year_str := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- 해당 연도의 다음 순번 계산
  SELECT COALESCE(MAX(CAST(SUBSTRING(certificate_number FROM 'CERT-' || year_str || '-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM certificates
  WHERE certificate_number LIKE 'CERT-' || year_str || '-%';
  
  -- 수료증 번호 생성 (6자리 패딩)
  cert_number := 'CERT-' || year_str || '-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN cert_number;
END;
$$ LANGUAGE plpgsql;

-- 7. 수강 진도율 계산 함수
CREATE OR REPLACE FUNCTION calculate_course_completion_rate(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS DECIMAL AS $$
DECLARE
  total_weeks INTEGER;
  completed_weeks INTEGER;
  completion_rate DECIMAL;
BEGIN
  -- 총 주차 수 조회 (course_weeks 테이블에서)
  SELECT COUNT(DISTINCT week_number)
  INTO total_weeks
  FROM course_weeks
  WHERE course_id = p_course_id
    AND is_published = true;
  
  -- total_weeks가 0이면 enrollments 테이블의 completed_chapters 개수로 대체
  IF total_weeks IS NULL OR total_weeks = 0 THEN
    SELECT array_length(completed_chapters, 1)
    INTO total_weeks
    FROM enrollments
    WHERE user_id = p_user_id AND course_id = p_course_id;
  END IF;
  
  -- 완료한 주차 수 조회
  SELECT COUNT(DISTINCT week_number)
  INTO completed_weeks
  FROM course_progress
  WHERE user_id = p_user_id 
    AND course_id = p_course_id 
    AND is_completed = TRUE;
  
  -- course_progress에 데이터가 없으면 enrollments의 completed_chapters로 대체
  IF completed_weeks IS NULL OR completed_weeks = 0 THEN
    SELECT array_length(completed_chapters, 1)
    INTO completed_weeks
    FROM enrollments
    WHERE user_id = p_user_id AND course_id = p_course_id;
  END IF;
  
  -- 진도율 계산 (백분율)
  IF total_weeks IS NULL OR total_weeks = 0 THEN
    RETURN 0;
  END IF;
  
  completion_rate := (COALESCE(completed_weeks, 0)::DECIMAL / total_weeks::DECIMAL) * 100;
  
  RETURN ROUND(completion_rate, 2);
END;
$$ LANGUAGE plpgsql;

-- 8. 평균 퀴즈 점수 계산 함수
CREATE OR REPLACE FUNCTION calculate_average_quiz_score(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS DECIMAL AS $$
DECLARE
  avg_score DECIMAL;
BEGIN
  SELECT AVG(score)
  INTO avg_score
  FROM quiz_results
  WHERE user_id = p_user_id AND course_id = p_course_id;
  
  RETURN COALESCE(ROUND(avg_score, 2), 0);
END;
$$ LANGUAGE plpgsql;

-- 9. 총 학습 시간 계산 함수
CREATE OR REPLACE FUNCTION calculate_total_study_hours(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  total_minutes INTEGER;
BEGIN
  SELECT SUM(watch_duration) / 60 -- 초를 분으로 변환
  INTO total_minutes
  FROM course_progress
  WHERE user_id = p_user_id AND course_id = p_course_id;
  
  RETURN COALESCE(total_minutes, 0);
END;
$$ LANGUAGE plpgsql;

-- 10. 수료증 자동 발급 함수
CREATE OR REPLACE FUNCTION auto_issue_certificate(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS TABLE(
  certificate_id UUID,
  certificate_number TEXT,
  completion_rate DECIMAL,
  final_score DECIMAL,
  total_hours INTEGER
) AS $$
DECLARE
  v_completion_rate DECIMAL;
  v_avg_score DECIMAL;
  v_total_hours INTEGER;
  v_cert_number TEXT;
  v_cert_id UUID;
  existing_cert_id UUID;
BEGIN
  -- 이미 발급된 수료증 확인
  SELECT id INTO existing_cert_id
  FROM certificates
  WHERE user_id = p_user_id AND course_id = p_course_id;
  
  IF existing_cert_id IS NOT NULL THEN
    RAISE EXCEPTION '이미 발급된 수료증이 있습니다.';
  END IF;
  
  -- 진도율 계산
  v_completion_rate := calculate_course_completion_rate(p_user_id, p_course_id);
  
  -- 진도율이 100%가 아니면 발급 불가
  IF v_completion_rate < 100 THEN
    RAISE EXCEPTION '수강 진도가 100%% 완료되지 않았습니다. 현재 진도율: %', v_completion_rate;
  END IF;
  
  -- 평균 점수 및 총 학습 시간 계산
  v_avg_score := calculate_average_quiz_score(p_user_id, p_course_id);
  v_total_hours := calculate_total_study_hours(p_user_id, p_course_id);
  
  -- 수료증 번호 생성
  v_cert_number := generate_certificate_number();
  
  -- 수료증 발급
  INSERT INTO certificates (
    user_id,
    course_id,
    certificate_number,
    completion_date,
    final_score,
    total_study_hours
  ) VALUES (
    p_user_id,
    p_course_id,
    v_cert_number,
    CURRENT_DATE,
    v_avg_score,
    v_total_hours
  ) RETURNING id INTO v_cert_id;
  
  -- 결과 반환
  RETURN QUERY SELECT 
    v_cert_id,
    v_cert_number,
    v_completion_rate,
    v_avg_score,
    v_total_hours;
END;
$$ LANGUAGE plpgsql;

-- 11. 진도 업데이트 시 수료증 자동 발급 트리거
CREATE OR REPLACE FUNCTION trigger_auto_certificate()
RETURNS TRIGGER AS $$
DECLARE
  completion_rate DECIMAL;
BEGIN
  -- 진도가 완료로 변경된 경우에만 체크
  IF NEW.is_completed = TRUE AND (OLD.is_completed IS NULL OR OLD.is_completed = FALSE) THEN
    -- 진도율 계산
    completion_rate := calculate_course_completion_rate(NEW.user_id, NEW.course_id);
    
    -- 100% 완료시 수료증 자동 발급 시도
    IF completion_rate >= 100 THEN
      BEGIN
        PERFORM auto_issue_certificate(NEW.user_id, NEW.course_id);
      EXCEPTION
        WHEN OTHERS THEN
          -- 이미 발급된 경우 등 예외 상황은 무시
          NULL;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_course_completion_certificate
  AFTER UPDATE OF is_completed ON course_progress
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_certificate();

-- 12. 수료증 조회 뷰
CREATE OR REPLACE VIEW certificate_details AS
SELECT 
  c.id,
  c.user_id,
  c.course_id,
  c.certificate_number,
  c.issued_at,
  c.completion_date,
  c.final_score,
  c.total_study_hours,
  u.first_name,
  u.last_name,
  u.email,
  co.title as course_title,
  co.description as course_description,
  instructor.first_name as instructor_first_name,
  instructor.last_name as instructor_last_name
FROM certificates c
JOIN user_profiles u ON c.user_id = u.id
JOIN courses co ON c.course_id = co.id
JOIN user_profiles instructor ON co.instructor_id = instructor.id;