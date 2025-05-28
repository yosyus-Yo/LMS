-- RLS 정책 수정: 일반 사용자도 published 강의를 볼 수 있도록 설정

-- 1. 기존 courses 테이블 RLS 정책 확인 및 삭제
DROP POLICY IF EXISTS "Users can view published courses" ON courses;
DROP POLICY IF EXISTS "Users can view courses" ON courses;
DROP POLICY IF EXISTS "Enable read access for all users" ON courses;
DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;
DROP POLICY IF EXISTS "Admins can view all courses" ON courses;
DROP POLICY IF EXISTS "Instructors can view their own courses" ON courses;

-- 2. 새로운 RLS 정책 생성: 모든 사용자가 published 강의 조회 가능
CREATE POLICY "Anyone can view published courses" ON courses
FOR SELECT 
USING (status = 'published');

-- 3. 관리자는 모든 강의 조회/수정 가능 (수정된 문법)
CREATE POLICY "Admins can view all courses" ON courses
FOR SELECT 
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
  OR 
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- 4. 강사는 자신의 강의만 조회/수정 가능
CREATE POLICY "Instructors can view their own courses" ON courses
FOR SELECT 
USING (
  instructor_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'instructor'
    AND id = courses.instructor_id
  )
);

-- 5. 카테고리는 모든 사용자가 조회 가능
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
CREATE POLICY "Anyone can view categories" ON categories
FOR SELECT 
USING (true);

-- 6. 사용자 프로필은 공개 정보만 조회 가능
DROP POLICY IF EXISTS "Anyone can view public profiles" ON user_profiles;
CREATE POLICY "Anyone can view public profiles" ON user_profiles
FOR SELECT 
USING (true);

-- 7. RLS 활성화 확인
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 8. 정책 확인 쿼리
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('courses', 'categories', 'user_profiles')
ORDER BY tablename, policyname;