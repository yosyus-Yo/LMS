import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import courseImages from '../../data/courseImages';

// 임시 데이터 타입 (실제 API 구현 시 대체)
interface Course {
  id: number;
  title: string;
  instructor: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  rating: number;
  ratingCount: number;
  imageUrl: string;
  imageAlt?: string; // Optional alt text for image
  categories: string[];
}

const CourseList: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');

  useEffect(() => {
    // 실제 구현 시 API 호출로 대체
    const fetchCourses = async () => {
      try {
        // 임시 데이터 (API 구현 시 대체)
        setTimeout(() => {
          const mockCourses: Course[] = [
            {
              id: 1,
              title: '파이썬 기초 프로그래밍',
              instructor: '이강의',
              description:
                '프로그래밍을 처음 시작하는 분들을 위한 파이썬 기초 강의입니다.',
              level: 'beginner',
              duration: '10시간',
              rating: 4.5,
              ratingCount: 120,
              imageUrl: courseImages.python.placeholder,
              imageAlt: courseImages.python.alt,
              categories: ['프로그래밍', '파이썬'],
            },
            {
              id: 2,
              title: '데이터 분석 입문',
              instructor: '김데이터',
              description:
                '데이터 분석의 기본 개념과 파이썬을 활용한 데이터 분석 방법을 배웁니다.',
              level: 'intermediate',
              duration: '15시간',
              rating: 4.2,
              ratingCount: 85,
              imageUrl: courseImages.dataAnalysis.placeholder,
              imageAlt: courseImages.dataAnalysis.alt,
              categories: ['데이터 과학', '파이썬'],
            },
            {
              id: 3,
              title: '웹 개발 기초',
              instructor: '박웹',
              description:
                'HTML, CSS, JavaScript를 활용한 웹 개발의 기초를 배웁니다.',
              level: 'beginner',
              duration: '12시간',
              rating: 4.7,
              ratingCount: 150,
              imageUrl: courseImages.webDev.placeholder,
              imageAlt: courseImages.webDev.alt,
              categories: ['웹 개발', 'JavaScript'],
            },
            {
              id: 4,
              title: '머신러닝 기초',
              instructor: '최인공',
              description:
                '머신러닝의 기본 개념과 주요 알고리즘에 대해 배웁니다.',
              level: 'intermediate',
              duration: '20시간',
              rating: 4.8,
              ratingCount: 92,
              imageUrl: courseImages.machineLearning.placeholder,
              imageAlt: courseImages.machineLearning.alt,
              categories: ['데이터 과학', '인공지능'],
            },
            {
              id: 5,
              title: '고급 데이터 구조',
              instructor: '정구조',
              description:
                '자료구조의 개념과 활용 방법에 대해 심도 있게 학습합니다.',
              level: 'advanced',
              duration: '18시간',
              rating: 4.3,
              ratingCount: 65,
              imageUrl: courseImages.dataStructure.placeholder,
              imageAlt: courseImages.dataStructure.alt,
              categories: ['프로그래밍', '알고리즘'],
            },
            {
              id: 6,
              title: 'React.js 완전 정복',
              instructor: '한리액트',
              description:
                'React.js의 기초부터 고급 개념까지 실무에서 활용 가능한 스킬을 배웁니다.',
              level: 'intermediate',
              duration: '25시간',
              rating: 4.9,
              ratingCount: 110,
              imageUrl: courseImages.react.placeholder,
              imageAlt: courseImages.react.alt,
              categories: ['웹 개발', 'JavaScript', 'React'],
            },
          ];

          setCourses(mockCourses);
          setFilteredCourses(mockCourses);
          setIsLoading(false);
        }, 800); // 로딩 시뮬레이션
      } catch (error) {
        console.error('Error fetching courses', error);
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // 필터 및 검색 적용
  useEffect(() => {
    let result = courses;

    // 검색어 적용
    if (searchTerm) {
      result = result.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 카테고리 필터 적용
    if (selectedCategory) {
      result = result.filter((course) =>
        course.categories.includes(selectedCategory)
      );
    }

    // 레벨 필터 적용
    if (selectedLevel) {
      result = result.filter((course) => course.level === selectedLevel);
    }

    setFilteredCourses(result);
  }, [searchTerm, selectedCategory, selectedLevel, courses]);

  // 고유 카테고리 목록 추출
  const categories = Array.from(
    new Set(courses.flatMap((course) => course.categories))
  );

  // 별점 표시 컴포넌트
  const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              rating >= star
                ? 'text-yellow-400'
                : rating >= star - 0.5
                ? 'text-yellow-300'
                : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-gray-600 text-sm">
          {rating.toFixed(1)} ({courses.find((c) => c.rating === rating)?.ratingCount})
        </span>
      </div>
    );
  };

  // 레벨 배지 컴포넌트
  const LevelBadge: React.FC<{ level: string }> = ({ level }) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-blue-100 text-blue-800',
      advanced: 'bg-purple-100 text-purple-800',
    };
    
    const labels = {
      beginner: '초급',
      intermediate: '중급',
      advanced: '고급',
    };
    
    return (
      <span 
        className={`inline-block ${
          colors[level as keyof typeof colors]
        } text-xs px-2 py-1 rounded`}
      >
        {labels[level as keyof typeof labels]}
      </span>
    );
  };

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold mb-6">모든 강의</h1>

        {/* 검색 및 필터 */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 검색창 */}
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="강의 검색..."
                className="w-full p-2 border border-gray-300 rounded"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* 카테고리 필터 */}
            <div>
              <select
                className="w-full p-2 border border-gray-300 rounded"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">모든 카테고리</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 레벨 필터 */}
            <div>
              <select
                className="w-full p-2 border border-gray-300 rounded"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
              >
                <option value="">모든 레벨</option>
                <option value="beginner">초급</option>
                <option value="intermediate">중급</option>
                <option value="advanced">고급</option>
              </select>
            </div>
          </div>
        </div>

        {/* 강의 목록 */}
        {filteredCourses.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">검색 결과가 없습니다.</p>
            <Button
              variant="primary"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedLevel('');
              }}
            >
              필터 초기화
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.01]"
              >
                <Link to={`/courses/${course.id}`}>
                  <img
                    src={course.imageUrl}
                    alt={course.imageAlt || course.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1">{course.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">
                      강사: {course.instructor}
                    </p>
                    <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                      {course.description}
                    </p>
                    
                    <div className="flex justify-between items-center mb-3">
                      <StarRating rating={course.rating} />
                      <span className="text-gray-600 text-sm">{course.duration}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <LevelBadge level={course.level} />
                      {course.categories.map((category) => (
                        <span
                          key={category}
                          className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CourseList;