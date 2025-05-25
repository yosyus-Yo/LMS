import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import courseImages from '../../data/courseImages';

// 임시 데이터 타입 (실제 API 구현 시 대체)
interface Course {
  id: number;
  title: string;
  instructor: string;
  description: string;
  longDescription: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  rating: number;
  ratingCount: number;
  imageUrl: string;
  imageAlt?: string; // Optional alt text for image
  categories: string[];
  enrolledCount: number;
  updatedAt: string;
  modules: CourseModule[];
}

interface CourseModule {
  id: number;
  title: string;
  duration: string;
  chapters: Chapter[];
}

interface Chapter {
  id: number;
  title: string;
  duration: string;
  type: 'video' | 'quiz' | 'reading';
  isFree: boolean;
}

const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<number[]>([]);

  useEffect(() => {
    // 실제 구현 시 API 호출로 대체
    const fetchCourseDetail = async () => {
      try {
        // 임시 데이터 (API 구현 시 대체)
        setTimeout(() => {
          // 파이썬 강의 상세 정보 (임시 데이터)
          const mockCourse: Course = {
            id: Number(courseId),
            title: '파이썬 기초 프로그래밍',
            instructor: '이강의',
            description: '프로그래밍을 처음 시작하는 분들을 위한 파이썬 기초 강의입니다.',
            longDescription: `
              이 강의는 프로그래밍을 처음 접하는 분들도 쉽게 따라올 수 있도록 구성되었습니다.
              파이썬의 기본 문법부터 시작하여 자료구조, 함수, 모듈, 파일 처리까지 차근차근 배워봅니다.
              
              실습 위주의 커리큘럼으로 직접 코드를 작성하며 학습하게 됩니다.
              강의를 모두 수강하면 파이썬을 활용해 간단한 프로그램을 만들 수 있는 역량을 갖추게 됩니다.
              
              프로그래밍 경험이 없으신 분들도 환영합니다!
            `,
            level: 'beginner',
            duration: '10시간',
            rating: 4.5,
            ratingCount: 120,
            imageUrl: courseImages.python.placeholder,
            imageAlt: courseImages.python.alt,
            categories: ['프로그래밍', '파이썬'],
            enrolledCount: 1250,
            updatedAt: '2025-04-15',
            modules: [
              {
                id: 1,
                title: '파이썬 시작하기',
                duration: '1시간 30분',
                chapters: [
                  {
                    id: 1,
                    title: '강의 소개 및 개발 환경 설정',
                    duration: '15분',
                    type: 'video',
                    isFree: true,
                  },
                  {
                    id: 2,
                    title: '파이썬이란?',
                    duration: '20분',
                    type: 'video',
                    isFree: true,
                  },
                  {
                    id: 3,
                    title: '첫 번째 파이썬 프로그램',
                    duration: '25분',
                    type: 'video',
                    isFree: false,
                  },
                  {
                    id: 4,
                    title: '개발 환경 설정 퀴즈',
                    duration: '10분',
                    type: 'quiz',
                    isFree: false,
                  },
                ],
              },
              {
                id: 2,
                title: '기본 문법',
                duration: '2시간 45분',
                chapters: [
                  {
                    id: 5,
                    title: '변수와 데이터 타입',
                    duration: '30분',
                    type: 'video',
                    isFree: false,
                  },
                  {
                    id: 6,
                    title: '연산자',
                    duration: '25분',
                    type: 'video',
                    isFree: false,
                  },
                  {
                    id: 7,
                    title: '조건문 (if, else)',
                    duration: '35분',
                    type: 'video',
                    isFree: false,
                  },
                  {
                    id: 8,
                    title: '반복문 (for, while)',
                    duration: '40분',
                    type: 'video',
                    isFree: false,
                  },
                  {
                    id: 9,
                    title: '기본 문법 퀴즈',
                    duration: '15분',
                    type: 'quiz',
                    isFree: false,
                  },
                  {
                    id: 10,
                    title: '기본 문법 실습',
                    duration: '20분',
                    type: 'reading',
                    isFree: false,
                  },
                ],
              },
              {
                id: 3,
                title: '자료구조',
                duration: '3시간',
                chapters: [
                  {
                    id: 11,
                    title: '리스트 (List)',
                    duration: '40분',
                    type: 'video',
                    isFree: false,
                  },
                  {
                    id: 12,
                    title: '튜플 (Tuple)',
                    duration: '25분',
                    type: 'video',
                    isFree: false,
                  },
                  {
                    id: 13,
                    title: '딕셔너리 (Dictionary)',
                    duration: '35분',
                    type: 'video',
                    isFree: false,
                  },
                  {
                    id: 14,
                    title: '집합 (Set)',
                    duration: '30분',
                    type: 'video',
                    isFree: false,
                  },
                  {
                    id: 15,
                    title: '자료구조 퀴즈',
                    duration: '15분',
                    type: 'quiz',
                    isFree: false,
                  },
                  {
                    id: 16,
                    title: '자료구조 실습',
                    duration: '35분',
                    type: 'reading',
                    isFree: false,
                  },
                ],
              },
            ],
          };

          setCourse(mockCourse);
          setIsLoading(false);
        }, 800); // 로딩 시뮬레이션
      } catch (error) {
        console.error('Error fetching course details', error);
        setIsLoading(false);
      }
    };

    if (courseId) {
      fetchCourseDetail();
    }
  }, [courseId]);

  const toggleModule = (moduleId: number) => {
    if (expanded.includes(moduleId)) {
      setExpanded(expanded.filter((id) => id !== moduleId));
    } else {
      setExpanded([...expanded, moduleId]);
    }
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

  // 컨텐츠 타입 아이콘
  const ContentTypeIcon: React.FC<{ type: string }> = ({ type }) => {
    switch (type) {
      case 'video':
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        );
      case 'quiz':
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        );
      case 'reading':
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  // 로딩 상태 표시
  if (isLoading || !course) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </Layout>
    );
  }

  // 별점 표시
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${
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
      </div>
    );
  };

  return (
    <Layout>
      <div>
        {/* 상단 헤더 */}
        <div className="bg-gray-100 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 강의 이미지 */}
            <div className="lg:col-span-1">
              <img
                src={course.imageUrl}
                alt={course.imageAlt || course.title}
                className="w-full rounded-lg shadow-md object-cover h-64"
              />
            </div>
            
            {/* 강의 정보 */}
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
              <p className="text-gray-700 mb-4">{course.description}</p>
              
              <div className="flex items-center mb-4">
                {renderStars(course.rating)}
                <span className="ml-2 text-gray-600">
                  {course.rating.toFixed(1)} ({course.ratingCount} 리뷰)
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex items-center mr-4">
                  <svg className="w-5 h-5 text-gray-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-gray-600">{course.duration}</span>
                </div>
                
                <div className="flex items-center mr-4">
                  <svg className="w-5 h-5 text-gray-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                  <span className="text-gray-600">{course.enrolledCount} 명 수강 중</span>
                </div>
                
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <span className="text-gray-600">최근 업데이트: {course.updatedAt}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-6">
                <LevelBadge level={course.level} />
                {course.categories.map((category) => (
                  <span
                    key={category}
                    className="inline-block bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded"
                  >
                    {category}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop"
                  alt={course.instructor}
                  className="w-10 h-10 rounded-full mr-2"
                />
                <div>
                  <p className="font-medium">강사: {course.instructor}</p>
                  <p className="text-sm text-gray-600">파이썬 전문 강사</p>
                </div>
              </div>
              
              <div className="mt-6">
                <Button variant="primary" fullWidth>
                  수강 신청하기
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* 강의 상세 내용 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 강의 설명 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">강의 소개</h2>
              <div className="text-gray-700 space-y-4 whitespace-pre-line">
                {course.longDescription}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">이런 분들께 추천합니다</h2>
              <ul className="list-disc pl-5 text-gray-700 space-y-2">
                <li>프로그래밍을 처음 시작하는 분</li>
                <li>파이썬 기초를 탄탄하게 쌓고 싶은 분</li>
                <li>실습 위주로 학습하고 싶은 분</li>
                <li>데이터 분석, 웹 개발 등 다양한 분야로 나아가기 위한 기반을 다지고 싶은 분</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">학습 목표</h2>
              <ul className="list-disc pl-5 text-gray-700 space-y-2">
                <li>파이썬 기본 문법 이해 및 활용</li>
                <li>자료구조(리스트, 튜플, 딕셔너리, 집합) 활용 능력</li>
                <li>함수 작성 및 모듈 활용 능력</li>
                <li>파일 입출력 처리 방법</li>
                <li>간단한 파이썬 프로그램 작성 능력</li>
              </ul>
            </div>
          </div>
          
          {/* 오른쪽: 강의 커리큘럼 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 mb-8 sticky top-4">
              <h2 className="text-xl font-bold mb-4">커리큘럼</h2>
              <p className="text-gray-600 mb-4">총 {course.duration} · {course.modules.length}개 모듈 · {course.modules.reduce((acc, module) => acc + module.chapters.length, 0)}개 챕터</p>
              
              <div className="space-y-4">
                {course.modules.map((module) => (
                  <div key={module.id} className="border border-gray-200 rounded">
                    <div
                      className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleModule(module.id)}
                    >
                      <div>
                        <h3 className="font-medium">{module.title}</h3>
                        <p className="text-sm text-gray-600">{module.duration} · {module.chapters.length}개 챕터</p>
                      </div>
                      <svg
                        className={`w-5 h-5 transform ${
                          expanded.includes(module.id) ? 'rotate-180' : ''
                        } transition-transform`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                    
                    {expanded.includes(module.id) && (
                      <div className="border-t border-gray-200">
                        {module.chapters.map((chapter) => (
                          <div
                            key={chapter.id}
                            className="flex justify-between items-center p-3 hover:bg-gray-50"
                          >
                            <div className="flex items-center">
                              <ContentTypeIcon type={chapter.type} />
                              <span className="ml-2">{chapter.title}</span>
                              {chapter.isFree && (
                                <span className="ml-2 text-xs text-green-600 font-medium">미리보기</span>
                              )}
                            </div>
                            <span className="text-sm text-gray-600">{chapter.duration}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseDetail;