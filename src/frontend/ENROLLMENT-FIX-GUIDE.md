# 🔧 수강신청 + 회원가입 문제 해결 가이드

## 문제 상황
- 강사 계정에서 수강생이 보이지 않음
- Supabase에 수강신청 데이터가 저장되지 않음
- enrollments 테이블이 비어있음
- 회원가입 시 role(역할) 정보가 저장되지 않음
- 회원가입 후 프로필 생성 실패

## 원인
Row Level Security (RLS) 정책이 제대로 설정되지 않아서 수강신청 데이터와 사용자 프로필이 저장되지 않고 있습니다.

## 해결 방법

### 1단계: Supabase 대시보드 접속
1. https://supabase.com 에 로그인
2. LMS 프로젝트 선택
3. 좌측 메뉴에서 "SQL Editor" 클릭

### 2단계: 완전한 RLS 정책 적용
`complete-rls-fix.sql` 파일의 내용을 SQL Editor에 붙여넣고 실행하세요. 또는 아래 SQL 코드를 복사해서 실행하세요:

```sql
-- ============================================
-- 완전한 RLS 정책 설정 (수강신청 + 회원가입)
-- ============================================

-- 1. enrollments 테이블 RLS
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can access all enrollments" ON enrollments;
DROP POLICY IF EXISTS "Instructors can view their course enrollments" ON enrollments;

CREATE POLICY "Users can manage own enrollments" ON enrollments
FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 2. 관리자 함수 생성
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins can access all enrollments" ON enrollments
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Instructors can view their course enrollments" ON enrollments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = enrollments.course_id 
    AND courses.instructor_id = auth.uid()
  )
);

-- 3. user_profiles 테이블 RLS (회원가입을 위해 중요!)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can access all profiles" ON user_profiles;

CREATE POLICY "Users can view own profile" ON user_profiles
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON user_profiles
FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile" ON user_profiles
FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can access all profiles" ON user_profiles
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 4. payments 테이블 RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON payments;

CREATE POLICY "Users can view own payments" ON payments
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payments" ON payments
FOR INSERT WITH CHECK (user_id = auth.uid());
```

### 3단계: 정책 확인
다음 쿼리를 실행하여 정책이 제대로 적용되었는지 확인하세요:

```sql
-- 정책 확인
SELECT 
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename IN ('enrollments', 'payments')
ORDER BY tablename, policyname;
```

### 4단계: 테스트

#### 회원가입 테스트
1. 웹사이트에서 회원가입 페이지 접속
2. 학생으로 회원가입 시도
3. 강사로 회원가입 시도
4. 각각 role이 제대로 저장되는지 확인

#### 수강신청 테스트
1. 강의를 구매해보기
2. 강사 계정으로 로그인하여 수강생 목록 확인

## 예상 결과
- ✅ 회원가입 시 user_profiles 테이블에 role 정보와 함께 저장됨
- ✅ 수강신청시 enrollments 테이블에 데이터 저장됨
- ✅ 강사 대시보드에서 수강생 목록 표시됨
- ✅ 결제 시스템과 수강신청 연동 정상화
- ✅ 역할별 권한 제어 정상 작동

## 추가 문제 해결

### 만약 여전히 문제가 있다면:

1. **테이블 구조 확인**:
```sql
-- enrollments 테이블 구조 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'enrollments';
```

2. **기존 데이터 확인**:
```sql
-- 관리자 계정으로 모든 수강신청 조회
SELECT * FROM enrollments;
```

3. **사용자 권한 확인**:
```sql
-- 현재 사용자 정보 확인
SELECT auth.uid(), auth.jwt();
```

## 파일 위치
- 수정된 SQL 스크립트: `manual-rls-fix.sql`
- 테스트 스크립트: `test-enrollment.js`
- 테이블 상태 확인: `check-enrollment-table.js`

## 다음 단계
RLS 정책 적용 후 다음을 확인하세요:
1. 새로운 수강신청이 정상적으로 저장되는지
2. 강사 대시보드에서 수강생 목록이 표시되는지
3. 결제 완료 후 자동으로 수강등록이 되는지