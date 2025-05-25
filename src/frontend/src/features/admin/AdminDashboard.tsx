import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, BarElement } from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';

// Chart.js 등록
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title
);

// 임시 데이터 타입 (실제 API 구현 시 대체)
interface UserSummary {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  usersByRole: {
    student: number;
    instructor: number;
    admin: number;
  };
}

interface CourseSummary {
  totalCourses: number;
  activeCourses: number;
  completionRate: number;
  categoryCounts: {
    [key: string]: number;
  };
  recentCourses: {
    id: number;
    title: string;
    enrollments: number;
    instructor: string;
  }[];
}

interface ActivitySummary {
  dailyLogins: {
    date: string;
    count: number;
  }[];
  mostActiveHours: {
    hour: number;
    count: number;
  }[];
  courseEngagement: {
    courseName: string;
    engagementScore: number;
  }[];
}

const AdminDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userSummary, setUserSummary] = useState<UserSummary | null>(null);
  const [courseSummary, setCourseSummary] = useState<CourseSummary | null>(null);
  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // 실제 구현 시 API 호출로 대체
    const fetchAdminData = async () => {
      try {
        // 임시 데이터 (API 구현 시 대체)
        setTimeout(() => {
          // 사용자 데이터
          setUserSummary({
            totalUsers: 1250,
            activeUsers: 820,
            newUsers: 45,
            usersByRole: {
              student: 1150,
              instructor: 85,
              admin: 15,
            },
          });

          // 강의 데이터
          setCourseSummary({
            totalCourses: 75,
            activeCourses: 68,
            completionRate: 62,
            categoryCounts: {
              '프로그래밍': 32,
              '데이터 과학': 18,
              '웹 개발': 15,
              '인공지능': 10,
            },
            recentCourses: [
              { id: 1, title: '파이썬 기초 프로그래밍', enrollments: 120, instructor: '이강의' },
              { id: 2, title: '데이터 분석 입문', enrollments: 85, instructor: '김데이터' },
              { id: 3, title: '웹 개발 기초', enrollments: 150, instructor: '박웹' },
              { id: 4, title: '머신러닝 기초', enrollments: 92, instructor: '최인공' },
              { id: 5, title: '고급 데이터 구조', enrollments: 65, instructor: '정구조' },
            ],
          });

          // 활동 데이터
          setActivitySummary({
            dailyLogins: [
              { date: '2025-05-10', count: 120 },
              { date: '2025-05-11', count: 145 },
              { date: '2025-05-12', count: 160 },
              { date: '2025-05-13', count: 130 },
              { date: '2025-05-14', count: 170 },
              { date: '2025-05-15', count: 185 },
              { date: '2025-05-16', count: 210 },
              { date: '2025-05-17', count: 195 },
              { date: '2025-05-18', count: 180 },
              { date: '2025-05-19', count: 220 },
            ],
            mostActiveHours: [
              { hour: 9, count: 85 },
              { hour: 10, count: 92 },
              { hour: 11, count: 78 },
              { hour: 12, count: 65 },
              { hour: 13, count: 70 },
              { hour: 14, count: 88 },
              { hour: 15, count: 95 },
              { hour: 16, count: 110 },
              { hour: 17, count: 105 },
              { hour: 18, count: 120 },
              { hour: 19, count: 135 },
              { hour: 20, count: 125 },
              { hour: 21, count: 95 },
              { hour: 22, count: 80 },
            ],
            courseEngagement: [
              { courseName: '파이썬 기초 프로그래밍', engagementScore: 85 },
              { courseName: '데이터 분석 입문', engagementScore: 72 },
              { courseName: '웹 개발 기초', engagementScore: 78 },
              { courseName: '머신러닝 기초', engagementScore: 90 },
              { courseName: '고급 데이터 구조', engagementScore: 65 },
            ],
          });

          setIsLoading(false);
        }, 800); // 로딩 시뮬레이션
      } catch (error) {
        console.error('Error fetching admin data', error);
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // 차트 데이터 생성
  const userRoleChartData = {
    labels: ['학생', '강사', '관리자'],
    datasets: [
      {
        data: userSummary ? [userSummary.usersByRole.student, userSummary.usersByRole.instructor, userSummary.usersByRole.admin] : [],
        backgroundColor: ['#4F46E5', '#10B981', '#F59E0B'],
        borderColor: ['#4338CA', '#059669', '#D97706'],
        borderWidth: 1,
      },
    ],
  };

  const courseCategoryChartData = {
    labels: courseSummary ? Object.keys(courseSummary.categoryCounts) : [],
    datasets: [
      {
        label: '강의 수',
        data: courseSummary ? Object.values(courseSummary.categoryCounts) : [],
        backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#EC4899'],
        borderColor: ['#4338CA', '#059669', '#D97706', '#DB2777'],
        borderWidth: 1,
      },
    ],
  };

  const loginActivityChartData = {
    labels: activitySummary ? activitySummary.dailyLogins.map(item => item.date.substring(5)) : [],
    datasets: [
      {
        label: '일일 로그인 수',
        data: activitySummary ? activitySummary.dailyLogins.map(item => item.count) : [],
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const hourlyActivityChartData = {
    labels: activitySummary ? activitySummary.mostActiveHours.map(item => `${item.hour}시`) : [],
    datasets: [
      {
        label: '시간대별 활동',
        data: activitySummary ? activitySummary.mostActiveHours.map(item => item.count) : [],
        backgroundColor: 'rgba(79, 70, 229, 0.7)',
        borderColor: '#4F46E5',
        borderWidth: 1,
      },
    ],
  };

  const courseEngagementChartData = {
    labels: activitySummary ? activitySummary.courseEngagement.map(item => item.courseName) : [],
    datasets: [
      {
        label: '참여도 점수',
        data: activitySummary ? activitySummary.courseEngagement.map(item => item.engagementScore) : [],
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: '#10B981',
        borderWidth: 1,
      },
    ],
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
        <h1 className="text-2xl font-bold mb-6">관리자 대시보드</h1>

        {/* 탭 메뉴 */}
        <div className="bg-white shadow-md rounded-lg mb-6">
          <div className="flex border-b">
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'overview'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              개요
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'users'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('users')}
            >
              사용자
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'courses'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('courses')}
            >
              강의
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'activity'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('activity')}
            >
              활동
            </button>
          </div>
        </div>

        {/* 개요 탭 */}
        {activeTab === 'overview' && (
          <div>
            {/* 개요 통계 카드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500 text-sm">총 사용자</p>
                    <p className="text-2xl font-bold">{userSummary?.totalUsers}</p>
                  </div>
                  <div className="bg-indigo-100 p-3 rounded-full">
                    <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                    </svg>
                  </div>
                </div>
                <div className="mt-2 text-xs text-green-600">
                  + {userSummary?.newUsers} 지난 주 대비
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500 text-sm">총 강의</p>
                    <p className="text-2xl font-bold">{courseSummary?.totalCourses}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                  </div>
                </div>
                <div className="mt-2 text-xs text-green-600">
                  {courseSummary?.activeCourses} 활성 강의
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500 text-sm">강의 완료율</p>
                    <p className="text-2xl font-bold">{courseSummary?.completionRate}%</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                </div>
                <div className="mt-2 text-xs text-yellow-600">
                  평균 완료율
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500 text-sm">활성 사용자</p>
                    <p className="text-2xl font-bold">{userSummary?.activeUsers}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                  </div>
                </div>
                <div className="mt-2 text-xs text-purple-600">
                  {((userSummary?.activeUsers || 0) / (userSummary?.totalUsers || 1) * 100).toFixed(1)}% 활성률
                </div>
              </div>
            </div>

            {/* 차트 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">사용자 역할 분포</h2>
                <div className="h-64">
                  <Pie data={userRoleChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">카테고리별 강의 수</h2>
                <div className="h-64">
                  <Pie data={courseCategoryChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
            </div>

            {/* 최근 활동 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">일일 로그인 활동</h2>
              <div className="h-80">
                <Line 
                  data={loginActivityChartData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }} 
                />
              </div>
            </div>
          </div>
        )}

        {/* 사용자 탭 */}
        {activeTab === 'users' && (
          <div>
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">사용자 통계</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-gray-500 text-sm">총 사용자</p>
                    <p className="text-2xl font-bold">{userSummary?.totalUsers}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-gray-500 text-sm">활성 사용자</p>
                    <p className="text-2xl font-bold">{userSummary?.activeUsers}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-gray-500 text-sm">신규 사용자 (지난 주)</p>
                    <p className="text-2xl font-bold">{userSummary?.newUsers}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">사용자 역할 분석</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <div className="h-64">
                      <Pie data={userRoleChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                  </div>
                  <div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-indigo-500 rounded-full mr-2"></div>
                          <span>학생</span>
                        </div>
                        <div>
                          <span className="font-medium">{userSummary?.usersByRole.student}</span>
                          <span className="text-gray-500 text-sm ml-1">
                            ({((userSummary?.usersByRole.student || 0) / (userSummary?.totalUsers || 1) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                          <span>강사</span>
                        </div>
                        <div>
                          <span className="font-medium">{userSummary?.usersByRole.instructor}</span>
                          <span className="text-gray-500 text-sm ml-1">
                            ({((userSummary?.usersByRole.instructor || 0) / (userSummary?.totalUsers || 1) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
                          <span>관리자</span>
                        </div>
                        <div>
                          <span className="font-medium">{userSummary?.usersByRole.admin}</span>
                          <span className="text-gray-500 text-sm ml-1">
                            ({((userSummary?.usersByRole.admin || 0) / (userSummary?.totalUsers || 1) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">사용자 관리</h2>
                  <Link
                    to="/admin/users"
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    모든 사용자 보기
                  </Link>
                </div>
                <p className="text-gray-500 mb-4">
                  사용자를 관리하려면 사용자 관리 페이지로 이동하세요.
                </p>
                <Link
                  to="/admin/users"
                  className="inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  사용자 관리
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 강의 탭 */}
        {activeTab === 'courses' && (
          <div>
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">강의 통계</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-gray-500 text-sm">총 강의 수</p>
                    <p className="text-2xl font-bold">{courseSummary?.totalCourses}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-gray-500 text-sm">활성 강의</p>
                    <p className="text-2xl font-bold">{courseSummary?.activeCourses}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-gray-500 text-sm">평균 완료율</p>
                    <p className="text-2xl font-bold">{courseSummary?.completionRate}%</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">카테고리별 강의</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <div className="h-64">
                      <Pie data={courseCategoryChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                  </div>
                  <div>
                    <div className="space-y-4">
                      {courseSummary && Object.keys(courseSummary.categoryCounts).map((category, index) => {
                        const colors = ['bg-indigo-500', 'bg-green-500', 'bg-yellow-500', 'bg-pink-500'];
                        return (
                          <div key={category} className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className={`w-4 h-4 ${colors[index % colors.length]} rounded-full mr-2`}></div>
                              <span>{category}</span>
                            </div>
                            <div>
                              <span className="font-medium">{courseSummary.categoryCounts[category]}</span>
                              <span className="text-gray-500 text-sm ml-1">
                                ({((courseSummary.categoryCounts[category] / courseSummary.totalCourses) * 100).toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">최근 강의</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          강의명
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          강사
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          수강 인원
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          액션
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {courseSummary?.recentCourses.map((course) => (
                        <tr key={course.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{course.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{course.instructor}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{course.enrollments}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Link to={`/courses/${course.id}`} className="text-indigo-600 hover:text-indigo-900 mr-3">
                              보기
                            </Link>
                            <Link to={`/admin/courses/${course.id}/edit`} className="text-green-600 hover:text-green-900">
                              편집
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-right">
                  <Link
                    to="/admin/courses"
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    모든 강의 보기 →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 활동 탭 */}
        {activeTab === 'activity' && (
          <div>
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">일일 로그인 활동</h2>
                <div className="h-80">
                  <Line 
                    data={loginActivityChartData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }} 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">시간대별 활동</h2>
                  <div className="h-80">
                    <Bar 
                      data={hourlyActivityChartData} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true
                          }
                        }
                      }} 
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">강의별 참여도</h2>
                  <div className="h-80">
                    <Bar 
                      data={courseEngagementChartData} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        indexAxis: 'y',
                        scales: {
                          x: {
                            beginAtZero: true,
                            max: 100
                          }
                        }
                      }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">활동 로그</h2>
                  <Link
                    to="/admin/logs"
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    모든 로그 보기
                  </Link>
                </div>
                <p className="text-gray-500 mb-4">
                  상세한 활동 로그를 확인하려면 활동 로그 페이지로 이동하세요.
                </p>
                <Link
                  to="/admin/logs"
                  className="inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  활동 로그 보기
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;