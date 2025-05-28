-- 즉시 해결: courses 테이블 RLS 비활성화

-- 1. courses 테이블 RLS 비활성화
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- 2. 관련 테이블들도 비활성화
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE chapters DISABLE ROW LEVEL SECURITY;

-- 3. 확인 쿼리 - 실제 강의 데이터가 있는지 확인
SELECT 
  id,
  title,
  status,
  instructor_id,
  created_at
FROM courses 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. RLS 상태 확인
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('courses', 'categories', 'user_profiles')
ORDER BY tablename;