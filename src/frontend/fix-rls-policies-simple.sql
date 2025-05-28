-- 간단한 RLS 정책: 모든 사용자가 published 강의를 볼 수 있도록 설정

-- 1. 모든 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view published courses" ON courses;
DROP POLICY IF EXISTS "Users can view courses" ON courses;
DROP POLICY IF EXISTS "Enable read access for all users" ON courses;
DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;
DROP POLICY IF EXISTS "Admins can view all courses" ON courses;
DROP POLICY IF EXISTS "Instructors can view their own courses" ON courses;

-- 2. 가장 간단한 정책: 모든 사용자가 published 강의 조회 가능
CREATE POLICY "Enable read for published courses" ON courses
FOR SELECT 
USING (status = 'published');

-- 3. 관리자와 강사를 위한 정책 (user_profiles 테이블 기반)
CREATE POLICY "Enable read for admin users" ON courses
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'instructor')
  )
);

-- 4. 강사는 자신의 강의만 수정 가능
CREATE POLICY "Instructors can edit own courses" ON courses
FOR ALL
USING (instructor_id = auth.uid())
WITH CHECK (instructor_id = auth.uid());

-- 5. 관리자는 모든 강의 수정 가능
CREATE POLICY "Admins can edit all courses" ON courses
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- 6. 카테고리는 모든 사용자가 조회 가능
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
CREATE POLICY "Enable read for all categories" ON categories
FOR SELECT 
USING (true);

-- 7. 사용자 프로필은 공개 정보만 조회 가능
DROP POLICY IF EXISTS "Anyone can view public profiles" ON user_profiles;
CREATE POLICY "Enable read for public profiles" ON user_profiles
FOR SELECT 
USING (true);

-- 8. RLS 활성화 확인
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 9. 정책 확인 쿼리
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('courses', 'categories', 'user_profiles')
ORDER BY tablename, policyname;