-- 안전한 Supabase 데이터베이스 클린업 스크립트
-- 의존성을 고려하여 CASCADE 옵션 사용

-- 1. 기존 RLS 정책들 삭제
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can manage own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can manage own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Users can view course modules" ON public.modules;
DROP POLICY IF EXISTS "Users can view course chapters" ON public.chapters;
DROP POLICY IF EXISTS "course_weeks_select_policy" ON public.course_weeks;
DROP POLICY IF EXISTS "course_weeks_insert_policy" ON public.course_weeks;
DROP POLICY IF EXISTS "course_weeks_update_policy" ON public.course_weeks;
DROP POLICY IF EXISTS "course_weeks_delete_policy" ON public.course_weeks;
DROP POLICY IF EXISTS "Users can view their own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Users can insert their own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Instructors can view their course certificates" ON public.certificates;
DROP POLICY IF EXISTS "Users can manage their own progress" ON public.course_progress;
DROP POLICY IF EXISTS "Users can manage their own quiz results" ON public.quiz_results;
DROP POLICY IF EXISTS "Users can view public course qna" ON public.course_qna;
DROP POLICY IF EXISTS "Users can view private course qna" ON public.course_qna;
DROP POLICY IF EXISTS "Students can create questions" ON public.course_qna;
DROP POLICY IF EXISTS "Instructors can create answers" ON public.course_qna;
DROP POLICY IF EXISTS "Users can update own qna" ON public.course_qna;
DROP POLICY IF EXISTS "Users can delete own qna" ON public.course_qna;
DROP POLICY IF EXISTS "Users can manage own likes" ON public.course_qna_likes;

-- 2. 기존 트리거들 삭제 (CASCADE 사용)
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles CASCADE;
DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses CASCADE;
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories CASCADE;
DROP TRIGGER IF EXISTS update_modules_updated_at ON public.modules CASCADE;
DROP TRIGGER IF EXISTS update_chapters_updated_at ON public.chapters CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS course_weeks_updated_at_trigger ON public.course_weeks CASCADE;
DROP TRIGGER IF EXISTS trigger_course_completion_certificate ON public.course_progress CASCADE;
DROP TRIGGER IF EXISTS update_course_qna_updated_at ON public.course_qna CASCADE;
DROP TRIGGER IF EXISTS update_question_status_trigger ON public.course_qna CASCADE;

-- 기존 테이블의 트리거들도 삭제
DROP TRIGGER IF EXISTS update_learning_progress_updated_at ON public.learning_progress CASCADE;
DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews CASCADE;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions CASCADE;

-- 3. 기존 함수들 삭제 (CASCADE 사용)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_course_weeks_updated_at() CASCADE;
DROP FUNCTION IF EXISTS generate_certificate_number() CASCADE;
DROP FUNCTION IF EXISTS calculate_course_completion_rate(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS calculate_average_quiz_score(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS calculate_total_study_hours(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS auto_issue_certificate(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS trigger_auto_certificate() CASCADE;
DROP FUNCTION IF EXISTS update_question_status() CASCADE;

-- 4. 기존 뷰들 삭제
DROP VIEW IF EXISTS certificate_details CASCADE;
DROP VIEW IF EXISTS course_qna_with_details CASCADE;

-- 성공 메시지
SELECT '안전한 클린업이 완료되었습니다. 이제 complete-setup.sql을 실행하세요!' as message;