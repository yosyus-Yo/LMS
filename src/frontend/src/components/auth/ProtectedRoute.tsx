import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'instructor' | 'admin';
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, user, isLoading } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // 로딩 중이면 로딩 화면 표시
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">인증 상태를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // 권한이 필요한 경우 권한 체크
  if (requiredRole && user.role !== requiredRole) {
    // 관리자가 아닌데 관리자 권한이 필요한 경우
    if (requiredRole === 'admin' && user.role !== 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
    
    // 강사가 아닌데 강사 권한이 필요한 경우
    if (requiredRole === 'instructor' && !['instructor', 'admin'].includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // 모든 조건을 만족하면 자식 컴포넌트 렌더링
  return <>{children}</>;
};

export default ProtectedRoute;