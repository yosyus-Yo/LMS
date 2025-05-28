import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../app/store';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import apiClient from '../../api/apiClient';

interface Student {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  enrollment_date: string;
  progress: number;
  last_activity: string;
}

interface Course {
  id: string;
  title: string;
  description?: string; // 간단한 설명
  introduction?: string; // 소개페이지 내용 (누구나 볼 수 있음)
  content?: string; // 실제 강의 내용 (수강생만 볼 수 있음)
  video_url?: string; // 강의 동영상 URL
  weeks?: CourseWeek[]; // 주차별 강의 데이터
  status: 'draft' | 'published';
  student_count?: number;
  created_at: string;
  level?: string;
  price?: number;
  is_free?: boolean;
}

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

const InstructorDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  
  // 강의 관리 상태
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  
  // 주차 관리 상태
  const [selectedCourseForWeeks, setSelectedCourseForWeeks] = useState<Course | null>(null);
  const [isWeekModalOpen, setIsWeekModalOpen] = useState(false);
  const [editingWeek, setEditingWeek] = useState<CourseWeek | null>(null);

  useEffect(() => {
    loadMyCourses();
  }, []);

  const loadMyCourses = async () => {
    try {
      setLoading(true);
      console.log('🔄 강사의 강의 목록 조회 시작');
      
      if (!user?.id) {
        console.error('사용자 정보가 없습니다');
        return;
      }
      
      // 강사가 생성한 강의 목록 조회
      const response = await apiClient.courses.getAll({ includeAll: true });
      const allCourses = response.data || [];
      
      // 현재 강사가 생성한 강의만 필터링
      const instructorCourses = allCourses.filter((course: any) => 
        course.instructor_id === user.id
      );
      
      const transformedCourses: Course[] = instructorCourses.map((course: any) => ({
        id: course.id,
        title: course.title || '제목 없음',
        description: course.description,
        introduction: course.introduction,
        content: course.content,
        video_url: course.video_url,
        status: course.status === 'published' ? 'published' : 'draft',
        student_count: course.enrollment_count || 0,
        created_at: course.created_at,
        level: course.level,
        price: course.price,
        is_free: course.is_free
      }));
      
      console.log(`✅ 강사의 강의 ${transformedCourses.length}개 조회 성공`);
      setMyCourses(transformedCourses);
      
      // 첫 번째 강의를 기본 선택
      if (transformedCourses.length > 0) {
        setSelectedCourse(transformedCourses[0]);
        loadStudentsForCourse(transformedCourses[0].id);
      }
      
    } catch (error) {
      console.error('❌ 강의 목록 로드 실패:', error);
      setMyCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsForCourse = async (courseId: string) => {
    try {
      setStudentsLoading(true);
      
      // 실제 수강생 목록 API 호출
      const response = await apiClient.enrollments.getCourseStudents(courseId);
      setStudents(response.data);
      
      console.log(`✅ 강의 ${courseId}의 수강생 ${response.data.length}명 조회 성공`);
      
    } catch (error) {
      console.error('❌ 학생 목록 로드 실패:', error);
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };


  // 강의 수정
  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setIsEditModalOpen(true);
  };

  const handleSaveCourse = async (updatedCourse: Course) => {
    try {
      console.log('강의 수정 시작:', updatedCourse);
      
      const updateData = {
        title: updatedCourse.title,
        description: updatedCourse.description,
        introduction: updatedCourse.introduction,
        content: updatedCourse.content,
        video_url: updatedCourse.video_url,
        level: updatedCourse.level,
        status: updatedCourse.status,
        price: updatedCourse.price,
        is_free: updatedCourse.is_free
      };
      
      const result = await apiClient.courses.update(updatedCourse.id, updateData);
      console.log('✅ 강의 수정 성공:', result);
      
      alert('강의가 수정되었습니다.');
      
      // 강의 목록 새로고침
      await loadMyCourses();
      setIsEditModalOpen(false);
      setEditingCourse(null);
      
    } catch (error) {
      console.error('❌ 강의 수정 실패:', error);
      alert(`강의 수정에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // 강의 삭제
  const handleDeleteCourse = (courseId: string) => {
    setCourseToDelete(courseId);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      console.log('강의 삭제 시작:', courseToDelete);
      
      await apiClient.courses.delete(courseToDelete);
      console.log('✅ 강의 삭제 성공');
      
      alert('강의가 삭제되었습니다.');
      
      // 강의 목록 새로고침
      await loadMyCourses();
      setIsDeleteConfirmOpen(false);
      setCourseToDelete(null);
      
      // 삭제된 강의가 선택된 강의였다면 선택 해제
      if (selectedCourse?.id === courseToDelete) {
        setSelectedCourse(null);
        setStudents([]);
      }
      
    } catch (error) {
      console.error('❌ 강의 삭제 실패:', error);
      alert(`강의 삭제에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      setIsDeleteConfirmOpen(false);
      setCourseToDelete(null);
    }
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    loadStudentsForCourse(course.id);
  };

  const handleManageWeeks = (course: Course) => {
    setSelectedCourseForWeeks(course);
    setIsWeekModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">강사 대시보드</h1>
            <p className="text-gray-600">내 강의 및 수강생을 관리하세요</p>
          </div>
          <div className="px-6 py-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">강사:</span>
              <span className="font-medium text-gray-900">
                {user?.first_name} {user?.last_name}
              </span>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                강사
              </span>
            </div>
          </div>
        </div>

        {/* 내 강의 목록 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">내 강의 목록</h2>
              <Link
                to="/instructor/courses/create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                새 강의 만들기
              </Link>
            </div>
          </div>
          <div className="px-6 py-4">
            {myCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myCourses.map((course) => (
                  <div
                    key={course.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedCourse?.id === course.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleCourseSelect(course)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900 flex-1">{course.title}</h3>
                      <div className="flex space-x-1 ml-2">
                        <Link
                          to={`/instructor/courses/${course.id}/edit`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 text-gray-400 hover:text-indigo-600 rounded"
                          title="강의 수정"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManageWeeks(course);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 rounded"
                          title="주차 관리"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14-7H5v14h14V4z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCourse(course.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                          title="강의 삭제"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {course.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{course.description}</p>
                    )}
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>상태:</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          course.status === 'published' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {course.status === 'published' ? '공개' : '비공개'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>수강생:</span>
                        <span>{course.student_count || 0}명</span>
                      </div>
                      <div className="flex justify-between">
                        <span>생성일:</span>
                        <span>{formatDate(course.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">아직 강의가 없습니다</h3>
                <p className="text-gray-500 mb-4">첫 번째 강의를 만들어보세요!</p>
                <Link
                  to="/instructor/courses/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  첫 강의 만들기
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 선택된 강의의 수강생 목록 */}
        {selectedCourse && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                수강생 관리 - {selectedCourse.title}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                개인정보 보호를 위해 이름과 이메일만 표시됩니다.
              </p>
            </div>
            <div className="px-6 py-4">
              {studentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : students.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          학생 정보
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          수강 등록일
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          진도율
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          최근 활동
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {student.first_name} {student.last_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {student.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(student.enrollment_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className={`h-2 rounded-full ${getProgressColor(student.progress)}`}
                                  style={{ width: `${student.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-900 font-medium">
                                {student.progress}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTime(student.last_activity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">👥</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">아직 수강생이 없습니다</h3>
                  <p className="text-gray-500">
                    강의가 공개되면 수강생들이 등록할 수 있습니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">내 강의 수</dt>
                  <dd className="text-lg font-medium text-gray-900">{myCourses.length}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a8.966 8.966 0 00-8.5-1.197" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">총 수강생</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {myCourses.reduce((sum, course) => sum + (course.student_count || 0), 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">공개 강의</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {myCourses.filter(course => course.status === 'published').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>


        {/* 강의 수정 모달 */}
        {isEditModalOpen && editingCourse && (
          <CourseEditModal
            course={editingCourse}
            onSave={handleSaveCourse}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingCourse(null);
            }}
          />
        )}

        {/* 주차 관리 모달 */}
        {isWeekModalOpen && selectedCourseForWeeks && (
          <WeekManagementModal
            course={selectedCourseForWeeks}
            onClose={() => {
              setIsWeekModalOpen(false);
              setSelectedCourseForWeeks(null);
            }}
          />
        )}

        {/* 강의 삭제 확인 모달 */}
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">
                  강의 삭제 확인
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    이 강의를 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                  </p>
                </div>
                <div className="items-center px-4 py-3">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setIsDeleteConfirmOpen(false);
                        setCourseToDelete(null);
                      }}
                      className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      취소
                    </button>
                    <button
                      onClick={confirmDeleteCourse}
                      className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};


// 강의 수정 모달 컴포넌트
interface CourseEditModalProps {
  course: Course;
  onSave: (course: Course) => void;
  onClose: () => void;
}

const CourseEditModal: React.FC<CourseEditModalProps> = ({ course, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    title: course.title,
    description: course.description || '',
    introduction: course.introduction || '',
    content: course.content || '',
    video_url: course.video_url || '',
    level: course.level || 'beginner',
    status: course.status,
    price: course.price || 0,
    is_free: course.is_free ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('강의 제목을 입력해주세요.');
      return;
    }
    onSave({
      ...course,
      title: formData.title,
      description: formData.description,
      introduction: formData.introduction,
      content: formData.content,
      video_url: formData.video_url,
      level: formData.level,
      status: formData.status as 'draft' | 'published',
      price: formData.price,
      is_free: formData.is_free
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
        <div className="mt-3">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            강의 수정
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                강의 제목 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                강의 설명 (간단한 설명)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                강의 소개 (공개 페이지 표시용)
              </label>
              <textarea
                value={formData.introduction}
                onChange={(e) => setFormData({...formData, introduction: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={5}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                강의 내용 (수강생만 볼 수 있음)
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                강의 동영상 URL
              </label>
              <input
                type="url"
                value={formData.video_url}
                onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                난이도
              </label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({...formData, level: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="beginner">초급</option>
                <option value="intermediate">중급</option>
                <option value="advanced">고급</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                공개 상태
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as 'draft' | 'published'})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="draft">초안</option>
                <option value="published">공개</option>
              </select>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="edit_is_free"
                  checked={formData.is_free}
                  onChange={(e) => setFormData({...formData, is_free: e.target.checked, price: e.target.checked ? 0 : formData.price})}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="edit_is_free" className="ml-2 block text-sm text-gray-900">
                  무료 강의
                </label>
              </div>
              {!formData.is_free && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    가격 (원)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                  />
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                저장
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// 주차 관리 모달 컴포넌트
interface WeekManagementModalProps {
  course: Course;
  onClose: () => void;
}

const WeekManagementModal: React.FC<WeekManagementModalProps> = ({ course, onClose }) => {
  const [weeks, setWeeks] = useState<CourseWeek[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWeek, setEditingWeek] = useState<CourseWeek | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeeks();
  }, [course.id]);

  const loadWeeks = async () => {
    try {
      setLoading(true);
      // 실제로는 API에서 주차 데이터를 가져와야 함
      // 임시로 빈 배열로 초기화
      setWeeks([]);
    } catch (error) {
      console.error('주차 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWeek = () => {
    setEditingWeek(null);
    setIsAddModalOpen(true);
  };

  const handleEditWeek = (week: CourseWeek) => {
    setEditingWeek(week);
    setIsAddModalOpen(true);
  };

  const handleSaveWeek = async (weekData: Partial<CourseWeek>) => {
    try {
      if (editingWeek) {
        // 수정
        const updatedWeek = { ...editingWeek, ...weekData };
        setWeeks(prev => prev.map(w => w.id === editingWeek.id ? updatedWeek : w));
      } else {
        // 새로 추가
        const newWeek: CourseWeek = {
          id: `temp-${Date.now()}`,
          week_number: weeks.length + 1,
          title: weekData.title || '',
          description: weekData.description,
          video_url: weekData.video_url,
          materials: weekData.materials,
          duration_minutes: weekData.duration_minutes,
          is_published: weekData.is_published || false,
          order_index: weeks.length
        };
        setWeeks(prev => [...prev, newWeek]);
      }
      setIsAddModalOpen(false);
      setEditingWeek(null);
    } catch (error) {
      console.error('주차 저장 실패:', error);
    }
  };

  const handleDeleteWeek = async (weekId: string) => {
    if (confirm('이 주차를 삭제하시겠습니까?')) {
      setWeeks(prev => prev.filter(w => w.id !== weekId));
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-5/6 max-w-4xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            강의 주차 관리 - {course.title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <button
            onClick={handleAddWeek}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            + 주차 추가
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">주차 데이터를 불러오는 중...</div>
        ) : (
          <div className="space-y-4">
            {weeks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                아직 추가된 주차가 없습니다. 첫 번째 주차를 추가해보세요.
              </div>
            ) : (
              weeks.map((week) => (
                <div key={week.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">
                        {week.week_number}주차: {week.title}
                      </h4>
                      {week.description && (
                        <p className="text-gray-600 mt-1">{week.description}</p>
                      )}
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        {week.video_url && (
                          <span>📹 동영상 있음</span>
                        )}
                        {week.duration_minutes && (
                          <span>⏱️ {week.duration_minutes}분</span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          week.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {week.is_published ? '공개' : '비공개'}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditWeek(week)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteWeek(week.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {isAddModalOpen && (
          <WeekEditModal
            week={editingWeek}
            courseId={course.id}
            weekNumber={editingWeek ? editingWeek.week_number : weeks.length + 1}
            onSave={handleSaveWeek}
            onClose={() => {
              setIsAddModalOpen(false);
              setEditingWeek(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

// 주차 편집 모달
interface WeekEditModalProps {
  week: CourseWeek | null;
  courseId: string;
  weekNumber: number;
  onSave: (weekData: Partial<CourseWeek>) => void;
  onClose: () => void;
}

const WeekEditModal: React.FC<WeekEditModalProps> = ({ 
  week, 
  courseId, 
  weekNumber, 
  onSave, 
  onClose 
}) => {
  const [formData, setFormData] = useState({
    title: week?.title || '',
    description: week?.description || '',
    video_url: week?.video_url || '',
    materials: week?.materials || '',
    duration_minutes: week?.duration_minutes || 0,
    is_published: week?.is_published || false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('주차 제목을 입력해주세요.');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-60">
      <div className="relative top-10 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {week ? `${weekNumber}주차 수정` : `${weekNumber}주차 추가`}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              주차 제목 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="예: 프로그래밍 기초"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              주차 설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="이번 주차에서 학습할 내용을 설명해주세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              동영상 URL
            </label>
            <input
              type="url"
              value={formData.video_url}
              onChange={(e) => setFormData({...formData, video_url: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://example.com/video.mp4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              강의 자료 (JSON 형식)
            </label>
            <textarea
              value={formData.materials}
              onChange={(e) => setFormData({...formData, materials: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder='{"pdf": "자료.pdf", "slides": "슬라이드.pptx"}'
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              수업 시간 (분)
            </label>
            <input
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value) || 0})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              min="0"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_published"
              checked={formData.is_published}
              onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900">
              즉시 공개
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-indigo-700"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InstructorDashboard;