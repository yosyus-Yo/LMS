-- 수강신청 관련 RLS 정책 수동 적용 스크립트
-- Supabase 대시보드 > SQL Editor에서 실행하세요

-- 1. enrollments 테이블 RLS 활성화
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can manage own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can access all enrollments" ON enrollments;

-- 3. 사용자가 자신의 수강 정보를 조회할 수 있도록 허용
CREATE POLICY "Users can view own enrollments" ON enrollments
FOR SELECT 
USING (user_id = auth.uid());

-- 4. 사용자가 자신의 수강 정보를 관리(생성/수정/삭제)할 수 있도록 허용
CREATE POLICY "Users can manage own enrollments" ON enrollments
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 5. 관리자는 모든 수강 정보에 접근 가능
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

CREATE POLICY "Admins can access all enrollments" ON enrollments
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- 6. 강사가 자신의 강의 수강생 정보를 볼 수 있도록 허용
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

-- 7. payments 테이블도 RLS 적용
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

-- 8. 정책 확인 쿼리
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('enrollments', 'payments')
ORDER BY tablename, policyname;