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

  useEffect(() => {
    const loadCourse = async () => {
      try {
        if (!courseId) return;
        
        setIsLoading(true);
        
        // 강의 기본 정보 가져오기
        const courseResponse = await apiClient.courses.getById(courseId);
        const courseData = courseResponse.data;
        
        // localStorage에서 주차 데이터 가져오기
        const weeksResponse = await apiClient.weeks.getWeeks(courseId);
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
      <div className="min-h-screen bg-gray-50">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
          
          {/* 왼쪽 사이드바 - 강의 정보 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
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
              
              <div className="space-y-2 text-sm text-gray-600">
                <div>강사: {instructorName}</div>
                <div>가격: {formatPrice(course.price, course.is_free)}</div>
                <div>상태: {course.status === 'published' ? '공개' : '비공개'}</div>
              </div>
              
              {/* 수강신청 버튼 */}
              <div className="mt-6">
                {isEnrolled ? (
                  <Button variant="primary" className="w-full">
                    수강 중
                  </Button>
                ) : (
                  <Button variant="primary" onClick={handleEnrollment} className="w-full">
                    수강 신청
                  </Button>
                )}
              </div>
              
              {/* 주차 목록 */}
              <div className="mt-6">
                <h3 className="font-medium mb-3">강의 목차</h3>
                <div className="space-y-2">
                  {weeks.map((week) => (
                    <div
                      key={week.id}
                      className={`p-2 rounded cursor-pointer transition-colors ${
                        selectedWeek?.id === week.id 
                          ? 'bg-indigo-100 text-indigo-700' 
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedWeek(week)}
                    >
                      <div className="text-sm font-medium">
                        {week.week_number}주차: {week.title}
                      </div>
                      {week.duration_minutes && (
                        <div className="text-xs text-gray-500">
                          {formatDuration(week.duration_minutes)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* 메인 콘텐츠 영역 */}
          <div className="lg:col-span-3">
            {selectedWeek ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold mb-2">
                    {selectedWeek.week_number}주차: {selectedWeek.title}
                  </h2>
                  {selectedWeek.duration_minutes && (
                    <p className="text-gray-600">
                      강의 시간: {formatDuration(selectedWeek.duration_minutes)}
                    </p>
                  )}
                </div>
                
                {/* 비디오 플레이어 */}
                {selectedWeek.video_url && (
                  <div className="mb-6">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <VideoPlayer
                        src={selectedWeek.video_url}
                        title={selectedWeek.title}
                      />
                    </div>
                  </div>
                )}
                
                {/* 강의 설명 */}
                {selectedWeek.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2">강의 내용</h3>
                    <div className="text-gray-700 whitespace-pre-line">
                      {selectedWeek.description}
                    </div>
                  </div>
                )}
                
                {/* 강의 자료 */}
                {selectedWeek.materials && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2">강의 자료</h3>
                    <div className="text-gray-700 whitespace-pre-line">
                      {selectedWeek.materials}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">강의 소개</h2>
                <div className="text-gray-700">
                  {course.description || '강의 설명이 없습니다.'}
                </div>
                {weeks.length > 0 && (
                  <div className="mt-6">
                    <p className="text-gray-600">
                      왼쪽 목차에서 주차를 선택하여 강의를 시청하세요.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseDetail;