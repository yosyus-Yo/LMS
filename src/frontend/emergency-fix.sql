-- 즉시 해결: 모든 관련 테이블 RLS 완전 비활성화

-- 1. 모든 테이블 RLS 비활성화
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE chapters DISABLE ROW LEVEL SECURITY;

-- 2. 모든 기존 정책 삭제
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE tablename IN ('courses', 'categories', 'user_profiles', 'modules', 'chapters'))
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- 3. 상태 확인
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('courses', 'categories', 'user_profiles', 'modules', 'chapters')
ORDER BY tablename;

-- 4. 테스트 쿼리 - 직접 강의 데이터 확인
SELECT 
  id,
  title,
  status,
  instructor_id,
  created_at
FROM courses 
ORDER BY created_at DESC 
LIMIT 5;