import React, { useEffect } from 'react';
import { useRoutes } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './app/store';
import { getUserProfile } from './features/auth/authSlice';
import createRoutes from './routes';
import Chatbot from './features/chatbot/Chatbot';

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  
  // 사용자 정보 로드
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getUserProfile());
    }
  }, [isAuthenticated, dispatch]);
  
  // 라우트 생성
  const routes = createRoutes(isAuthenticated, user?.role || '');
  const element = useRoutes(routes);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {element}
      {isAuthenticated && <Chatbot />}
    </div>
  );
};

export default App;