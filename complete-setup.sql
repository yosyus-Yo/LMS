-- AI-LMS 완전한 데이터베이스 설정 스크립트
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================
-- 1. 사용자 프로필 테이블 (Supabase Auth 확장)
-- =================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'instructor', 'student')),
  first_name TEXT,
  last_name TEXT,
  profile_image_url TEXT,
  bio TEXT,
  phone_number TEXT,
  address TEXT,
  organization TEXT,
  job_title TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================
-- 2. 카테고리 테이블
-- =================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================
-- 3. 코스 테이블
-- =================================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  instructor_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  level TEXT NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  price DECIMAL(10,2) DEFAULT 0.00,
  is_free BOOLEAN DEFAULT FALSE,
  prerequisites TEXT,
  learning_outcomes JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  language TEXT DEFAULT 'Korean',
  duration_minutes INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  rating_count INTEGER DEFAULT 0,
  enrollment_count INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,
  weeks_data JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- =================================================================
-- 4. 주차별 강의 테이블
-- =================================================================
CREATE TABLE IF NOT EXISTS public.course_weeks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
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

-- =================================================================
-- 5. 모듈 테이블
-- =================================================================
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================
-- 6. 챕터 테이블
-- =================================================================
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL DEFAULT 'text' CHECK (content_type IN ('video', 'text', 'pdf', 'quiz', 'assignment')),
  content TEXT,
  file_url TEXT,
  video_url TEXT,
  duration_minutes INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  is_free_preview BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================
-- 7. 수강등록 테이블
-- =================================================================
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  progress INTEGER DEFAULT 0,
  completed_chapters JSONB DEFAULT '[]'::jsonb,
  last_accessed_chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  enrollment_date TIMESTAMPTZ DEFAULT NOW(),
  completion_date TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

-- =================================================================
-- 8. 수료증 테이블
-- =================================================================
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  certificate_number VARCHAR(20) UNIQUE NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completion_date DATE NOT NULL,
  final_score DECIMAL(5,2),
  total_study_hours INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, course_id)
);

-- =================================================================
-- 9. 수강 진도 추적 테이블
-- =================================================================
CREATE TABLE IF NOT EXISTS public.course_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  video_id VARCHAR(255),
  completed_at TIMESTAMP WITH TIME ZONE,
  watch_duration INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, course_id, week_number, video_id)
);

-- =================================================================
-- 10. 퀴즈 결과 테이블
-- =================================================================
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  quiz_data JSONB NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, course_id, week_number)
);

-- =================================================================
-- 11. 강의별 Q&A 테이블
-- =================================================================
CREATE TABLE IF NOT EXISTS public.course_qna (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.course_qna(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT NOT NULL,
    is_question BOOLEAN DEFAULT true,
    is_private BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'pending',
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- 12. Q&A 좋아요 테이블
-- =================================================================
CREATE TABLE IF NOT EXISTS public.course_qna_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    qna_id UUID NOT NULL REFERENCES public.course_qna(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(qna_id, user_id)
);

-- =================================================================
-- 13. 구독 플랜 테이블
-- =================================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'basic', 'premium', 'enterprise')),
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration_days INTEGER DEFAULT 30,
  max_courses INTEGER,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================
-- 14. 구독 테이블
-- =================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  auto_renewal BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================
-- 15. 결제 테이블
-- =================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('subscription', 'course', 'one_time')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'KRW',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('card', 'bank_transfer', 'virtual_account', 'phone', 'kakaopay', 'naverpay')),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  tid TEXT UNIQUE,
  order_id TEXT UNIQUE NOT NULL,
  pg_tid TEXT,
  receipt_url TEXT,
  card_name TEXT,
  card_number TEXT,
  card_quota TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  failure_reason TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =================================================================
-- 16. 인덱스 생성
-- =================================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_weeks_data ON public.courses USING GIN (weeks_data);
CREATE INDEX IF NOT EXISTS idx_course_weeks_course_id ON public.course_weeks(course_id);
CREATE INDEX IF NOT EXISTS idx_course_weeks_order ON public.course_weeks(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_chapters_module ON public.chapters(module_id);
CREATE INDEX IF NOT EXISTS idx_modules_course ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON public.certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON public.certificates(issued_at);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON public.certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_course_progress_user_course ON public.course_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_completion ON public.course_progress(user_id, course_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_course ON public.quiz_results(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_course_qna_course_id ON public.course_qna(course_id);
CREATE INDEX IF NOT EXISTS idx_course_qna_author_id ON public.course_qna(author_id);
CREATE INDEX IF NOT EXISTS idx_course_qna_parent_id ON public.course_qna(parent_id);
CREATE INDEX IF NOT EXISTS idx_course_qna_status ON public.course_qna(status);
CREATE INDEX IF NOT EXISTS idx_course_qna_created_at ON public.course_qna(created_at);

-- =================================================================
-- 17. RLS (Row Level Security) 정책 활성화
-- =================================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_qna ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_qna_likes ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- 18. RLS 정책 생성
-- =================================================================

-- 사용자 프로필 정책
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 코스 정책
CREATE POLICY "Anyone can view published courses" ON public.courses
  FOR SELECT USING (status = 'published');

CREATE POLICY "Instructors can manage own courses" ON public.courses
  FOR ALL USING (instructor_id = auth.uid());

-- 주차별 강의 정책
CREATE POLICY "course_weeks_select_policy" ON public.course_weeks
    FOR SELECT USING (true);

CREATE POLICY "course_weeks_insert_policy" ON public.course_weeks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "course_weeks_update_policy" ON public.course_weeks
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "course_weeks_delete_policy" ON public.course_weeks
    FOR DELETE USING (auth.role() = 'authenticated');

-- 수강등록 정책
CREATE POLICY "Users can manage own enrollments" ON public.enrollments
  FOR ALL USING (user_id = auth.uid());

-- 카테고리 정책
CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT USING (true);

-- 모듈 정책
CREATE POLICY "Users can view course modules" ON public.modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE id = modules.course_id 
      AND (status = 'published' OR instructor_id = auth.uid())
    )
  );

-- 챕터 정책
CREATE POLICY "Users can view course chapters" ON public.chapters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.modules 
      JOIN public.courses ON courses.id = modules.course_id
      WHERE modules.id = chapters.module_id 
      AND (courses.status = 'published' OR courses.instructor_id = auth.uid())
    )
  );

-- 수료증 정책
CREATE POLICY "Users can view their own certificates" ON public.certificates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own certificates" ON public.certificates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Instructors can view their course certificates" ON public.certificates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = course_id 
      AND (courses.instructor_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM public.user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'))
    )
  );

-- 진도 추적 정책
CREATE POLICY "Users can manage their own progress" ON public.course_progress
  FOR ALL USING (auth.uid() = user_id);

-- 퀴즈 결과 정책  
CREATE POLICY "Users can manage their own quiz results" ON public.quiz_results
  FOR ALL USING (auth.uid() = user_id);

-- Q&A 정책
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

CREATE POLICY "Users can view private course qna" ON public.course_qna
FOR SELECT USING (
    is_private = true 
    AND 
    (
        author_id = auth.uid()
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

CREATE POLICY "Students can create questions" ON public.course_qna
FOR INSERT WITH CHECK (
    is_question = true
    AND
    EXISTS (
        SELECT 1 FROM public.enrollments 
        WHERE enrollments.course_id = course_qna.course_id 
        AND enrollments.user_id = auth.uid()
    )
    AND
    author_id = auth.uid()
);

CREATE POLICY "Instructors can create answers" ON public.course_qna
FOR INSERT WITH CHECK (
    is_question = false
    AND
    parent_id IS NOT NULL
    AND
    EXISTS (
        SELECT 1 FROM public.courses 
        WHERE courses.id = course_qna.course_id 
        AND courses.instructor_id = auth.uid()
    )
    AND
    author_id = auth.uid()
);

CREATE POLICY "Users can update own qna" ON public.course_qna
FOR UPDATE USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can delete own qna" ON public.course_qna
FOR DELETE USING (author_id = auth.uid());

-- 좋아요 정책
CREATE POLICY "Users can manage own likes" ON public.course_qna_likes
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =================================================================
-- 19. 트리거 함수들
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
  );
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
-- 20. 트리거 적용
-- =================================================================

-- updated_at 트리거들
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON public.chapters FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Auth 사용자 생성시 프로필 자동 생성 트리거
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 주차별 강의 업데이트 트리거
CREATE TRIGGER course_weeks_updated_at_trigger
    BEFORE UPDATE ON public.course_weeks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 수료증 자동 발급 트리거
CREATE TRIGGER trigger_course_completion_certificate
  AFTER UPDATE OF is_completed ON public.course_progress
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_certificate();

-- Q&A 트리거들
CREATE TRIGGER update_course_qna_updated_at 
    BEFORE UPDATE ON public.course_qna 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_question_status_trigger
    AFTER INSERT ON public.course_qna 
    FOR EACH ROW EXECUTE FUNCTION update_question_status();

-- =================================================================
-- 21. 뷰 생성
-- =================================================================

-- 수료증 상세 정보 뷰
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
FROM public.certificates c
JOIN public.user_profiles u ON c.user_id = u.id
JOIN public.courses co ON c.course_id = co.id
JOIN public.user_profiles instructor ON co.instructor_id = instructor.id;

-- Q&A 상세 정보 뷰
CREATE OR REPLACE VIEW course_qna_with_details AS
SELECT 
    q.*,
    author.first_name || ' ' || author.last_name as author_name,
    author.email as author_email,
    author.role as author_role,
    c.title as course_title,
    (
        SELECT COUNT(*) 
        FROM public.course_qna answers 
        WHERE answers.parent_id = q.id AND answers.is_question = false
    ) as answer_count
FROM public.course_qna q
LEFT JOIN public.user_profiles author ON q.author_id = author.id
LEFT JOIN public.courses c ON q.course_id = c.id
ORDER BY q.created_at DESC;

-- =================================================================
-- 22. 기본 데이터 삽입
-- =================================================================

-- 카테고리
INSERT INTO public.categories (name, description) VALUES 
  ('프로그래밍', '웹 개발, 앱 개발, 데이터 과학 등'),
  ('디자인', 'UI/UX 디자인, 그래픽 디자인, 웹 디자인 등'),
  ('마케팅', '디지털 마케팅, SNS 마케팅, 콘텐츠 마케팅 등'),
  ('비즈니스', '창업, 경영, 재무 관리 등'),
  ('언어', '영어, 중국어, 일본어 등 외국어 학습')
ON CONFLICT DO NOTHING;

-- 구독 플랜
INSERT INTO public.subscription_plans (name, plan_type, description, price, features) VALUES 
  ('무료 플랜', 'free', '기본적인 강의 시청 기능을 제공합니다', 0, '["기본 강의 시청", "커뮤니티 참여"]'),
  ('베이직 플랜', 'basic', '더 많은 강의와 기능을 이용할 수 있습니다', 9900, '["모든 기본 강의", "강의 노트", "진도 관리"]'),
  ('프리미엄 플랜', 'premium', '모든 강의와 프리미엄 기능을 이용할 수 있습니다', 29900, '["모든 강의 무제한", "오프라인 다운로드", "1:1 멘토링", "수료증 발급"]'),
  ('엔터프라이즈 플랜', 'enterprise', '기업용 맞춤 솔루션을 제공합니다', 99900, '["무제한 사용자", "맞춤 강의", "전담 지원", "상세 분석 리포트"]')
ON CONFLICT DO NOTHING;

-- 성공 메시지
SELECT 'AI-LMS 완전한 데이터베이스 설정이 성공적으로 완료되었습니다!' as message;