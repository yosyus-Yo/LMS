-- 테스트 데이터 삽입 (강의가 보이지 않는 문제 해결용)

-- 1. 카테고리 데이터 삽입
INSERT INTO categories (id, name, description, icon) VALUES 
('550e8400-e29b-41d4-a716-446655440001', '프로그래밍', 'Programming courses', '💻'),
('550e8400-e29b-41d4-a716-446655440002', '데이터 사이언스', 'Data science courses', '📊'),
('550e8400-e29b-41d4-a716-446655440003', 'AI/ML', 'Artificial Intelligence and Machine Learning', '🤖'),
('550e8400-e29b-41d4-a716-446655440004', '웹 개발', 'Web development courses', '🌐')
ON CONFLICT (id) DO NOTHING;

-- 2. 강사 프로필 데이터 삽입 (가상의 강사)
INSERT INTO user_profiles (id, email, role, first_name, last_name, bio) VALUES 
('550e8400-e29b-41d4-a716-446655440101', 'instructor1@example.com', 'instructor', '김', '강사', '프로그래밍 전문 강사'),
('550e8400-e29b-41d4-a716-446655440102', 'instructor2@example.com', 'instructor', '이', '선생', 'AI/ML 전문가'),
('550e8400-e29b-41d4-a716-446655440103', 'instructor3@example.com', 'instructor', '박', '교수', '웹 개발 전문가')
ON CONFLICT (id) DO NOTHING;

-- 3. 강의 데이터 삽입
INSERT INTO courses (
  id, 
  title, 
  slug, 
  description, 
  short_description,
  instructor_id, 
  category_id, 
  status, 
  level, 
  price, 
  is_free,
  duration_minutes,
  rating,
  rating_count,
  learning_outcomes,
  tags,
  language
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440201',
  'Python 기초 프로그래밍',
  'python-basics',
  'Python 프로그래밍의 기초를 배우는 강의입니다. 변수, 함수, 클래스 등 기본 개념부터 실습까지 포함되어 있습니다.',
  'Python 기초를 배우는 입문자를 위한 강의',
  '550e8400-e29b-41d4-a716-446655440101',
  '550e8400-e29b-41d4-a716-446655440001',
  'published',
  'beginner',
  50000,
  false,
  720,
  4.5,
  12,
  ARRAY['Python 기본 문법 이해', '변수와 함수 사용법', '객체지향 프로그래밍 기초'],
  ARRAY['python', 'programming', 'beginner'],
  'Korean'
),
(
  '550e8400-e29b-41d4-a716-446655440202',
  '머신러닝 기초',
  'machine-learning-basics',
  '머신러닝의 기초 개념과 주요 알고리즘을 학습합니다. 실습을 통해 실제 데이터로 모델을 만들어봅니다.',
  '머신러닝 입문자를 위한 기초 강의',
  '550e8400-e29b-41d4-a716-446655440102',
  '550e8400-e29b-41d4-a716-446655440003',
  'published',
  'intermediate',
  80000,
  false,
  960,
  4.7,
  25,
  ARRAY['머신러닝 기본 개념', '주요 알고리즘 이해', '실제 데이터 분석'],
  ARRAY['machine-learning', 'ai', 'data-science'],
  'Korean'
),
(
  '550e8400-e29b-41d4-a716-446655440203',
  'React 웹 개발',
  'react-web-development',
  'React를 이용한 현대적인 웹 애플리케이션 개발 방법을 배웁니다. 컴포넌트, 상태관리, 라우팅 등을 다룹니다.',
  'React로 웹앱을 만드는 실무 강의',
  '550e8400-e29b-41d4-a716-446655440103',
  '550e8400-e29b-41d4-a716-446655440004',
  'published',
  'intermediate',
  75000,
  false,
  840,
  4.6,
  18,
  ARRAY['React 컴포넌트 개발', '상태 관리', '라우팅 구현'],
  ARRAY['react', 'javascript', 'web-development'],
  'Korean'
),
(
  '550e8400-e29b-41d4-a716-446655440204',
  '무료 HTML/CSS 입문',
  'free-html-css',
  'HTML과 CSS의 기초를 무료로 배울 수 있는 강의입니다. 웹 개발의 첫 걸음을 시작해보세요.',
  '완전 무료 HTML/CSS 기초 강의',
  '550e8400-e29b-41d4-a716-446655440103',
  '550e8400-e29b-41d4-a716-446655440004',
  'published',
  'beginner',
  0,
  true,
  480,
  4.3,
  45,
  ARRAY['HTML 구조 이해', 'CSS 스타일링', '반응형 웹 기초'],
  ARRAY['html', 'css', 'web-basics', 'free'],
  'Korean'
)
ON CONFLICT (id) DO NOTHING;

-- 4. 삽입된 데이터 확인
SELECT 
  c.id,
  c.title,
  c.status,
  c.level,
  c.price,
  c.is_free,
  cat.name as category_name,
  up.first_name || ' ' || up.last_name as instructor_name
FROM courses c
LEFT JOIN categories cat ON c.category_id = cat.id
LEFT JOIN user_profiles up ON c.instructor_id = up.id
WHERE c.status = 'published'
ORDER BY c.created_at DESC;