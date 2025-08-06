-- ============================================
-- 긴급 RLS 정책 수정 (무한 재귀 완전 해결)
-- ============================================

-- 1. 문제가 되는 모든 정책과 함수 완전 제거
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can access all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Instructors can view student basic info" ON user_profiles;

DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- 2. user_profiles 테이블 RLS 완전 비활성화 (이메일 중복 확인을 위해)
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 3. enrollments 테이블만 간단한 RLS 적용
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can access all enrollments" ON enrollments;
DROP POLICY IF EXISTS "Instructors can view their course enrollments" ON enrollments;

-- 사용자는 자신의 수강신청만 관리
CREATE POLICY "Users can manage own enrollments" ON enrollments
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 강사는 자신의 강의 수강생만 조회 (단순화)
CREATE POLICY "Instructors can view course enrollments" ON enrollments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = enrollments.course_id 
    AND courses.instructor_id = auth.uid()
  )
);

-- 4. payments 테이블 간단한 RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
DROP POLICY IF EXISTS "Admins can access all payments" ON payments;

CREATE POLICY "Users can view own payments" ON payments
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payments" ON payments
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 5. courses 테이블 간단한 RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;
DROP POLICY IF EXISTS "Instructors can manage own courses" ON courses;
DROP POLICY IF EXISTS "Admins can manage all courses" ON courses;

-- 모든 사용자가 published 강의 조회 가능
CREATE POLICY "Anyone can view published courses" ON courses
FOR SELECT 
USING (status = 'published');

-- 강사는 자신의 강의만 관리
CREATE POLICY "Instructors can manage own courses" ON courses
FOR ALL
USING (instructor_id = auth.uid())
WITH CHECK (instructor_id = auth.uid());

-- 6. 확인 쿼리
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('enrollments', 'payments', 'courses')
ORDER BY tablename, policyname;

-- 7. RLS 상태 확인
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename IN ('enrollments', 'payments', 'user_profiles', 'courses')
ORDER BY tablename;