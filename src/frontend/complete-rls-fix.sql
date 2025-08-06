-- ============================================
-- 완전한 RLS 정책 설정 (수강신청 + 회원가입)
-- ============================================

-- 1. enrollments 테이블 RLS 활성화
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- 2. 기존 enrollments 정책 모두 삭제
DROP POLICY IF EXISTS "Users can view own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can manage own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can access all enrollments" ON enrollments;
DROP POLICY IF EXISTS "Instructors can view their course enrollments" ON enrollments;

-- 3. 사용자가 자신의 수강신청을 관리할 수 있도록 허용
CREATE POLICY "Users can manage own enrollments" ON enrollments
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. 관리자 함수 생성 (이미 있다면 덮어쓰기)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 관리자는 모든 수강신청에 접근 가능
CREATE POLICY "Admins can access all enrollments" ON enrollments
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- 6. 강사가 자신의 강의 수강생을 볼 수 있도록 허용
CREATE POLICY "Instructors can view their course enrollments" ON enrollments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = enrollments.course_id 
    AND courses.instructor_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'instructor')
  )
);

-- 7. payments 테이블 RLS 설정
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

CREATE POLICY "Admins can access all payments" ON payments
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- 8. user_profiles 테이블 RLS 설정 (회원가입을 위해 중요!)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can access all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Instructors can view student basic info" ON user_profiles;

-- 사용자는 자신의 프로필만 조회 가능
CREATE POLICY "Users can view own profile" ON user_profiles
FOR SELECT 
USING (id = auth.uid());

-- 회원가입 시 자신의 프로필 생성 가능 (중요!)
CREATE POLICY "Users can insert own profile" ON user_profiles
FOR INSERT
WITH CHECK (id = auth.uid());

-- 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "Users can update own profile" ON user_profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 관리자는 모든 프로필에 접근 가능
CREATE POLICY "Admins can access all profiles" ON user_profiles
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- 강사는 수강생의 기본 정보(이름, 이메일)만 조회 가능
CREATE POLICY "Instructors can view student basic info" ON user_profiles
FOR SELECT
USING (
  role = 'student' 
  AND 
  EXISTS (
    SELECT 1 FROM user_profiles instructor_profile
    WHERE instructor_profile.id = auth.uid() 
    AND instructor_profile.role IN ('instructor', 'admin')
  )
);

-- 9. courses 테이블 RLS 확인 및 설정
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
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

-- 관리자는 모든 강의를 관리할 수 있음
CREATE POLICY "Admins can manage all courses" ON courses
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- 10. 정책 확인 쿼리
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('enrollments', 'payments', 'user_profiles', 'courses')
ORDER BY tablename, policyname;

-- 11. 테이블별 RLS 활성화 상태 확인
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename IN ('enrollments', 'payments', 'user_profiles', 'courses')
ORDER BY tablename;