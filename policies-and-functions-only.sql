-- 정책과 함수만 생성하는 스크립트
-- 기존 테이블은 그대로 두고 필요한 정책과 함수만 추가

-- =================================================================
-- 1. 트리거 함수들 (이미 존재하면 덮어쓰기)
-- =================================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 사용자 프로필 자동 생성 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'first_name', 
    NEW.raw_user_meta_data->>'last_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- 수료증 번호 생성 함수
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  year_str TEXT;
  cert_number TEXT;
BEGIN
  year_str := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(certificate_number FROM 'CERT-' || year_str || '-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.certificates
  WHERE certificate_number LIKE 'CERT-' || year_str || '-%';
  
  cert_number := 'CERT-' || year_str || '-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN cert_number;
END;
$$ LANGUAGE plpgsql;

-- 수강 진도율 계산 함수
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
  SELECT COUNT(DISTINCT week_number)
  INTO total_weeks
  FROM public.course_weeks
  WHERE course_id = p_course_id
    AND is_published = true;
  
  IF total_weeks IS NULL OR total_weeks = 0 THEN
    SELECT array_length(completed_chapters, 1)
    INTO total_weeks
    FROM public.enrollments
    WHERE user_id = p_user_id AND course_id = p_course_id;
  END IF;
  
  SELECT COUNT(DISTINCT week_number)
  INTO completed_weeks
  FROM public.course_progress
  WHERE user_id = p_user_id 
    AND course_id = p_course_id 
    AND is_completed = TRUE;
  
  IF completed_weeks IS NULL OR completed_weeks = 0 THEN
    SELECT array_length(completed_chapters, 1)
    INTO completed_weeks
    FROM public.enrollments
    WHERE user_id = p_user_id AND course_id = p_course_id;
  END IF;
  
  IF total_weeks IS NULL OR total_weeks = 0 THEN
    RETURN 0;
  END IF;
  
  completion_rate := (COALESCE(completed_weeks, 0)::DECIMAL / total_weeks::DECIMAL) * 100;
  
  RETURN ROUND(completion_rate, 2);
END;
$$ LANGUAGE plpgsql;

-- 평균 퀴즈 점수 계산 함수
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
  FROM public.quiz_results
  WHERE user_id = p_user_id AND course_id = p_course_id;
  
  RETURN COALESCE(ROUND(avg_score, 2), 0);
END;
$$ LANGUAGE plpgsql;

-- 총 학습 시간 계산 함수
CREATE OR REPLACE FUNCTION calculate_total_study_hours(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  total_minutes INTEGER;
BEGIN
  SELECT SUM(watch_duration) / 60
  INTO total_minutes
  FROM public.course_progress
  WHERE user_id = p_user_id AND course_id = p_course_id;
  
  RETURN COALESCE(total_minutes, 0);
END;
$$ LANGUAGE plpgsql;

-- 수료증 자동 발급 함수
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
  SELECT id INTO existing_cert_id
  FROM public.certificates
  WHERE user_id = p_user_id AND course_id = p_course_id;
  
  IF existing_cert_id IS NOT NULL THEN
    RAISE EXCEPTION '이미 발급된 수료증이 있습니다.';
  END IF;
  
  v_completion_rate := calculate_course_completion_rate(p_user_id, p_course_id);
  
  IF v_completion_rate < 100 THEN
    RAISE EXCEPTION '수강 진도가 100%% 완료되지 않았습니다. 현재 진도율: %', v_completion_rate;
  END IF;
  
  v_avg_score := calculate_average_quiz_score(p_user_id, p_course_id);
  v_total_hours := calculate_total_study_hours(p_user_id, p_course_id);
  v_cert_number := generate_certificate_number();
  
  INSERT INTO public.certificates (
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
  
  RETURN QUERY SELECT 
    v_cert_id,
    v_cert_number,
    v_completion_rate,
    v_avg_score,
    v_total_hours;
END;
$$ LANGUAGE plpgsql;

-- 수료증 자동 발급 트리거 함수
CREATE OR REPLACE FUNCTION trigger_auto_certificate()
RETURNS TRIGGER AS $$
DECLARE
  completion_rate DECIMAL;
BEGIN
  IF NEW.is_completed = TRUE AND (OLD.is_completed IS NULL OR OLD.is_completed = FALSE) THEN
    completion_rate := calculate_course_completion_rate(NEW.user_id, NEW.course_id);
    
    IF completion_rate >= 100 THEN
      BEGIN
        PERFORM auto_issue_certificate(NEW.user_id, NEW.course_id);
      EXCEPTION
        WHEN OTHERS THEN
          NULL;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Q&A 상태 업데이트 함수
CREATE OR REPLACE FUNCTION update_question_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_question = false AND NEW.parent_id IS NOT NULL THEN
        UPDATE public.course_qna 
        SET status = 'answered', updated_at = NOW()
        WHERE id = NEW.parent_id AND status = 'pending';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =================================================================
-- 2. RLS 정책들 생성 (이미 존재하면 무시)
-- =================================================================

-- 사용자 프로필 정책
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can view own profile') THEN
        CREATE POLICY "Users can view own profile" ON public.user_profiles
          FOR SELECT USING (auth.uid() = id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON public.user_profiles
          FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

-- 코스 정책
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Anyone can view published courses') THEN
        CREATE POLICY "Anyone can view published courses" ON public.courses
          FOR SELECT USING (status = 'published');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Instructors can manage own courses') THEN
        CREATE POLICY "Instructors can manage own courses" ON public.courses
          FOR ALL USING (instructor_id = auth.uid());
    END IF;
END $$;

-- 주차별 강의 정책
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'course_weeks' AND policyname = 'course_weeks_select_policy') THEN
        CREATE POLICY "course_weeks_select_policy" ON public.course_weeks
            FOR SELECT USING (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'course_weeks' AND policyname = 'course_weeks_insert_policy') THEN
        CREATE POLICY "course_weeks_insert_policy" ON public.course_weeks
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'course_weeks' AND policyname = 'course_weeks_update_policy') THEN
        CREATE POLICY "course_weeks_update_policy" ON public.course_weeks
            FOR UPDATE USING (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'course_weeks' AND policyname = 'course_weeks_delete_policy') THEN
        CREATE POLICY "course_weeks_delete_policy" ON public.course_weeks
            FOR DELETE USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 수강등록 정책
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enrollments' AND policyname = 'Users can manage own enrollments') THEN
        CREATE POLICY "Users can manage own enrollments" ON public.enrollments
          FOR ALL USING (user_id = auth.uid());
    END IF;
END $$;

-- 카테고리 정책
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Anyone can view categories') THEN
        CREATE POLICY "Anyone can view categories" ON public.categories
          FOR SELECT USING (true);
    END IF;
END $$;

-- 모듈 정책
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'modules' AND policyname = 'Users can view course modules') THEN
        CREATE POLICY "Users can view course modules" ON public.modules
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM public.courses 
              WHERE id = modules.course_id 
              AND (status = 'published' OR instructor_id = auth.uid())
            )
          );
    END IF;
END $$;

-- 챕터 정책
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chapters' AND policyname = 'Users can view course chapters') THEN
        CREATE POLICY "Users can view course chapters" ON public.chapters
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM public.modules 
              JOIN public.courses ON courses.id = modules.course_id
              WHERE modules.id = chapters.module_id 
              AND (courses.status = 'published' OR courses.instructor_id = auth.uid())
            )
          );
    END IF;
END $$;

-- 수료증 관련 정책들 (테이블이 존재하는 경우에만)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificates' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'certificates' AND policyname = 'Users can view their own certificates') THEN
            CREATE POLICY "Users can view their own certificates" ON public.certificates
              FOR SELECT USING (auth.uid() = user_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'certificates' AND policyname = 'Users can insert their own certificates') THEN
            CREATE POLICY "Users can insert their own certificates" ON public.certificates
              FOR INSERT WITH CHECK (auth.uid() = user_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'certificates' AND policyname = 'Instructors can view their course certificates') THEN
            CREATE POLICY "Instructors can view their course certificates" ON public.certificates
              FOR SELECT USING (
                EXISTS (
                  SELECT 1 FROM public.courses 
                  WHERE courses.id = course_id 
                  AND (courses.instructor_id = auth.uid() OR 
                       EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'))
                )
              );
        END IF;
    END IF;
END $$;

-- Q&A 관련 정책들 (테이블이 존재하는 경우에만)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_qna' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'course_qna' AND policyname = 'Users can view public course qna') THEN
            CREATE POLICY "Users can view public course qna" ON public.course_qna
            FOR SELECT USING (
                is_private = false 
                AND 
                (
                    EXISTS (
                        SELECT 1 FROM public.enrollments 
                        WHERE enrollments.course_id = course_qna.course_id 
                        AND enrollments.user_id = auth.uid()
                    )
                    OR
                    EXISTS (
                        SELECT 1 FROM public.courses 
                        WHERE courses.id = course_qna.course_id 
                        AND courses.instructor_id = auth.uid()
                    )
                    OR
                    EXISTS (
                        SELECT 1 FROM public.user_profiles 
                        WHERE user_profiles.id = auth.uid() 
                        AND user_profiles.role = 'admin'
                    )
                )
            );
        END IF;
    END IF;
END $$;

-- =================================================================
-- 3. RLS 활성화 (테이블이 존재하는 경우에만)
-- =================================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
        ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses' AND table_schema = 'public') THEN
        ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_weeks' AND table_schema = 'public') THEN
        ALTER TABLE public.course_weeks ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enrollments' AND table_schema = 'public') THEN
        ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories' AND table_schema = 'public') THEN
        ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'modules' AND table_schema = 'public') THEN
        ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chapters' AND table_schema = 'public') THEN
        ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificates' AND table_schema = 'public') THEN
        ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_progress' AND table_schema = 'public') THEN
        ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quiz_results' AND table_schema = 'public') THEN
        ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_qna' AND table_schema = 'public') THEN
        ALTER TABLE public.course_qna ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_qna_likes' AND table_schema = 'public') THEN
        ALTER TABLE public.course_qna_likes ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 성공 메시지
SELECT '정책과 함수가 성공적으로 설정되었습니다!' as message;