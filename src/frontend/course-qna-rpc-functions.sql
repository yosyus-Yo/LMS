-- Q&A 좋아요 카운트 증가/감소를 위한 RPC 함수들

-- 1. 좋아요 수 증가 함수
CREATE OR REPLACE FUNCTION increment_qna_like_count(qna_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE course_qna 
  SET like_count = COALESCE(like_count, 0) + 1
  WHERE id = qna_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 좋아요 수 감소 함수
CREATE OR REPLACE FUNCTION decrement_qna_like_count(qna_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE course_qna 
  SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
  WHERE id = qna_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Q&A 통계 조회 함수 (선택사항)
CREATE OR REPLACE FUNCTION get_course_qna_stats(course_id_param UUID, user_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_questions', (
      SELECT COUNT(*) 
      FROM course_qna 
      WHERE course_id = course_id_param AND is_question = true
    ),
    'answered_questions', (
      SELECT COUNT(*) 
      FROM course_qna 
      WHERE course_id = course_id_param AND is_question = true AND status = 'answered'
    ),
    'my_questions', (
      SELECT COUNT(*) 
      FROM course_qna 
      WHERE course_id = course_id_param AND is_question = true AND author_id = user_id_param
    ),
    'pending_questions', (
      SELECT COUNT(*) 
      FROM course_qna 
      WHERE course_id = course_id_param AND is_question = true AND status = 'pending'
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION increment_qna_like_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_qna_like_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_course_qna_stats(UUID, UUID) TO authenticated;