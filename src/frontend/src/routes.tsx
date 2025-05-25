import React from 'react';
import { Navigate, RouteObject } from 'react-router-dom';

// 인증 관련
import Login from './features/auth/Login';
import Register from './features/auth/Register';

// 대시보드
import Dashboard from './features/dashboard/Dashboard';

// 강의 관련
import CourseList from './features/courses/CourseList';
import CourseDetail from './features/courses/CourseDetail';

// 임시 컴포넌트 (추후 실제 구현으로 대체)
const Profile = () => <div>Profile Page</div>;
const AdminDashboard = () => <div>Admin Dashboard Page</div>;
const InstructorCourses = () => <div>Instructor Courses Page</div>;
const NotFound = () => <div>404 - Page Not Found</div>;

// 인증 보호 라우트 헬퍼 함수
interface ProtectedRouteProps {
  element: React.ReactNode;
  isAuthenticated: boolean;
  redirectPath?: string;
  requiredRole?: string;
  userRole?: string;
}

const ProtectedRoute = ({
  element,
  isAuthenticated,
  redirectPath = '/login',
  requiredRole,
  userRole,
}: ProtectedRouteProps) => {
  // 인증되지 않은 경우
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  // 역할 확인이 필요한 경우
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{element}</>;
};

// 라우트 설정 함수
export const createRoutes = (isAuthenticated: boolean, userRole: string): RouteObject[] => {
  return [
    // 공개 라우트
    {
      path: '/login',
      element: isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />,
    },
    {
      path: '/register',
      element: isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />,
    },

    // 보호된 라우트
    {
      path: '/dashboard',
      element: (
        <ProtectedRoute
          element={<Dashboard />}
          isAuthenticated={isAuthenticated}
        />
      ),
    },
    {
      path: '/courses',
      element: (
        <ProtectedRoute
          element={<CourseList />}
          isAuthenticated={isAuthenticated}
        />
      ),
    },
    {
      path: '/courses/:courseId',
      element: (
        <ProtectedRoute
          element={<CourseDetail />}
          isAuthenticated={isAuthenticated}
        />
      ),
    },
    {
      path: '/profile',
      element: (
        <ProtectedRoute
          element={<Profile />}
          isAuthenticated={isAuthenticated}
        />
      ),
    },

    // 강사 전용 라우트
    {
      path: '/my-courses',
      element: (
        <ProtectedRoute
          element={<InstructorCourses />}
          isAuthenticated={isAuthenticated}
          requiredRole="instructor"
          userRole={userRole}
        />
      ),
    },

    // 관리자 전용 라우트
    {
      path: '/admin',
      element: (
        <ProtectedRoute
          element={<AdminDashboard />}
          isAuthenticated={isAuthenticated}
          requiredRole="admin"
          userRole={userRole}
        />
      ),
    },

    // 리디렉션
    {
      path: '/',
      element: <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />,
    },

    // 찾을 수 없는 페이지
    {
      path: '*',
      element: <NotFound />,
    },
  ];
};

export default createRoutes;