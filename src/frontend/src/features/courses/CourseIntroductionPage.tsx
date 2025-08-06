import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../app/store';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import apiClient from '../../api/apiClient';
import { supabase } from '../../lib/supabase';

interface CourseWeek {
  id: string;
  week_number: number;
  title: string;
  description?: string;
  video_url?: string;
  materials?: string;
  duration_minutes?: number;
  is_published: boolean;
  order_index: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  introduction?: string;
  thumbnail_url?: string;
  instructor: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
    bio?: string;
  };
  category?: {
    id: string;
    name: string;
  };
  status: string;
  price: string;
  is_free: boolean;
  level?: string;
  prerequisites?: string;
  learning_outcomes?: string[];
  tags?: string[];
  language?: string;
  duration_minutes?: number;
  rating?: string;
  rating_count?: number;
  enrollment_count?: number;
  created_at: string;
  updated_at: string;
  weeks?: CourseWeek[];
}

const CourseIntroductionPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const fetchCourseDetail = async () => {
      try {
        setIsLoading(true);
        
        if (!courseId) {
          throw new Error('Course ID is required');
        }

        // 강의 기본 정보 가져오기
        const courseResponse = await apiClient.courses.getById(courseId);
        setCourse(courseResponse.data);
        
        // 로그인된 사용자인 경우 수강 여부 확인
        if (user) {
          try {
            const enrollmentsResponse = await apiClient.enrollments.getUserEnrollments();
            const isEnrolledInCourse = enrollmentsResponse.data.some(
              (enrollment: any) => enrollment.course_id === courseId
            );
            setIsEnrolled(isEnrolledInCourse);
          } catch (enrollmentError) {
            console.log('Error checking enrollment:', enrollmentError);
            setIsEnrolled(false);
          }
        }
        
      } catch (error) {
        console.error('Error fetching course details', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      fetchCourseDetail();
    }
  }, [courseId, user]);

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!courseId || !course) return;

    // 유료 강의인 경우 결제 페이지로 이동
    if (!course.is_free) {
      navigate(`/payment/${courseId}`);
      return;
    }

    // 무료 강의인 경우 바로 수강신청 처리
    try {
      setEnrolling(true);
      
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          status: 'active',
          progress: 0,
          completed_chapters: [],
          enrollment_date: new Date().toISOString()
        })
        .select()
        .single();
      
      if (enrollmentError) {
        let userMessage = '수강 신청 중 오류가 발생했습니다.';
        
        if (enrollmentError.code === '23505') {
          userMessage = '이미 수강신청된 강의입니다.';
        } else if (enrollmentError.code === '23503') {
          userMessage = '강의 정보를 찾을 수 없습니다.';
        }
        
        throw new Error(userMessage);
      }
      
      setIsEnrolled(true);
      alert('수강 신청이 완료되었습니다!');
      
    } catch (error) {
      console.error('Enrollment error:', error);
      let errorMessage = '수강 신청 중 오류가 발생했습니다.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setEnrolling(false);
    }
  };

  const handleStartLearning = () => {
    if (isEnrolled) {
      navigate(`/courses/${courseId}/learn`);
    } else {
      handleEnroll();
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">강의를 찾을 수 없습니다.</div>
        </div>
      </Layout>
    );
  }

  const instructorName = `${course.instructor.first_name || ''} ${course.instructor.last_name || ''}`.trim() || course.instructor.email;
  const formatPrice = (price: string, isFree: boolean) => {
    if (isFree) return '무료';
    return `₩${parseFloat(price).toLocaleString()}`;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* 히어로 섹션 */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2">
                <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
                <p className="text-xl mb-6 opacity-90">{course.description}</p>
                
                <div className="flex flex-wrap items-center gap-6 mb-8">
                  <div className="flex items-center">
                    <span className="text-sm opacity-80">강사:</span>
                    <span className="ml-2 font-semibold">{instructorName}</span>
                  </div>
                  {course.level && (
                    <div className="flex items-center">
                      <span className="text-sm opacity-80">난이도:</span>
                      <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded text-sm">
                        {course.level === 'beginner' ? '초급' : 
                         course.level === 'intermediate' ? '중급' : '고급'}
                      </span>
                    </div>
                  )}
                  {course.duration_minutes && (
                    <div className="flex items-center">
                      <span className="text-sm opacity-80">총 시간:</span>
                      <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded text-sm">
                        {Math.floor(course.duration_minutes / 60)}시간 {course.duration_minutes % 60}분
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">
                    {formatPrice(course.price, course.is_free)}
                  </div>
                  <div className="flex gap-4">
                    {isEnrolled ? (
                      <Button
                        onClick={handleStartLearning}
                        variant="primary"
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg"
                      >
                        강의 시작하기
                      </Button>
                    ) : (
                      <Button
                        onClick={handleEnroll}
                        disabled={enrolling}
                        variant="primary"
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-lg"
                      >
                        {enrolling ? '처리 중...' : '수강 신청하기'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* 강의 썸네일 */}
              <div className="lg:col-span-1">
                <div className="aspect-video bg-black bg-opacity-20 rounded-lg overflow-hidden">
                  <img
                    src={course.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop"}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 메인 콘텐츠 영역 */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                <h2 className="text-2xl font-bold mb-6">강의 소개</h2>
                
                {course.introduction ? (
                  <div className="prose max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: course.introduction }} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-700 leading-relaxed">
                      {course.description}
                    </p>
                  </div>
                )}
              </div>

              {/* 학습 목표 */}
              {course.learning_outcomes && course.learning_outcomes.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                  <h2 className="text-2xl font-bold mb-6">학습 목표</h2>
                  <ul className="space-y-3">
                    {course.learning_outcomes.map((outcome, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 수강 전 요구사항 */}
              {course.prerequisites && (
                <div className="bg-white rounded-lg shadow-sm p-8">
                  <h2 className="text-2xl font-bold mb-6">수강 전 요구사항</h2>
                  <p className="text-gray-700">{course.prerequisites}</p>
                </div>
              )}
            </div>

            {/* 사이드바 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                <h3 className="text-lg font-semibold mb-4">강의 정보</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">수강료</span>
                    <span className="font-semibold">{formatPrice(course.price, course.is_free)}</span>
                  </div>
                  
                  {course.duration_minutes && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">총 수강시간</span>
                      <span className="font-semibold">
                        {Math.floor(course.duration_minutes / 60)}시간 {course.duration_minutes % 60}분
                      </span>
                    </div>
                  )}
                  
                  {course.enrollment_count && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">수강생 수</span>
                      <span className="font-semibold">{course.enrollment_count.toLocaleString()}명</span>
                    </div>
                  )}
                  
                  {course.rating && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">평점</span>
                      <span className="font-semibold">⭐ {course.rating} ({course.rating_count}개 리뷰)</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">강사</span>
                    <span className="font-semibold">{instructorName}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">난이도</span>
                    <span className="font-semibold">
                      {course.level === 'beginner' ? '초급' : 
                       course.level === 'intermediate' ? '중급' : 
                       course.level === 'advanced' ? '고급' : '미정'}
                    </span>
                  </div>
                </div>

                {/* 수강신청 버튼 */}
                <div className="mt-6 pt-6 border-t">
                  {!user ? (
                    <div className="space-y-3">
                      <Button
                        onClick={() => navigate('/login')}
                        variant="primary"
                        className="w-full"
                      >
                        로그인하고 수강신청
                      </Button>
                      <p className="text-xs text-gray-500 text-center">
                        로그인 후 수강신청이 가능합니다
                      </p>
                    </div>
                  ) : isEnrolled ? (
                    <div className="space-y-3">
                      <Button
                        onClick={handleStartLearning}
                        variant="primary"
                        className="w-full"
                      >
                        강의 시작하기
                      </Button>
                      <p className="text-xs text-green-600 text-center">
                        ✓ 수강신청 완료
                      </p>
                    </div>
                  ) : (
                    <Button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      variant="primary"
                      className="w-full"
                    >
                      {enrolling ? '처리 중...' : '수강 신청하기'}
                    </Button>
                  )}
                </div>

                {/* 태그 */}
                {course.tags && course.tags.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">태그</h4>
                    <div className="flex flex-wrap gap-2">
                      {course.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseIntroductionPage;