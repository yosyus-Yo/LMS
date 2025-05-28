-- AI-LMS Supabase 데이터베이스 스키마
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 사용자 프로필 테이블 (Supabase Auth 확장)
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

-- 카테고리 테이블
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 코스 테이블
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- 모듈 테이블
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

-- 챕터 테이블
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

-- 수강등록 테이블
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

-- 구독 플랜 테이블
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

-- 구독 테이블
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

-- 결제 테이블
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

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_chapters_module ON public.chapters(module_id);
CREATE INDEX IF NOT EXISTS idx_modules_course ON public.modules(course_id);

-- RLS (Row Level Security) 정책 활성화
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
-- 사용자는 자신의 프로필만 조회/수정 가능
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 공개된 코스는 모든 사용자가 조회 가능
CREATE POLICY "Anyone can view published courses" ON public.courses
  FOR SELECT USING (status = 'published');

-- 강사는 자신의 코스만 관리 가능
CREATE POLICY "Instructors can manage own courses" ON public.courses
  FOR ALL USING (instructor_id = auth.uid());

-- 사용자는 자신의 수강등록만 조회/수정 가능
CREATE POLICY "Users can manage own enrollments" ON public.enrollments
  FOR ALL USING (user_id = auth.uid());

-- 카테고리는 모든 사용자가 조회 가능
CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT USING (true);

-- 모듈과 챕터는 코스 접근 권한에 따라
CREATE POLICY "Users can view course modules" ON public.modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE id = modules.course_id 
      AND (status = 'published' OR instructor_id = auth.uid())
    )
  );

CREATE POLICY "Users can view course chapters" ON public.chapters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.modules 
      JOIN public.courses ON courses.id = modules.course_id
      WHERE modules.id = chapters.module_id 
      AND (courses.status = 'published' OR courses.instructor_id = auth.uid())
    )
  );

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_modules_updated_at ON public.modules;
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_chapters_updated_at ON public.chapters;
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON public.chapters FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

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

-- Auth 사용자 생성시 프로필 자동 생성 트리거
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 기본 데이터 삽입
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
SELECT 'AI-LMS 데이터베이스 스키마가 성공적으로 생성되었습니다!' as message;