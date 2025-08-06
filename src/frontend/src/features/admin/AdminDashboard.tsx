import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../app/store';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import apiClient from '../../api/apiClient';

interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  recentUsers: User[];
  recentCourses: Course[];
  recentPayments: Payment[];
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
  is_active: boolean;
}

interface Course {
  id: string;
  title: string;
  instructor?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  instructor_id?: string;
  status: string;
  enrollment_count?: number;
  created_at: string;
  description?: string;
  level?: string;
  price?: number;
}

interface Payment {
  id: number;
  user: {
    email: string;
    first_name: string;
    last_name: string;
  };
  amount: string;
  status: string;
  payment_type: string;
  requested_at: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAppSelector((state) => state.auth);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'courses' | 'payments'>('overview');
  
  // 강의 관리 상태
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  
  // 사용자 관리 상태
  const [isUserDeleteConfirmOpen, setIsUserDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // 관리자 권한 확인
  useEffect(() => {
    if (!isAuthenticated || !currentUser || currentUser.role !== 'admin') {
      alert('관리자 권한이 필요합니다.');
      navigate('/login');
      return;
    }
  }, [isAuthenticated, currentUser, navigate]);

  useEffect(() => {
    if (isAuthenticated && currentUser && currentUser.role === 'admin') {
      fetchDashboardData();
    }
  }, [isAuthenticated, currentUser]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 관리자 대시보드 데이터 조회 시작');
      
      // 병렬로 데이터 조회
      const [usersResult, coursesResult] = await Promise.allSettled([
        apiClient.users.getAll(),
        apiClient.courses.getAll({ includeAll: true })
      ]);

      let users: User[] = [];
      let courses: Course[] = [];
      
      // 사용자 데이터 처리
      if (usersResult.status === 'fulfilled') {
        users = usersResult.value.data || [];
        console.log(`✅ 사용자 ${users.length}명 조회 성공`);
      } else {
        console.error('❌ 사용자 데이터 조회 실패:', usersResult.reason);
      }

      // 강의 데이터 처리
      if (coursesResult.status === 'fulfilled') {
        const coursesData = coursesResult.value.data || [];
        courses = coursesData.map((course: any) => ({
          id: course.id,
          title: course.title,
          instructor: course.instructor,
          instructor_id: course.instructor_id,
          status: course.status || 'draft',
          enrollment_count: course.enrollment_count || 0,
          created_at: course.created_at,
          description: course.description,
          level: course.level,
          price: course.price
        }));
        console.log(`✅ 강의 ${courses.length}개 조회 성공`);
      } else {
        console.error('❌ 강의 데이터 조회 실패:', coursesResult.reason);
      }

      // 임시 결제 데이터 (실제 구현 시 결제 API 추가 필요)
      const payments: Payment[] = [];

      // 통계 계산
      const totalRevenue = payments
        .filter((p: Payment) => p.status === 'completed')
        .reduce((sum: number, p: Payment) => sum + parseFloat(p.amount), 0);

      const totalEnrollments = courses.reduce((sum: number, c: Course) => sum + (c.enrollment_count || 0), 0);

      setStats({
        totalUsers: users.length,
        totalCourses: courses.length,
        totalEnrollments,
        totalRevenue,
        recentUsers: users.slice(0, 10), // 최근 10명
        recentCourses: courses.slice(0, 10), // 최근 10개
        recentPayments: payments.slice(0, 5)
      });

      console.log('✅ 대시보드 데이터 조회 완료');
    } catch (error) {
      console.error('❌ 대시보드 데이터 조회 실패:', error);
      // 에러 시 빈 데이터로 초기화
      setStats({
        totalUsers: 0,
        totalCourses: 0,
        totalEnrollments: 0,
        totalRevenue: 0,
        recentUsers: [],
        recentCourses: [],
        recentPayments: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 사용자 역할 변경
  const handleChangeUserRole = async (userId: string, newRole: 'student' | 'instructor' | 'admin') => {
    try {
      await apiClient.users.updateRole(userId, newRole);
      
      // 상태 업데이트
      setStats(prevStats => {
        if (!prevStats) return null;
        return {
          ...prevStats,
          recentUsers: prevStats.recentUsers.map(user => 
            user.id === userId ? { ...user, role: newRole } : user
          )
        };
      });
      
      alert('사용자 역할이 변경되었습니다.');
    } catch (error) {
      console.error('사용자 역할 변경 실패:', error);
      alert('사용자 역할 변경에 실패했습니다.');
    }
  };

  // 강의 수정 핸들러
  const handleEditCourse = (course: Course) => {
    navigate(`/instructor/courses/${course.id}/edit`);
  };

  // 사용자 삭제 핸들러
  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
    setIsUserDeleteConfirmOpen(true);
  };

  // 사용자 삭제 확인
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      console.log('사용자 삭제 시작:', userToDelete);
      
      // 삭제 대상 사용자 정보 찾기
      const userInfo = stats?.recentUsers.find(user => user.id === userToDelete);
      const userName = userInfo ? `${userInfo.first_name} ${userInfo.last_name} (${userInfo.email})` : userToDelete;
      
      // 실제 API 호출로 사용자 삭제
      const result = await apiClient.users.delete(userToDelete);
      console.log('✅ 사용자 삭제 API 호출 성공:', result);
      
      // 상태에서 제거
      setStats(prevStats => {
        if (!prevStats) return null;
        return {
          ...prevStats,
          recentUsers: prevStats.recentUsers.filter(user => user.id !== userToDelete),
          totalUsers: prevStats.totalUsers - 1
        };
      });

      // 성공 메시지 표시
      if (result.success && result.message) {
        alert(`✅ ${result.message}\n\n⚠️ 주의: Supabase Authentication 계정은 별도로 관리해야 합니다.\n\n📋 Supabase 대시보드 > Authentication > Users에서 해당 사용자를 수동으로 삭제하거나 비활성화하세요.`);
      } else {
        alert(`✅ 사용자 ${userName}의 데이터베이스 기록이 모두 삭제되었습니다.\n\n⚠️ Supabase Auth 계정은 별도 관리가 필요합니다.`);
      }
      
      setIsUserDeleteConfirmOpen(false);
      setUserToDelete(null);
      
      // 대시보드 데이터 새로고침
      fetchDashboardData();
      
    } catch (error) {
      console.error('❌ 사용자 삭제 실패:', error);
      
      let errorMessage = '사용자 삭제에 실패했습니다.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(`❌ ${errorMessage}\n\n💡 문제가 지속되면 개발자 콘솔을 확인하세요.`);
      setIsUserDeleteConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  // 강의 삭제 핸들러
  const handleDeleteCourse = (courseId: string) => {
    setCourseToDelete(courseId);
    setIsDeleteConfirmOpen(true);
  };

  // 강의 삭제 확인
  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      console.log('강의 삭제 시작:', courseToDelete);
      
      // 실제 API 호출로 강의 삭제
      await apiClient.courses.delete(courseToDelete);
      console.log('✅ 강의 삭제 성공');
      
      // 상태에서 제거
      setStats(prevStats => {
        if (!prevStats) return null;
        return {
          ...prevStats,
          recentCourses: prevStats.recentCourses.filter(course => course.id !== courseToDelete),
          totalCourses: prevStats.totalCourses - 1
        };
      });

      alert('강의가 삭제되었습니다.');
      setIsDeleteConfirmOpen(false);
      setCourseToDelete(null);
    } catch (error) {
      console.error('❌ 강의 삭제 실패:', error);
      alert(`강의 삭제에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      setIsDeleteConfirmOpen(false);
      setCourseToDelete(null);
    }
  };


  const getStatusBadge = (status: string | boolean, type: 'user' | 'course' | 'payment') => {
    let className = '';
    let text = '';

    if (type === 'user') {
      const isActive = status === true || status === 'true';
      className = isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
      text = isActive ? '활성' : '비활성';
    } else if (type === 'course') {
      switch (status) {
        case 'published':
          className = 'bg-green-100 text-green-800';
          text = '게시됨';
          break;
        case 'draft':
          className = 'bg-yellow-100 text-yellow-800';
          text = '초안';
          break;
        default:
          className = 'bg-gray-100 text-gray-800';
          text = status.toString();
      }
    } else if (type === 'payment') {
      switch (status) {
        case 'completed':
          className = 'bg-green-100 text-green-800';
          text = '완료';
          break;
        case 'pending':
          className = 'bg-yellow-100 text-yellow-800';
          text = '대기';
          break;
        case 'failed':
          className = 'bg-red-100 text-red-800';
          text = '실패';
          break;
        default:
          className = 'bg-gray-100 text-gray-800';
          text = status.toString();
      }
    }

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${className}`}>
        {text}
      </span>
    );
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
          <div className="flex space-x-2">
            <Link to="/instructor/courses/create">
              <Button variant="primary">
                새 강의 만들기
              </Button>
            </Link>
            <Button
              variant="secondary"
              onClick={() => window.open('/admin/', '_blank')}
            >
              Django Admin
            </Button>
            <Button
              variant="secondary"
              onClick={fetchDashboardData}
            >
              새로고침
            </Button>
          </div>
        </div>

        {/* 통계 카드 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">전체 사용자</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">전체 강의</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
                </div>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">전체 수강</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEnrollments}</p>
                </div>
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">총 수익</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: '개요' },
              { id: 'users', name: '사용자' },
              { id: 'courses', name: '강의' },
              { id: 'payments', name: '결제' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* 탭 컨텐츠 */}
        {stats && (
          <div className="bg-white rounded-lg shadow">
            {activeTab === 'overview' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">시스템 개요</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-2">최근 활동</h4>
                    <ul className="space-y-2">
                      <li className="text-sm text-gray-600">• 새로운 사용자 {stats.recentUsers.length}명 가입</li>
                      <li className="text-sm text-gray-600">• 새로운 강의 {stats.recentCourses.length}개 등록</li>
                      <li className="text-sm text-gray-600">• 최근 결제 {stats.recentPayments.length}건 처리</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-2">시스템 상태</h4>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-600">시스템 정상</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-600">데이터베이스 연결</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-600">결제 시스템 연결</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">사용자 관리</h3>
                  <div className="text-sm text-gray-600">
                    총 {stats.recentUsers.length}명
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">역할</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가입일</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.recentUsers.length > 0 ? (
                        stats.recentUsers.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {user.first_name && user.last_name 
                                    ? `${user.first_name} ${user.last_name}` 
                                    : user.email.split('@')[0]
                                  }
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                value={user.role}
                                onChange={(e) => handleChangeUserRole(user.id, e.target.value as 'student' | 'instructor' | 'admin')}
                                className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="student">학생</option>
                                <option value="instructor">강사</option>
                                <option value="admin">관리자</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(user.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(user.is_active ?? true, 'user')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className={`${
                                    user.email === currentUser?.email 
                                      ? 'text-gray-400 cursor-not-allowed' 
                                      : 'text-red-600 hover:text-red-900'
                                  }`}
                                  disabled={user.email === currentUser?.email} // 현재 로그인한 사용자는 삭제할 수 없음
                                  title={user.email === currentUser?.email ? '자기 자신은 삭제할 수 없습니다' : '사용자 삭제'}
                                >
                                  삭제
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            등록된 사용자가 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'courses' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">강의 관리</h3>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      총 {stats.recentCourses.length}개 강의
                    </div>
                    <div className="flex space-x-2">
                      <Link to="/instructor/courses/create">
                        <Button variant="primary" size="sm">
                          새 강의 추가
                        </Button>
                      </Link>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={fetchDashboardData}
                      >
                        새로고침
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">강의명</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">강사</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수강생</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등록일</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.recentCourses.length > 0 ? (
                        stats.recentCourses.map((course) => (
                          <tr key={course.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{course.title}</div>
                                {course.description && (
                                  <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                                    {course.description}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {course.instructor ? (
                                <div>
                                  <div className="text-sm text-gray-900">
                                    {course.instructor.first_name} {course.instructor.last_name}
                                  </div>
                                  <div className="text-sm text-gray-500">{course.instructor.email}</div>
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500">
                                  강사 정보 없음
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {course.enrollment_count || 0}명
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(course.status, 'course')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(course.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditCourse(course)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => handleDeleteCourse(course.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  삭제
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                            등록된 강의가 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">최근 결제 내역</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">결제 유형</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">금액</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">결제일</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.recentPayments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {payment.user.first_name} {payment.user.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{payment.user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.payment_type === 'subscription' ? '구독' : payment.payment_type === 'course' ? '강의' : '기타'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(parseFloat(payment.amount))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(payment.status, 'payment')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(payment.requested_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}


        {/* 사용자 삭제 확인 모달 */}
        {isUserDeleteConfirmOpen && (
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
                  사용자 삭제 확인
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500 mb-3">
                    이 사용자를 정말 삭제하시겠습니까? 다음 데이터가 모두 삭제됩니다:
                  </p>
                  <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-md text-left">
                    <ul className="space-y-1">
                      <li>• 사용자 프로필 정보</li>
                      <li>• 수강신청 기록</li>
                      <li>• 결제 기록</li>
                      <li>• 커뮤니티 게시글 및 댓글</li>
                    </ul>
                  </div>
                  <p className="text-xs text-orange-600 mt-2">
                    ⚠️ Supabase Auth 계정은 별도로 관리해야 합니다.
                  </p>
                </div>
                <div className="items-center px-4 py-3">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setIsUserDeleteConfirmOpen(false);
                        setUserToDelete(null);
                      }}
                      className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      취소
                    </button>
                    <button
                      onClick={confirmDeleteUser}
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


export default AdminDashboard;