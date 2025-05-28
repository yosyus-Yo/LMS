import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppSelector } from '../../app/store';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import VideoPlayer from '../../components/courses/VideoPlayer';
import apiClient from '../../api/apiClient';
import { supabase } from '../../lib/supabase';

// Supabase API 응답 타입 정의
interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description?: string;
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
  prerequisites: string;
  learning_outcomes: string[];
  tags: string[];
  language: string;
  duration_minutes: number;
  rating: string;
  rating_count: number;
  enrollment_count: number;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
  modules: CourseModule[];
}

interface CourseModule {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  chapters: Chapter[];
  total_chapters?: number;
  total_duration?: number;
}

interface Chapter {
  id: string;
  title: string;
  description?: string;
  content_type: 'video' | 'text' | 'pdf' | 'quiz' | 'assignment';
  content?: string;
  file_url?: string;
  video_url?: string;
  duration_minutes: number;
  order_index: number;
  is_published: boolean;
  is_free_preview: boolean;
  created_at: string;
  updated_at: string;
}

const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAppSelector((state) => state.auth);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [progress, setProgress] = useState<{ [chapterId: string]: number }>({});

  useEffect(() => {
    const fetchCourseDetail = async () => {
      try {
        setIsLoading(true);
        
        if (!courseId) {
          throw new Error('Course ID is required');
        }

        // Supabase API로 코스 상세 정보 가져오기
        const courseResponse = await apiClient.courses.getById(courseId);
        setCourse(courseResponse.data);
        
        // 수강 여부 확인
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
  }, [courseId]);

  const handleEnrollment = async () => {
    try {
      console.log('🔄 Starting enrollment process...');
      console.log('  - Course ID:', courseId);
      console.log('  - Redux user state:', user);
      console.log('  - User email from Redux:', user?.email);
      console.log('  - User ID from Redux:', user?.id);
      
      // Supabase 세션도 직접 확인
      const { data: { session } } = await supabase.auth.getSession();
      console.log('  - Supabase session:', session);
      console.log('  - Session user:', session?.user);
      
      if (!courseId) {
        throw new Error('Course ID is required');
      }
      
      // 인증 확인 (Supabase 세션 우선)
      const currentUser = session?.user || user;
      
      if (!currentUser) {
        alert('로그인이 필요합니다.');
        return;
      }
      
      if (!user && session?.user) {
        console.log('⚠️ Redux user is null but Supabase session exists');
        console.log('💡 Using Supabase session for enrollment');
      }
      
      console.log('📝 Calling enrollment API...');
      console.log('📝 Using user ID:', currentUser.id);
      
      // 수강신청 전 추가 검증
      console.log('🔍 Pre-enrollment validation:');
      console.log('  - Course ID type:', typeof courseId, courseId);
      console.log('  - User ID type:', typeof currentUser.id, currentUser.id);
      
      // UUID 형식 검증
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const isValidUUID = uuidRegex.test(currentUser.id);
      console.log('  - User ID is valid UUID:', isValidUUID);
      
      if (!isValidUUID) {
        console.error('❌ Invalid user ID format:', currentUser.id);
        alert('로그인 정보가 올바르지 않습니다. 다시 로그인해주세요.');
        return;
      }
      
      // 이미 수강신청했는지 확인
      console.log('🔍 Checking existing enrollment...');
      const { data: existingEnrollment, error: checkError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('course_id', courseId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking existing enrollment:', checkError);
        throw new Error(`수강신청 확인 중 오류: ${checkError.message}`);
      }
      
      if (existingEnrollment) {
        console.log('ℹ️ User already enrolled');
        alert('이미 수강신청된 강의입니다.');
        setIsEnrolled(true);
        return;
      }
      
      // Supabase에 직접 enrollment 삽입
      console.log('📝 Inserting enrollment record...');
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .insert({
          user_id: currentUser.id,
          course_id: courseId,
          status: 'active',
          progress: 0,
          completed_chapters: [],
          enrollment_date: new Date().toISOString()
        })
        .select()
        .single();
      
      if (enrollmentError) {
        console.error('❌ Direct enrollment error details:');
        console.error('  - Error code:', enrollmentError.code);
        console.error('  - Error message:', enrollmentError.message);
        console.error('  - Error details:', enrollmentError.details);
        console.error('  - Error hint:', enrollmentError.hint);
        console.error('  - Full error:', enrollmentError);
        
        let userMessage = '수강 신청 중 오류가 발생했습니다.';
        
        if (enrollmentError.code === '42501') {
          userMessage = '수강신청 권한이 없습니다. 로그인 상태를 확인해주세요.';
        } else if (enrollmentError.code === '23505') {
          userMessage = '이미 수강신청된 강의입니다.';
        } else if (enrollmentError.code === '23503') {
          userMessage = '강의 정보를 찾을 수 없습니다.';
        } else if (enrollmentError.code === '23514') {
          userMessage = '잘못된 데이터 형식입니다.';
        }
        
        throw new Error(`${userMessage} (에러코드: ${enrollmentError.code})`);
      }
      
      console.log('✅ Direct enrollment successful:', enrollmentData);
      setIsEnrolled(true);
      alert('수강 신청이 완료되었습니다!');
      
    } catch (error) {
      console.error('❌ Enrollment error:', error);
      
      // 상세한 에러 메시지 제공
      let errorMessage = '수강 신청 중 오류가 발생했습니다.';
      
      if (error instanceof Error) {
        if (error.message.includes('not authenticated')) {
          errorMessage = '로그인이 필요합니다.';
        } else if (error.message.includes('42501')) {
          errorMessage = '수강 신청 권한이 없습니다. 관리자에게 문의하세요.';
        } else if (error.message.includes('23505')) {
          errorMessage = '이미 수강 신청된 강의입니다.';
        } else if (error.message.includes('23503')) {
          errorMessage = '강의 정보를 찾을 수 없습니다.';
        }
        
        console.error('Error details:', error.message);
      }
      
      alert(errorMessage);
    }
  };

  const toggleModule = (moduleId: string) => {
    if (expanded.includes(moduleId)) {
      setExpanded(expanded.filter((id) => id !== moduleId));
    } else {
      setExpanded([...expanded, moduleId]);
    }
  };

  // 챕터 시작 함수
  const startChapter = async (chapter: Chapter) => {
    if (!isEnrolled && !chapter.is_free_preview) {
      alert('수강 신청 후 이용할 수 있습니다.');
      return;
    }

    setCurrentChapter(chapter);
    
    // 진도 정보 가져오기
    if (user && isEnrolled) {
      try {
        const { data: progressData } = await supabase
          .from('progress')
          .select('progress_percentage')
          .eq('user_id', user.id)
          .eq('chapter_id', chapter.id)
          .single();

        if (progressData) {
          setProgress(prev => ({
            ...prev,
            [chapter.id]: progressData.progress_percentage
          }));
        }
      } catch (error) {
        console.log('진도 정보를 가져올 수 없습니다:', error);
      }
    }
  };

  // 학습 진도 업데이트 함수
  const updateProgress = async (chapterId: string, progressPercentage: number) => {
    if (!user || !isEnrolled) return;

    try {
      const { error } = await supabase
        .from('progress')
        .upsert({
          user_id: user.id,
          chapter_id: chapterId,
          progress_percentage: progressPercentage,
          last_accessed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,chapter_id'
        });

      if (error) throw error;

      setProgress(prev => ({
        ...prev,
        [chapterId]: progressPercentage
      }));
    } catch (error) {
      console.error('진도 업데이트 실패:', error);
    }
  };

  // 챕터 완료 처리
  const completeChapter = async (chapterId: string) => {
    if (!user || !isEnrolled) return;

    try {
      const { error } = await supabase
        .from('progress')
        .upsert({
          user_id: user.id,
          chapter_id: chapterId,
          progress_percentage: 100,
          completed_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,chapter_id'
        });

      if (error) throw error;

      setProgress(prev => ({
        ...prev,
        [chapterId]: 100
      }));

      alert('챕터를 완료했습니다! 🎉');
    } catch (error) {
      console.error('챕터 완료 처리 실패:', error);
    }
  };

  // 시간 포맷팅 함수
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}시간 ${mins > 0 ? mins + '분' : ''}`;
    }
    return `${mins}분`;
  };

  // 가격 포맷팅 함수
  const formatPrice = (price: string, isFree: boolean) => {
    if (isFree) return '무료';
    return `₩${parseFloat(price).toLocaleString()}`;
  };

  // 컨텐츠 타입 아이콘
  const ContentTypeIcon: React.FC<{ type: string }> = ({ type }) => {
    switch (type) {
      case 'video':
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        );
      case 'quiz':
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        );
      case 'text':
      case 'pdf':
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
        );
      case 'assignment':
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  // 별점 표시
  const renderStars = (rating: string | number) => {
    const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${
              numRating >= star
                ? 'text-yellow-400'
                : numRating >= star - 0.5
                ? 'text-yellow-300'
                : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  if (isLoading || !course) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </Layout>
    );
  }

  const instructorName = `${course.instructor.first_name} ${course.instructor.last_name}`.trim() || course.instructor.email;

  return (
    <Layout>
      <div>
        {/* 상단 헤더 */}
        <div className="bg-gray-100 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 강의 이미지 */}
            <div className="lg:col-span-1">
              <img
                src={course.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop"}
                alt={course.title}
                className="w-full rounded-lg shadow-md object-cover h-64"
              />
            </div>
            
            {/* 강의 정보 */}
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
              <p className="text-gray-700 mb-4">{course.short_description || course.description}</p>
              
              <div className="flex items-center mb-4">
                {renderStars(course.rating)}
                <span className="ml-2 text-gray-600">
                  {parseFloat(course.rating).toFixed(1)} ({course.rating_count} 리뷰)
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex items-center mr-4">
                  <svg className="w-5 h-5 text-gray-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-gray-600">{formatDuration(course.duration_minutes)}</span>
                </div>
                
                <div className="flex items-center mr-4">
                  <svg className="w-5 h-5 text-gray-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                  <span className="text-gray-600">{course.enrollment_count} 명 수강 중</span>
                </div>
                
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <span className="text-gray-600">
                    최근 업데이트: {new Date(course.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {course.category?.name || '기타'}
                </span>
                {course.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center mb-6">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop"
                  alt={instructorName}
                  className="w-10 h-10 rounded-full mr-2"
                />
                <div>
                  <p className="font-medium">강사: {instructorName}</p>
                  <p className="text-sm text-gray-600">{course.language}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-indigo-600">
                  {formatPrice(course.price, course.is_free)}
                </div>
                <div>
                  {isEnrolled ? (
                    <Link to={`/courses/${course.slug}/learn`}>
                      <Button variant="primary">강의 보기</Button>
                    </Link>
                  ) : (
                    <Button variant="primary" onClick={handleEnrollment}>
                      수강 신청하기
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 동영상 플레이어 (수강 중일 때만 표시) */}
        {currentChapter && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{currentChapter.title}</h2>
                <Button
                  variant="secondary"
                  onClick={() => setCurrentChapter(null)}
                >
                  닫기
                </Button>
              </div>
              
              {currentChapter.content_type === 'video' && currentChapter.video_url && (
                <VideoPlayer
                  src={currentChapter.video_url}
                  title={currentChapter.title}
                  onProgress={(progressPercentage) => 
                    updateProgress(currentChapter.id, progressPercentage)
                  }
                  onComplete={() => completeChapter(currentChapter.id)}
                  initialProgress={progress[currentChapter.id] || 0}
                />
              )}
              
              {currentChapter.content_type === 'text' && (
                <div className="prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: currentChapter.content || '' }} />
                </div>
              )}
              
              {currentChapter.description && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">챕터 설명</h3>
                  <p className="text-gray-700">{currentChapter.description}</p>
                </div>
              )}
              
              {/* 진도 표시 */}
              {isEnrolled && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">학습 진도</span>
                    <span className="text-sm text-gray-600">
                      {Math.round(progress[currentChapter.id] || 0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress[currentChapter.id] || 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 강의 상세 내용 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 강의 설명 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">강의 소개</h2>
              <div className="text-gray-700 space-y-4 whitespace-pre-line">
                {course.description}
              </div>
            </div>
            
            {course.learning_outcomes.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-bold mb-4">학습 목표</h2>
                <ul className="list-disc pl-5 text-gray-700 space-y-2">
                  {course.learning_outcomes.map((outcome, index) => (
                    <li key={index}>{outcome}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {course.prerequisites && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">사전 요구사항</h2>
                <div className="text-gray-700 whitespace-pre-line">
                  {course.prerequisites}
                </div>
              </div>
            )}
          </div>
          
          {/* 오른쪽: 강의 커리큘럼 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 mb-8 sticky top-4">
              <h2 className="text-xl font-bold mb-4">커리큘럼</h2>
              <p className="text-gray-600 mb-4">
                총 {formatDuration(course.duration_minutes)} · {course.modules.length}개 모듈 · 
                {course.modules.reduce((acc, module) => acc + (module.chapters?.length || 0), 0)}개 챕터
              </p>
              
              <div className="space-y-4">
                {course.modules.map((module) => (
                  <div key={module.id} className="border border-gray-200 rounded">
                    <div
                      className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleModule(module.id)}
                    >
                      <div>
                        <h3 className="font-medium">{module.title}</h3>
                        <p className="text-sm text-gray-600">
                          {module.chapters?.length || 0}개 챕터
                        </p>
                      </div>
                      <svg
                        className={`w-5 h-5 transform ${
                          expanded.includes(module.id) ? 'rotate-180' : ''
                        } transition-transform`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                    
                    {expanded.includes(module.id) && module.chapters && (
                      <div className="border-t border-gray-200">
                        {module.chapters.map((chapter) => (
                          <div
                            key={chapter.id}
                            className="flex justify-between items-center p-3 hover:bg-gray-50"
                          >
                            <div className="flex items-center flex-1">
                              <ContentTypeIcon type={chapter.content_type} />
                              <div className="ml-2 flex-1">
                                <div className="flex items-center">
                                  <span>{chapter.title}</span>
                                  {chapter.is_free_preview && (
                                    <span className="ml-2 text-xs text-green-600 font-medium">미리보기</span>
                                  )}
                                  {isEnrolled && progress[chapter.id] === 100 && (
                                    <span className="ml-2 text-xs text-blue-600 font-medium">✓ 완료</span>
                                  )}
                                </div>
                                {/* 진도 바 */}
                                {isEnrolled && progress[chapter.id] > 0 && progress[chapter.id] < 100 && (
                                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                    <div
                                      className="bg-indigo-600 h-1 rounded-full"
                                      style={{ width: `${progress[chapter.id]}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">
                                {formatDuration(chapter.duration_minutes)}
                              </span>
                              {(isEnrolled || chapter.is_free_preview) && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => startChapter(chapter)}
                                >
                                  {chapter.content_type === 'video' ? '시청' : '보기'}
                                </Button>
                              )}
                            </div>
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