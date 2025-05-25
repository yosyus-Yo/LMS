import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { logout } from '../../features/auth/authSlice';

const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* 로고 */}
        <div className="flex items-center">
          <Link to="/" className="text-2xl font-bold text-indigo-600">
            AI-LMS
          </Link>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="hidden md:flex space-x-6">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="text-gray-700 hover:text-indigo-600">
                대시보드
              </Link>
              <Link to="/courses" className="text-gray-700 hover:text-indigo-600">
                강의
              </Link>
              {user?.role === 'instructor' && (
                <Link to="/my-courses" className="text-gray-700 hover:text-indigo-600">
                  내 강의 관리
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link to="/admin" className="text-gray-700 hover:text-indigo-600">
                  관리자
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 hover:text-indigo-600">
                로그인
              </Link>
              <Link to="/register" className="text-gray-700 hover:text-indigo-600">
                회원가입
              </Link>
            </>
          )}
        </nav>

        {/* 사용자 메뉴 */}
        {isAuthenticated && (
          <div className="flex items-center space-x-4">
            <Link to="/profile" className="text-gray-700 hover:text-indigo-600">
              프로필
            </Link>
            <button
              onClick={handleLogout}
              className="text-gray-700 hover:text-indigo-600"
            >
              로그아웃
            </button>
          </div>
        )}

        {/* 모바일 메뉴 버튼 (실제 구현 필요) */}
        <div className="md:hidden">
          <button className="text-gray-500 hover:text-gray-700">
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;