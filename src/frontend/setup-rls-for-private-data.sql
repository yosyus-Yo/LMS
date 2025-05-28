-- 민감한 데이터 테이블에만 RLS 적용

-- 1. enrollments 테이블 - 사용자는 자신의 수강 정보만 볼 수 있음
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own enrollments" ON enrollments;
CREATE POLICY "Users can view own enrollments" ON enrollments
FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own enrollments" ON enrollments;
CREATE POLICY "Users can manage own enrollments" ON enrollments
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 2. payments 테이블 - 사용자는 자신의 결제 정보만 볼 수 있음
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments" ON payments
FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
CREATE POLICY "Users can insert own payments" ON payments
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 3. subscriptions 테이블 - 사용자는 자신의 구독 정보만 볼 수 있음
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
    CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT 
    USING (user_id = auth.uid());
    
    DROP POLICY IF EXISTS "Users can manage own subscriptions" ON subscriptions;
    CREATE POLICY "Users can manage own subscriptions" ON subscriptions
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 4. user_progress 테이블 - 사용자는 자신의 학습 진도만 볼 수 있음
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_progress') THEN
    ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
    CREATE POLICY "Users can view own progress" ON user_progress
    FOR SELECT 
    USING (user_id = auth.uid());
    
    DROP POLICY IF EXISTS "Users can manage own progress" ON user_progress;
    CREATE POLICY "Users can manage own progress" ON user_progress
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 5. modules와 chapters는 published된 것만 공개
ALTER TABLE modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE chapters DISABLE ROW LEVEL SECURITY;

-- 또는 published만 보이게 하려면:
-- ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Anyone can view published modules" ON modules
-- FOR SELECT USING (is_published = true);

-- ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;  
-- CREATE POLICY "Anyone can view published chapters" ON chapters
-- FOR SELECT USING (is_published = true);

-- 6. 관리자 권한 정책 추가
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

-- 관리자는 모든 데이터 접근 가능
DROP POLICY IF EXISTS "Admins can access all enrollments" ON enrollments;
CREATE POLICY "Admins can access all enrollments" ON enrollments
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can access all payments" ON payments;
CREATE POLICY "Admins can access all payments" ON payments
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- 7. 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('enrollments', 'payments', 'subscriptions', 'user_progress')
ORDER BY tablename, policyname;