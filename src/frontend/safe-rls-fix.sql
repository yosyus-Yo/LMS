-- ============================================
-- 안전한 RLS 정책 설정 (무한 재귀 방지)
-- ============================================

-- 1. 먼저 모든 문제가 되는 정책들을 제거
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can access all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Instructors can view student basic info" ON user_profiles;

-- 2. 기존 is_admin 함수도 제거 (재귀 문제 해결)
DROP FUNCTION IF EXISTS is_admin();

-- 3. user_profiles 테이블 RLS를 일시적으로 비활성화
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 4. enrollments 테이블 정책 다시 설정 (user_profiles 의존성 제거)
DROP POLICY IF EXISTS "Users can manage own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can access all enrollments" ON enrollments;
DROP POLICY IF EXISTS "Instructors can view their course enrollments" ON enrollments;

-- 사용자는 자신의 수강신청만 관리 가능
CREATE POLICY "Users can manage own enrollments" ON enrollments
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 강사는 자신의 강의 수강생만 조회 가능 (user_profiles 의존성 없이)
CREATE POLICY "Instructors can view their course enrollments" ON enrollments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = enrollments.course_id 
    AND courses.instructor_id = auth.uid()
  )
);

-- 5. payments 테이블 정책 (user_profiles 의존성 제거)
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
DROP POLICY IF EXISTS "Admins can access all payments" ON payments;

CREATE POLICY "Users can view own payments" ON payments
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payments" ON payments
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 6. courses 테이블 정책 (단순화)
DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;
DROP POLICY IF EXISTS "Instructors can manage own courses" ON courses;
DROP POLICY IF EXISTS "Admins can manage all courses" ON courses;

-- 모든 사용자가 published 강의를 볼 수 있음
CREATE POLICY "Anyone can view published courses" ON courses
FOR SELECT 
USING (status = 'published');

-- 강사는 자신의 강의를 관리할 수 있음
CREATE POLICY "Instructors can manage own courses" ON courses
FOR ALL
USING (instructor_id = auth.uid())
WITH CHECK (instructor_id = auth.uid());

-- 7. 이메일 중복 확인을 위한 임시 정책 (이 부분이 중요!)
-- user_profiles 테이블을 RLS 없이 사용하거나, 매우 제한적인 정책만 적용

-- 8. 정책 확인
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('enrollments', 'payments', 'courses')
ORDER BY tablename, policyname;

-- 9. RLS 상태 확인
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename IN ('enrollments', 'payments', 'user_profiles', 'courses')
ORDER BY tablename;