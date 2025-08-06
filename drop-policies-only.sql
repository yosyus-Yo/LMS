-- 기존 RLS 정책만 삭제하는 스크립트
-- 테이블과 데이터는 유지하고 정책만 정리합니다

-- 1. 기존 RLS 정책 삭제
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

-- 성공 메시지
SELECT '기존 RLS 정책들이 삭제되었습니다. 이제 complete-setup.sql을 실행하세요!' as message;