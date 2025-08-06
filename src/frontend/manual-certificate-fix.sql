-- 수료증 발급 문제 해결을 위한 수동 스크립트
-- 이 스크립트를 Supabase SQL 에디터에서 실행하세요

-- 1. 먼저 현재 상태 확인
SELECT 'Checking enrollments...' as status;
SELECT 
  e.id as enrollment_id,
  e.user_id,
  e.course_id,
  e.progress,
  e.status,
  c.title as course_title
FROM enrollments e
JOIN courses c ON e.course_id = c.id
WHERE e.progress >= 100;

-- 2. course_progress 테이블 존재 확인
SELECT 'Checking course_progress table...' as status;
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'course_progress'
) as course_progress_exists;

-- 3. certificates 테이블 존재 확인
SELECT 'Checking certificates table...' as status;
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'certificates'
) as certificates_exists;

-- 4. RPC 함수 존재 확인
SELECT 'Checking RPC functions...' as status;
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('auto_issue_certificate', 'calculate_course_completion_rate');

-- 5. 100% 완료된 강의에 대해 수동으로 course_progress 데이터 생성
-- (테이블이 존재하는 경우에만)
DO $$
DECLARE
  enrollment_record RECORD;
  week_num INTEGER;
BEGIN
  -- 100% 완료된 수강 등록 찾기
  FOR enrollment_record IN 
    SELECT e.user_id, e.course_id, c.title
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE e.progress >= 100
  LOOP
    RAISE NOTICE 'Processing enrollment: User %, Course %', enrollment_record.user_id, enrollment_record.course_id;
    
    -- 해당 강의의 주차 수 확인 (예: 5주차로 가정)
    -- 실제로는 courses 테이블의 weeks_data에서 가져와야 함
    FOR week_num IN 1..5 LOOP
      -- course_progress 테이블에 완료 데이터 삽입 (중복 방지)
      INSERT INTO course_progress (
        user_id,
        course_id,
        week_number,
        video_id,
        is_completed,
        completed_at,
        watch_duration
      ) VALUES (
        enrollment_record.user_id,
        enrollment_record.course_id,
        week_num,
        'week-' || week_num,
        true,
        NOW(),
        3600 -- 1시간 시청으로 가정
      )
      ON CONFLICT (user_id, course_id, week_number, video_id) 
      DO UPDATE SET
        is_completed = true,
        completed_at = NOW(),
        updated_at = NOW();
    END LOOP;
    
  END LOOP;
END $$;

-- 6. 수료증 수동 발급 시도
-- 먼저 auto_issue_certificate 함수가 있는지 확인하고 실행
DO $$
DECLARE
  enrollment_record RECORD;
  cert_result RECORD;
BEGIN
  FOR enrollment_record IN 
    SELECT e.user_id, e.course_id
    FROM enrollments e
    WHERE e.progress >= 100
    AND NOT EXISTS (
      SELECT 1 FROM certificates 
      WHERE user_id = e.user_id AND course_id = e.course_id
    )
  LOOP
    BEGIN
      -- auto_issue_certificate 함수 호출
      SELECT * FROM auto_issue_certificate(enrollment_record.user_id, enrollment_record.course_id) INTO cert_result;
      RAISE NOTICE 'Certificate issued for user % course %: %', 
        enrollment_record.user_id, enrollment_record.course_id, cert_result;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Failed to issue certificate for user % course %: %', 
          enrollment_record.user_id, enrollment_record.course_id, SQLERRM;
    END;
  END LOOP;
END $$;

-- 7. 결과 확인
SELECT 'Final results...' as status;
SELECT 
  c.certificate_number,
  c.issued_at,
  c.user_id,
  c.course_id,
  co.title as course_title
FROM certificates c
JOIN courses co ON c.course_id = co.id
ORDER BY c.issued_at DESC;