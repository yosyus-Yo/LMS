import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/store';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import apiClient from '../../api/apiClient';
import { supabase } from '../../lib/supabase';

// Course 타입 정의
interface CourseWeek {
  id: string;
  week_number: number;
  title: string;
  description?: string;
  video_url?: string;
  materials?: string; // JSON string으로 저장된 자료 목록
  duration_minutes?: number;
  is_published: boolean;
  order_index: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  introduction?: string; // 소개페이지 내용 (누구나 볼 수 있음)
  content?: string; // 실제 강의 내용 (수강생만 볼 수 있음)
  video_url?: string; // 강의 동영상 URL
  thumbnail_url?: string; // 강의 썸네일 URL
  weeks?: CourseWeek[]; // 주차별 강의 데이터
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
  thumbnail?: string;
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
}

const CourseIntroduction: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<CourseWeek | null>(null);

  // URL에 따라 표시 모드 결정
  const isLearningMode = location.pathname.includes('/learn');

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
        
        // 수강 모드이고 주차가 있으면 0주차를 기본 선택
        if (isLearningMode && courseResponse.data.weeks && courseResponse.data.weeks.length > 0) {
          const week0 = courseResponse.data.weeks.find((week: CourseWeek) => week.week_number === 0);
          const firstWeek = week0 || courseResponse.data.weeks[0];
          setSelectedWeek(firstWeek);
        }
        
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
      // 로그인 페이지로 리디렉션
      navigate('/login');
      return;
    }

    if (!courseId) return;

    try {
      setEnrolling(true);
      
      // 직접 Supabase를 사용하여 enrollments 테이블에 삽입
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
          <div className="text-lg">강의 정보를 불러오는 중...</div>
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg p-8 mb-8">
            <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
            <p className="text-xl mb-4">{course.description}</p>
            
            <div className="flex items-center space-x-6 mb-6">
              <div className="flex items-center">
                <span className="text-sm">강사:</span>
                <span className="ml-2 font-semibold">
                  {course.instructor.first_name} {course.instructor.last_name}
                </span>
              </div>
              {course.level && (
                <div className="flex items-center">
                  <span className="text-sm">난이도:</span>
                  <span className="ml-2 bg-white text-blue-600 px-2 py-1 rounded text-sm">
                    {course.level === 'beginner' ? '초급' : 
                     course.level === 'intermediate' ? '중급' : '고급'}
                  </span>
                </div>
              )}
              {course.status && (
                <div className="flex items-center">
                  <span className="text-sm">상태:</span>
                  <span className="ml-2 bg-white text-blue-600 px-2 py-1 rounded text-sm">
                    {course.status === 'published' ? '공개' : '비공개'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {course.is_free ? '무료' : `₩${parseInt(course.price).toLocaleString()}`}
              </div>
              
              {!isLearningMode && (
                <Button
                  onClick={handleStartLearning}
                  disabled={enrolling}
                  variant="primary"
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 py-3 text-lg"
                >
                  {enrolling ? '처리 중...' : 
                   isEnrolled ? '강의 시작하기' : '수강 신청하기'}
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 사이드바 - 강의 정보 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                <h2 className="text-lg font-semibold mb-4">강의 정보</h2>
                
                <div className="space-y-4">
                  {/* 강의 썸네일 */}
                  {(course.thumbnail_url || course.thumbnail) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        강의 썸네일
                      </label>
                      <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={course.thumbnail_url || course.thumbnail}
                          alt="강의 썸네일"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {course.duration_minutes && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">수강시간:</span>
                        <span className="text-sm font-medium">{Math.floor(course.duration_minutes / 60)}시간 {course.duration_minutes % 60}분</span>
                      </div>
                    )}
                    {course.enrollment_count && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">수강생:</span>
                        <span className="text-sm font-medium">{course.enrollment_count.toLocaleString()}명</span>
                      </div>
                    )}
                    {course.rating && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">평점:</span>
                        <span className="text-sm font-medium">⭐ {course.rating} ({course.rating_count}개 리뷰)</span>
                      </div>
                    )}
                  </div>

                  {/* 주차별 강의 목록 */}
                  {course.weeks && course.weeks.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">강의 목록</h3>
                      <div className="space-y-2">
                        {course.weeks
                          .filter(week => week.is_published || isEnrolled)
                          .sort((a, b) => a.week_number - b.week_number)
                          .map((week) => (
                          <div
                            key={week.id}
                            onClick={() => isEnrolled ? setSelectedWeek(week) : null}
                            className={`p-3 border rounded cursor-pointer transition-colors ${
                              selectedWeek?.id === week.id
                                ? 'border-indigo-500 bg-indigo-50'
                                : isEnrolled 
                                  ? 'border-gray-200 hover:border-gray-300'
                                  : 'border-gray-200 opacity-60 cursor-not-allowed'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-sm font-medium">
                                  {week.week_number === 0 ? '🎯 0주차 (소개)' : `${week.week_number}주차`}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {week.title || '제목 없음'}
                                </div>
                                {week.duration_minutes && week.duration_minutes > 0 && (
                                  <div className="text-xs text-green-600 mt-1">
                                    ⏱️ {week.duration_minutes}분
                                  </div>
                                )}
                              </div>
                              {!isEnrolled && (
                                <div className="text-xs text-gray-400">🔒</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 메인 콘텐츠 영역 */}
            <div className="lg:col-span-3">
              {selectedWeek ? (
                /* 주차별 콘텐츠 표시 */
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">
                      {selectedWeek.week_number === 0 ? '🎯 0주차 (강의 소개)' : `${selectedWeek.week_number}주차`}: {selectedWeek.title}
                    </h2>
                    <button
                      onClick={() => setSelectedWeek(null)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ← 목록으로 돌아가기
                    </button>
                  </div>

                  <div className="space-y-6">
                    {selectedWeek.description && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">주차 설명</h3>
                        <p className="text-gray-600">{selectedWeek.description}</p>
                      </div>
                    )}

                    {/* 동영상 플레이어 */}
                    {selectedWeek.video_url && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">강의 동영상</h3>
                        <div className="bg-black rounded-lg overflow-hidden">
                          <video 
                            controls 
                            className="w-full h-64 md:h-96"
                            src={selectedWeek.video_url}
                          >
                            브라우저에서 비디오를 지원하지 않습니다.
                          </video>
                        </div>
                        
                        {/* 동영상 정보 */}
                        {selectedWeek.duration_minutes && selectedWeek.duration_minutes > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm text-blue-800">
                                재생시간: <strong>{selectedWeek.duration_minutes}분</strong>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 강의 자료 */}
                    {selectedWeek.materials && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">강의 자료</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="space-y-2">
                            {(() => {
                              try {
                                const materials = JSON.parse(selectedWeek.materials);
                                return Object.entries(materials).map(([key, value]) => (
                                  <div key={key} className="flex items-center space-x-2">
                                    <span className="text-sm font-medium">{key}:</span>
                                    <a href={value as string} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                                      {value as string}
                                    </a>
                                  </div>
                                ));
                              } catch {
                                return <p className="text-gray-500">자료 형식 오류</p>;
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* 강의 소개 또는 주차 목록 표시 */
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-2xl font-bold mb-6">
                    {isLearningMode && isEnrolled ? '강의 커리큘럼' : '강의 소개'}
                  </h2>
                  
                  {/* 수강 모드이고 주차가 있으면 커리큘럼 표시 */}
                  {isLearningMode && isEnrolled && course.weeks && course.weeks.length > 0 ? (
                    <div className="space-y-3">
                      {course.weeks
                        .filter(week => week.is_published)
                        .sort((a, b) => a.week_number - b.week_number)
                        .map((week) => (
                        <div
                          key={week.id}
                          onClick={() => setSelectedWeek(week)}
                          className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg text-blue-600">
                                {week.week_number === 0 ? '🎯 ' : ''}{week.week_number}주차: {week.title}
                              </h4>
                              {week.description && (
                                <p className="text-gray-600 mt-1">{week.description}</p>
                              )}
                              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                                {week.video_url && (
                                  <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                    </svg>
                                    동영상
                                  </span>
                                )}
                                {week.duration_minutes && (
                                  <span>⏱️ {week.duration_minutes}분</span>
                                )}
                              </div>
                            </div>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* 강의 소개 표시 */
                    <div className="space-y-6">
                      {course.introduction ? (
                        <div className="prose max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: course.introduction }} />
                        </div>
                      ) : (
                        <p>이 강의에서는 다양한 내용을 다룹니다. 수강 신청 후 자세한 내용을 확인하실 수 있습니다.</p>
                      )}

                      {!user && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-yellow-800">
                            강의 내용을 보시려면 <a href="/login" className="text-blue-600 underline">로그인</a> 후 수강신청해주세요.
                          </p>
                        </div>
                      )}
                      
                      {!isEnrolled && user && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-blue-800">
                            강의 내용을 보시려면 수강신청을 해주세요.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseIntroduction;