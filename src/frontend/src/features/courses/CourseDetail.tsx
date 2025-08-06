import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppSelector } from '../../app/store';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import VideoPlayer from '../../components/courses/VideoPlayer';
import apiClient from '../../api/apiClient';
import { supabase } from '../../lib/supabase';

// Course 및 Week 타입 정의 (CourseCreator와 동일)
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
  description?: string;
  thumbnail_url?: string;
  status: string;
  price: string;
  is_free: boolean;
  instructor: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
  weeks?: CourseWeek[];
}

const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAppSelector((state) => state.auth);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<CourseWeek | null>(null);
  const [progress, setProgress] = useState(0);
  const [completedChapters, setCompletedChapters] = useState<string[]>([]);

  useEffect(() => {
    const loadCourse = async () => {
      try {
        if (!courseId) return;
        
        setIsLoading(true);
        
        // 강의 기본 정보 가져오기
        const courseResponse = await apiClient.courses.getById(courseId);
        const courseData = courseResponse.data;
        
        // localStorage에서 주차 데이터 가져오기
        const weeksResponse = await apiClient.modules.getWeeks(courseId);
        const weeks = weeksResponse.data || [];
        
        setCourse({
          ...courseData,
          weeks: weeks
        });
        
        // 0주차가 있으면 기본 선택
        const week0 = weeks.find((week: CourseWeek) => week.week_number === 0);
        if (week0) {
          setSelectedWeek(week0);
        }
        
        // 수강 여부 확인
        if (user) {
          try {
            const enrollmentsResponse = await apiClient.enrollments.getUserEnrollments();
            const isEnrolledInCourse = enrollmentsResponse.data.some(
              (enrollment: any) => enrollment.course_id === courseId
            );
            setIsEnrolled(isEnrolledInCourse);

            // 진도율 정보 로드
            if (isEnrolledInCourse) {
              const progressResponse = await apiClient.enrollments.getProgress(courseId);
              setProgress(progressResponse.data.progress);
              setCompletedChapters(progressResponse.data.completed_chapters);
            }
          } catch (enrollmentError) {
            console.log('Error checking enrollment:', enrollmentError);
            setIsEnrolled(false);
          }
        }
        
      } catch (error) {
        console.error('강의 데이터 로딩 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCourse();
  }, [courseId, user]);

  const handleEnrollment = async () => {
    try {
      if (!courseId || !user) {
        alert('로그인이 필요합니다.');
        return;
      }
      
      // 수강신청 API 호출
      const { data, error } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          status: 'active'
        });
      
      if (error) {
        if (error.code === '23505') {
          alert('이미 수강신청된 강의입니다.');
        } else {
          alert('수강신청 중 오류가 발생했습니다.');
        }
        return;
      }
      
      setIsEnrolled(true);
      alert('수강신청이 완료되었습니다!');
    } catch (error) {
      console.error('수강신청 오류:', error);
      alert('수강신청 중 오류가 발생했습니다.');
    }
  };

  // 포맷팅 함수들
  const formatDuration = (minutes?: number) => {
    if (!minutes) return '0분';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}시간 ${mins > 0 ? mins + '분' : ''}`;
    }
    return `${mins}분`;
  };

  const formatPrice = (price: string, isFree: boolean) => {
    if (isFree) return '무료';
    return `₩${parseFloat(price).toLocaleString()}`;
  };

  // 주차 완료 처리
  const handleChapterComplete = async (weekId: string) => {
    try {
      if (!courseId || !user) return;

      const newCompletedChapters = [...completedChapters];
      if (!newCompletedChapters.includes(weekId)) {
        newCompletedChapters.push(weekId);
      }

      // 전체 주차 수 대비 완료된 주차 수로 진도율 계산
      const totalWeeks = course?.weeks?.length || 0;
      const newProgress = totalWeeks > 0 ? Math.round((newCompletedChapters.length / totalWeeks) * 100) : 0;

      // 서버에 진도율 업데이트 (새로운 certificates API 사용)
      const weekNumber = parseInt(weekId.replace('week-', ''));
      await apiClient.certificates.updateProgress(courseId, weekNumber, weekId, 0);

      // 기존 enrollments API도 호환성을 위해 유지
      await apiClient.enrollments.updateProgress(courseId, newCompletedChapters, newProgress);

      // 로컬 상태 업데이트
      setCompletedChapters(newCompletedChapters);
      setProgress(newProgress);

      console.log(`✅ 주차 완료: ${weekId}, 진도율: ${newProgress}%`);

      // 100% 완료 시 수료증 자동 발급 확인
      if (newProgress >= 100) {
        console.log('🎯 진도율 100% 달성! 수료증 발급 시도...');
        try {
          const certificateResult = await apiClient.certificates.requestCertificate(courseId);
          console.log('🎓 수료증 발급 결과:', certificateResult);
          if (certificateResult.data) {
            alert(`🎉 축하합니다! 강의를 모두 완료하여 수료증이 자동으로 발급되었습니다.\n수료증 번호: ${certificateResult.data.certificate_number || '발급됨'}`);
          } else {
            console.warn('⚠️ 수료증 발급 결과가 비어있습니다.');
          }
        } catch (certError: any) {
          console.error('❌ 수료증 발급 실패:', certError);
          if (certError.message?.includes('수료증 발급 기능이 설정되지')) {
            alert('⚠️ 수료증 발급 기능이 아직 설정되지 않았습니다.\n관리자에게 문의하시거나 브라우저 콘솔에서 debug-certificate.js를 실행해보세요.');
          } else if (certError.message?.includes('이미 발급된')) {
            alert('ℹ️ 이미 발급된 수료증이 있습니다. 수료증 목록에서 확인해보세요.');
          } else {
            alert(`❌ 수료증 발급 중 오류가 발생했습니다.\n오류: ${certError.message}\n\n브라우저 콘솔을 확인해주세요.`);
          }
        }
      }
    } catch (error) {
      console.error('❌ 주차 완료 처리 실패:', error);
      alert('진도율 업데이트에 실패했습니다.');
    }
  };

  // 주차 완료 취소
  const handleChapterUncomplete = async (weekId: string) => {
    try {
      if (!courseId || !user) return;

      const newCompletedChapters = completedChapters.filter(id => id !== weekId);

      // 전체 주차 수 대비 완료된 주차 수로 진도율 계산
      const totalWeeks = course?.weeks?.length || 0;
      const newProgress = totalWeeks > 0 ? Math.round((newCompletedChapters.length / totalWeeks) * 100) : 0;

      // 서버에 진도율 업데이트
      await apiClient.enrollments.updateProgress(courseId, newCompletedChapters, newProgress);

      // 로컬 상태 업데이트
      setCompletedChapters(newCompletedChapters);
      setProgress(newProgress);

      console.log(`❌ 주차 완료 취소: ${weekId}, 진도율: ${newProgress}%`);
    } catch (error) {
      console.error('❌ 주차 완료 취소 실패:', error);
      alert('진도율 업데이트에 실패했습니다.');
    }
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

  const instructorName = `${course.instructor.first_name || ''} ${course.instructor.last_name || ''}`.trim() || course.instructor.email;
  const weeks = course.weeks || [];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* 모바일 전용 레이아웃 - 세로 스택 */}
        <div className="space-y-4">
          
          {/* 강의 기본 정보 카드 */}
          <div className="bg-white rounded-lg shadow p-4">
            {/* 강의 썸네일 */}
            <div className="mb-4">
              <img
                src={course.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop"}
                alt={course.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
            
            {/* 강의 기본 정보 */}
            <h1 className="text-xl font-bold mb-2">{course.title}</h1>
            <p className="text-gray-600 text-sm mb-4">{course.description}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
              <div>👨‍🏫 {instructorName}</div>
              <div>💰 {formatPrice(course.price, course.is_free)}</div>
              <div>📊 {course.status === 'published' ? '공개' : '비공개'}</div>
              <div>📚 {weeks.length}개 주차</div>
            </div>
            
            {/* 진도율 표시 (수강 중인 경우) */}
            {isEnrolled && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">진도율</span>
                  <span className="text-sm font-medium text-indigo-600">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {completedChapters.length} / {weeks.length} 주차 완료
                </p>
              </div>
            )}

            {/* 수강신청 버튼 */}
            <div className="mb-4">
              {isEnrolled ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <span className="text-green-700 font-medium">✅ 수강 중</span>
                </div>
              ) : (
                <Button variant="primary" onClick={handleEnrollment} className="w-full py-3 text-lg">
                  🎯 수강 신청하기
                </Button>
              )}
            </div>
          </div>
          
          {/* 메인 콘텐츠 영역 */}
          <div className="bg-white rounded-lg shadow">
            {selectedWeek ? (
              <div className="p-4">
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="text-xl font-bold mb-1">
                        {selectedWeek.week_number}주차: {selectedWeek.title}
                      </h2>
                      {selectedWeek.duration_minutes && (
                        <p className="text-sm text-gray-600">
                          ⏱️ {formatDuration(selectedWeek.duration_minutes)}
                        </p>
                      )}
                    </div>
                    {isEnrolled && (
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          completedChapters.includes(selectedWeek.id)
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {completedChapters.includes(selectedWeek.id) ? '✅ 완료' : '⏳ 미완료'}
                        </span>
                        <button
                          onClick={() => {
                            if (completedChapters.includes(selectedWeek.id)) {
                              handleChapterUncomplete(selectedWeek.id);
                            } else {
                              handleChapterComplete(selectedWeek.id);
                            }
                          }}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            completedChapters.includes(selectedWeek.id)
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {completedChapters.includes(selectedWeek.id) ? '완료 취소' : '완료 체크'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 비디오 플레이어 - 수강신청한 경우만 표시 */}
                {selectedWeek.video_url && isEnrolled && (
                  <div className="mb-6">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <VideoPlayer
                        src={selectedWeek.video_url}
                        title={selectedWeek.title}
                      />
                    </div>
                  </div>
                )}
                
                {/* 수강신청하지 않은 경우 안내 메시지 */}
                {selectedWeek.video_url && !isEnrolled && (
                  <div className="mb-6">
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center p-6">
                        <div className="text-4xl mb-4">🔒</div>
                        <h3 className="text-lg font-medium text-gray-700 mb-2">수강신청이 필요합니다</h3>
                        <p className="text-gray-500 mb-4">강의 영상을 시청하려면 수강신청을 해주세요.</p>
                        <Button
                          onClick={handleEnrollment}
                          variant="primary"
                          className="px-6 py-2"
                        >
                          수강 신청하기
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 강의 설명 */}
                {selectedWeek.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3 border-b pb-2">📋 강의 내용</h3>
                    <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {selectedWeek.description}
                    </div>
                  </div>
                )}
                
                {/* 강의 자료 */}
                {selectedWeek.materials && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3 border-b pb-2">📁 강의 자료</h3>
                    <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {selectedWeek.materials}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4">
                <h2 className="text-xl font-bold mb-4">📖 강의 소개</h2>
                <div className="text-gray-700 leading-relaxed">
                  {course.description || '강의 설명이 없습니다.'}
                </div>
                {weeks.length > 0 && (
                  <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
                    <p className="text-indigo-700 text-sm">
                      💡 하단의 강의 목차에서 주차를 선택하여 강의를 시청하세요.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 하단 고정 탭 - 강의 목차 및 Q&A */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="px-4 py-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-800">📚 강의 목차</h3>
              <div className="flex items-center space-x-2">
                {isEnrolled && (
                  <Link
                    to={`/courses/${courseId}/qna`}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-200 transition-colors"
                  >
                    ❓ Q&A
                  </Link>
                )}
                <span className="text-xs text-gray-500">
                  {selectedWeek ? `${selectedWeek.week_number}주차 선택됨` : '주차를 선택하세요'}
                </span>
              </div>
            </div>
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {weeks.map((week) => (
                <button
                  key={week.id}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedWeek?.id === week.id 
                      ? 'bg-indigo-600 text-white' 
                      : isEnrolled 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  onClick={() => isEnrolled ? setSelectedWeek(week) : null}
                  disabled={!isEnrolled}
                >
                  <div className="flex items-center space-x-1">
                    <span>{week.week_number}주차</span>
                    {isEnrolled && completedChapters.includes(week.id) && (
                      <span className="text-green-400">✓</span>
                    )}
                    {!isEnrolled && <span>🔒</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseDetail;