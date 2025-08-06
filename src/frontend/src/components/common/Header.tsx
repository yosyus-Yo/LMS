import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { logout } from '../../features/auth/authSlice';

const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* 모바일 전용 헤더 */}
      <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
        <div className="px-4 py-3 flex justify-between items-center">
          {/* 로고 */}
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-indigo-600" onClick={closeMenu}>
              AI-LMS
            </Link>
          </div>

          {/* 사용자 정보 및 햄버거 메뉴 */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && (
              <div className="text-sm text-gray-600">
                {user?.first_name || user?.email}님
              </div>
            )}
            <button
              onClick={toggleMenu}
              className="p-2 text-gray-600 hover:text-indigo-600 focus:outline-none"
            >
              {isMenuOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* 모바일 드롭다운 메뉴 */}
        {isMenuOpen && (
          <div className="border-t border-gray-200 bg-white shadow-lg relative z-50">
            <nav className="px-4 py-2 space-y-1">
              {/* 기본 메뉴 */}
              <Link 
                to="/courses" 
                className="block px-3 py-3 text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md"
                onClick={closeMenu}
              >
                📚 강의
              </Link>
              <Link 
                to="/community" 
                className="block px-3 py-3 text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md"
                onClick={closeMenu}
              >
                💬 커뮤니티
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/dashboard" 
                    className="block px-3 py-3 text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md"
                    onClick={closeMenu}
                  >
                    📊 대시보드
                  </Link>
                  <Link 
                    to="/profile" 
                    className="block px-3 py-3 text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md"
                    onClick={closeMenu}
                  >
                    👤 프로필
                  </Link>
                  
                  {user?.role === 'instructor' && (
                    <Link 
                      to="/my-courses" 
                      className="block px-3 py-3 text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md"
                      onClick={closeMenu}
                    >
                      🎓 내 강의 관리
                    </Link>
                  )}
                  
                  <Link 
                    to="/certificates" 
                    className="block px-3 py-3 text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md"
                    onClick={closeMenu}
                  >
                    🏆 내 수료증
                  </Link>
                  
                  {user?.role === 'admin' && (
                    <Link 
                      to="/admin" 
                      className="block px-3 py-3 text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md"
                      onClick={closeMenu}
                    >
                      ⚙️ 관리자
                    </Link>
                  )}

                  {/* 개발 환경에서만 디버그 링크 표시 */}
                  {process.env.NODE_ENV === 'development' && (
                    <>
                      <Link 
                        to="/debug/courses" 
                        className="block px-3 py-3 text-base font-medium text-orange-600 hover:bg-orange-50 rounded-md"
                        onClick={closeMenu}
                      >
                        🐛 디버그
                      </Link>
                      <Link 
                        to="/debug/simple" 
                        className="block px-3 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
                        onClick={closeMenu}
                      >
                        🧪 테스트
                      </Link>
                    </>
                  )}

                  <div className="border-t border-gray-200 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
                    >
                      🚪 로그아웃
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="block px-3 py-3 text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md"
                    onClick={closeMenu}
                  >
                    🔑 로그인
                  </Link>
                  <Link 
                    to="/register" 
                    className="block px-3 py-3 text-base font-medium text-indigo-600 hover:bg-indigo-50 rounded-md font-semibold"
                    onClick={closeMenu}
                  >
                    ✨ 회원가입
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}

        {/* 메뉴 열려있을 때 배경 오버레이 - 메뉴 아래에만 */}
        {isMenuOpen && (
          <div 
            className="fixed top-16 left-0 right-0 bottom-0 bg-black bg-opacity-25 z-30"
            onClick={closeMenu}
          ></div>
        )}
      </header>

      {/* 헤더 높이만큼 패딩 추가 */}
      <div className="h-16"></div>
    </>
  );
};

export default Header;