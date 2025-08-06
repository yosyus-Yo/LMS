import React, { useEffect, useState } from 'react';
import { useRoutes } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './app/store';
import { getUserProfile } from './features/auth/authSlice';
import { supabase } from './lib/supabase';
import createRoutes from './routes';
import Chatbot from './features/chatbot/Chatbot';
import AuthDebug from './components/debug/AuthDebug';

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, isLoading: authLoading } = useAppSelector((state) => state.auth);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // 간단한 세션 복원
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && !user) {
          console.log('🔄 세션 복원 시도:', session.user.id);
          dispatch(getUserProfile());
        }
      } catch (error) {
        console.error('❌ 세션 확인 오류:', error);
      }
      
      // 로딩 즉시 종료
      setIsInitialLoading(false);
    };

    initAuth();
    
    // Supabase 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Supabase 인증 상태 변경:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          dispatch(getUserProfile());
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch]);
  
  // 전체 로딩 상태 계산 (최대 2초만)
  const isLoading = isInitialLoading;
  
  // 라우트 생성
  const routes = createRoutes(isAuthenticated, user?.role || '');
  const element = useRoutes(routes);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {element}
      {isAuthenticated && <Chatbot />}
      {process.env.NODE_ENV === 'development' && <AuthDebug />}
    </div>
  );
};

export default App;