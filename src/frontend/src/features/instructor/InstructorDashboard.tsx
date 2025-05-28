import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../../app/store';
import Layout from '../../components/common/Layout';
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
  status: 'draft' | 'published';
  student_count: number;
  created_at: string;
}

const InstructorDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);

  useEffect(() => {
    loadMyCourses();
  }, []);

  const loadMyCourses = async () => {
    try {
      setLoading(true);
      
      // 실제로는 강사의 강의 목록을 가져와야 함
      // 임시 데이터
      const mockCourses: Course[] = [
        {
          id: '1',
          title: 'React 기초부터 심화까지',
          status: 'published',
          student_count: 25,
          created_at: '2024-01-10T00:00:00Z',
        },
        {
          id: '2',
          title: 'TypeScript 완전정복',
          status: 'published',
          student_count: 18,
          created_at: '2024-01-05T00:00:00Z',
        },
        {
          id: '3',
          title: 'Node.js 백엔드 개발',
          status: 'draft',
          student_count: 0,
          created_at: '2024-01-15T00:00:00Z',
        },
      ];
      
      setMyCourses(mockCourses);
      
      // 첫 번째 강의를 기본 선택
      if (mockCourses.length > 0) {
        setSelectedCourse(mockCourses[0]);
        loadStudentsForCourse(mockCourses[0].id);
      }
      
    } catch (error) {
      console.error('강의 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsForCourse = async (courseId: string) => {
    try {
      setStudentsLoading(true);
      
      // 실제로는 특정 강의의 수강생 목록을 가져와야 함
      // 임시 데이터 (이름과 이메일만 포함 - 강사는 제한된 정보만 볼 수 있음)
      const mockStudents: Student[] = [
        {
          id: '1',
          email: 'student1@example.com',
          first_name: '김',
          last_name: '학생',
          enrollment_date: '2024-01-20T00:00:00Z',
          progress: 75,
          last_activity: '2024-01-25T10:30:00Z',
        },
        {
          id: '2',
          email: 'student2@example.com',
          first_name: '이',
          last_name: '수강생',
          enrollment_date: '2024-01-18T00:00:00Z',
          progress: 45,
          last_activity: '2024-01-24T14:20:00Z',
        },
        {
          id: '3',
          email: 'student3@example.com',
          first_name: '박',
          last_name: '공부',
          enrollment_date: '2024-01-22T00:00:00Z',
          progress: 90,
          last_activity: '2024-01-25T16:45:00Z',
        },
      ];
      
      setStudents(mockStudents);
      
    } catch (error) {
      console.error('학생 목록 로드 실패:', error);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    loadStudentsForCourse(course.id);
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
            <h2 className="text-lg font-medium text-gray-900">내 강의 목록</h2>
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
                    <h3 className="font-medium text-gray-900 mb-2">{course.title}</h3>
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
                        <span>{course.student_count}명</span>
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
              <p className="text-gray-500">등록된 강의가 없습니다.</p>
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
                <p className="text-gray-500 text-center py-8">
                  아직 수강생이 없습니다.
                </p>
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
                    {myCourses.reduce((sum, course) => sum + course.student_count, 0)}
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
      </div>
    </Layout>
  );
};

export default InstructorDashboard;