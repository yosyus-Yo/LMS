-- 빠른 수료증 발급 수정 스크립트
-- 기존 데이터베이스 구조에 맞춰 즉시 수료증을 발급합니다

-- 1. 수료증 테이블 생성 (있으면 무시)
CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  certificate_number VARCHAR(50) UNIQUE NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completion_date DATE NOT NULL,
  final_score DECIMAL(5,2) DEFAULT 100.0,
  total_study_hours INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, course_id)
);

-- 2. 수료증 번호 생성 함수 (간단 버전)
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  year_str TEXT;
  cert_number TEXT;
BEGIN
  year_str := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(COUNT(*), 0) + 1
  INTO next_number
  FROM certificates
  WHERE created_at >= (CURRENT_DATE - INTERVAL '1 year');
  
  cert_number := 'CERT-' || year_str || '-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN cert_number;
END;
$$ LANGUAGE plpgsql;

-- 3. 간단한 수료증 발급 함수 (enrollments 기반)
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
  v_progress DECIMAL;
  v_cert_number TEXT;
  v_cert_id UUID;
  existing_cert_id UUID;
  enrollment_exists BOOLEAN;
BEGIN
  -- 수강 등록 확인
  SELECT EXISTS(
    SELECT 1 FROM enrollments 
    WHERE user_id = p_user_id AND course_id = p_course_id
  ) INTO enrollment_exists;
  
  IF NOT enrollment_exists THEN
    RAISE EXCEPTION '수강 등록이 되어있지 않습니다.';
  END IF;
  
  -- 이미 발급된 수료증 확인
  SELECT id INTO existing_cert_id
  FROM certificates
  WHERE user_id = p_user_id AND course_id = p_course_id;
  
  IF existing_cert_id IS NOT NULL THEN
    RAISE EXCEPTION '이미 발급된 수료증이 있습니다.';
  END IF;
  
  -- enrollments 테이블에서 진도율 확인
  SELECT progress INTO v_progress
  FROM enrollments
  WHERE user_id = p_user_id AND course_id = p_course_id;
  
  -- 진도율이 100%가 아니면 발급 불가
  IF v_progress IS NULL OR v_progress < 100 THEN
    RAISE EXCEPTION '수강 진도가 100%% 완료되지 않았습니다. 현재 진도율: %', COALESCE(v_progress, 0);
  END IF;
  
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
    100.0, -- 기본 점수
    0      -- 기본 학습 시간
  ) RETURNING id INTO v_cert_id;
  
  -- 결과 반환
  RETURN QUERY SELECT 
    v_cert_id,
    v_cert_number,
    v_progress,
    100.0::DECIMAL,
    0::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- 4. RLS 정책 설정
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "Users can view their own certificates" ON certificates;
DROP POLICY IF EXISTS "Users can insert their own certificates" ON certificates;

CREATE POLICY "Users can view their own certificates" ON certificates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own certificates" ON certificates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. 100% 완료된 모든 수강생에게 수료증 자동 발급
DO $$
DECLARE
  enrollment_record RECORD;
  cert_result RECORD;
BEGIN
  RAISE NOTICE '100%% 완료된 수강생들에게 수료증 발급 시작...';
  
  FOR enrollment_record IN 
    SELECT e.user_id, e.course_id, c.title, e.progress
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE e.progress >= 100
    AND NOT EXISTS (
      SELECT 1 FROM certificates 
      WHERE user_id = e.user_id AND course_id = e.course_id
    )
  LOOP
    BEGIN
      SELECT * FROM auto_issue_certificate(enrollment_record.user_id, enrollment_record.course_id) INTO cert_result;
      RAISE NOTICE '✅ 수료증 발급 성공: 사용자 %, 강의 "%" -> 수료증 번호 %', 
        enrollment_record.user_id, enrollment_record.title, cert_result.certificate_number;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '❌ 수료증 발급 실패: 사용자 %, 강의 "%" -> 오류: %', 
          enrollment_record.user_id, enrollment_record.title, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '수료증 발급 완료!';
END $$;

-- 6. 발급 결과 확인
SELECT 
  '🎓 발급된 수료증 목록' as title,
  c.certificate_number,
  c.issued_at,
  up.first_name || ' ' || up.last_name as student_name,
  co.title as course_title
FROM certificates c
JOIN courses co ON c.course_id = co.id
LEFT JOIN user_profiles up ON c.user_id = up.id
ORDER BY c.issued_at DESC;