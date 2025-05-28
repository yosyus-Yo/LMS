-- 공개 데이터 테이블 RLS 비활성화 (영구적 해결책)
-- 강의 목록, 카테고리, 강사 프로필은 비회원도 볼 수 있어야 함

-- 1. courses 테이블 RLS 비활성화
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- 2. categories 테이블 RLS 비활성화  
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- 3. user_profiles 테이블 RLS 비활성화
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 4. 상태 확인
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('courses', 'categories', 'user_profiles');

-- 이유: 
-- 1. 강의 목록은 마케팅 목적으로 모든 사용자에게 공개되어야 함
-- 2. 카테고리는 필터링을 위해 공개 정보
-- 3. 강사 프로필(이름, 약력)은 강의 소개에 필요한 공개 정보
-- 4. 민감한 정보(결제, 개인정보 등)는 별도 테이블에서 RLS 적용

-- 보안이 필요한 테이블들:
-- - enrollments (수강 등록 정보)
-- - payments (결제 정보)  
-- - user_progress (학습 진도)
-- - subscriptions (구독 정보)
-- - user_private_data (개인 정보)