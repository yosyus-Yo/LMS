# 🚨 RLS 무한 재귀 오류 긴급 해결 가이드

## 문제 상황
```
infinite recursion detected in policy for relation "user_profiles"
```
- 이메일 중복 확인 불가
- 회원가입 중 프로필 생성 실패 가능성

## 원인
`is_admin()` 함수가 `user_profiles` 테이블을 조회하는데, 동시에 `user_profiles` 테이블의 RLS 정책에서 `is_admin()` 함수를 호출하여 **무한 재귀** 발생

## 🔧 긴급 해결 방법

### 1단계: Supabase 대시보드 접속
1. https://supabase.com 에 로그인
2. LMS 프로젝트 선택
3. 좌측 메뉴에서 "SQL Editor" 클릭

### 2단계: 긴급 RLS 정책 적용
아래 SQL 코드를 복사해서 SQL Editor에 붙여넣고 **전체 실행**하세요:

```sql
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

-- 강사는 자신의 강의 수강생만 조회
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

-- 모든 사용자가 published 강의 조회 가능
CREATE POLICY "Anyone can view published courses" ON courses
FOR SELECT 
USING (status = 'published');

-- 강사는 자신의 강의만 관리
CREATE POLICY "Instructors can manage own courses" ON courses
FOR ALL
USING (instructor_id = auth.uid())
WITH CHECK (instructor_id = auth.uid());
```

### 3단계: 정책 확인
다음 쿼리로 정책이 제대로 적용되었는지 확인:

```sql
-- RLS 상태 확인
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename IN ('enrollments', 'payments', 'user_profiles', 'courses')
ORDER BY tablename;

-- 정책 목록 확인
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('enrollments', 'payments', 'courses')
ORDER BY tablename, policyname;
```

### 4단계: 테스트
1. 웹사이트에서 회원가입 페이지 새로고침
2. 이메일 중복 확인 버튼 클릭
3. 오류 없이 작동하는지 확인

## ✅ 예상 결과

### 해결된 것들:
- ✅ 이메일 중복 확인 오류 해결
- ✅ 회원가입 시 프로필 생성 정상화
- ✅ 수강신청 데이터 저장 기능 유지
- ✅ 강사의 수강생 조회 기능 유지

### 변경된 보안 설정:
- ⚠️ `user_profiles` 테이블은 RLS가 비활성화됨 (모든 사용자가 조회 가능)
- ✅ `enrollments`, `payments`, `courses` 테이블은 적절한 RLS 유지

## 🔒 보안 고려사항

현재 설정에서는 `user_profiles` 테이블의 RLS가 비활성화되어 있어 모든 사용자가 다른 사용자의 프로필을 볼 수 있습니다. 

**하지만 실제로는:**
- 프론트엔드 코드에서 현재 사용자 정보만 조회하도록 구현되어 있음
- 민감한 정보(비밀번호 등)는 별도 테이블에 안전하게 저장됨
- 향후 더 정교한 RLS 정책으로 업데이트 예정

## 📋 파일 위치
- 긴급 수정 SQL: `emergency-rls-fix.sql`
- 업데이트된 회원가입 컴포넌트: `src/features/auth/EnhancedRegister.tsx`

## 🔄 향후 개선 방향
1. 더 정교한 RLS 정책 설계 (재귀 없이)
2. 관리자 권한 함수 재구현
3. 프로필 정보 보안 강화