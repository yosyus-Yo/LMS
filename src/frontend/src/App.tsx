import React, { useEffect, useState } from 'react';
import { useRoutes } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './app/store';
import { getUserProfile } from './features/auth/authSlice';
import { supabase } from './lib/supabase';
import createRoutes from './routes';
import Chatbot from './features/chatbot/Chatbot';

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(true);
  
  // 애플리케이션 시작 시 Supabase 세션 확인
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && !user) {
          // 세션이 있지만 Redux에 사용자 정보가 없으면 복원
          dispatch(getUserProfile());
        }
      } catch (error) {
        console.error('세션 확인 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Supabase 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Supabase 인증 상태 변경:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // 로그인 시 사용자 정보 새로고침
          dispatch(getUserProfile());
        } else if (event === 'SIGNED_OUT') {
          // 로그아웃 시 로컬 스토리지 정리
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch, user]);
  
  // 라우트 생성
  const routes = createRoutes(isAuthenticated, user?.role || '');
  const element = useRoutes(routes);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {element}
      {isAuthenticated && <Chatbot />}
    </div>
  );
};

export default App;