import React, { useState } from 'react';
import { useAppSelector } from '../../app/store';
import { supabase } from '../../lib/supabase';
import apiClient from '../../api/apiClient';
import Button from '../common/Button';

const AuthDebug: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkAuthStatus = async () => {
    setIsChecking(true);
    try {
      // 1. Supabase 세션 확인
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // 2. Supabase 사용자 확인
      const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();
      
      // 3. 프로필 조회 테스트
      let profileData = null;
      let profileError: string | null = null;
      
      if (supabaseUser) {
        try {
          const response = await apiClient.auth.getCurrentUser();
          profileData = response.data;
        } catch (error: any) {
          profileError = error?.message || String(error);
        }
      }
      
      // 4. 로컬 스토리지 확인
      const localToken = localStorage.getItem('token');
      const localUser = localStorage.getItem('user');
      
      setDebugInfo({
        timestamp: new Date().toISOString(),
        supabase: {
          session: session ? 'OK' : 'NONE',
          sessionError,
          user: supabaseUser ? 'OK' : 'NONE',
          userError,
          userId: supabaseUser?.id
        },
        profile: {
          data: profileData,
          error: profileError
        },
        localStorage: {
          token: localToken ? 'EXISTS' : 'NONE',
          user: localUser ? 'EXISTS' : 'NONE'
        },
        redux: {
          isAuthenticated,
          isLoading,
          user: user ? 'OK' : 'NONE',
          userId: user?.id
        }
      });
    } catch (error: any) {
      setDebugInfo({
        error: error?.message || String(error),
        timestamp: new Date().toISOString()
      });
    }
    setIsChecking(false);
  };

  const clearAuth = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-md z-50">
      <h3 className="text-sm font-bold mb-2">🔍 Auth Debug</h3>
      
      <div className="text-xs mb-3">
        <div>인증상태: {isAuthenticated ? '✅' : '❌'}</div>
        <div>로딩중: {isLoading ? '⏳' : '✅'}</div>
        <div>사용자: {user?.email || 'NONE'}</div>
      </div>
      
      <div className="flex space-x-2 mb-3">
        <Button 
          size="sm" 
          variant="secondary" 
          onClick={checkAuthStatus}
          disabled={isChecking}
        >
          {isChecking ? '확인중...' : '상태확인'}
        </Button>
        <Button 
          size="sm" 
          variant="secondary" 
          onClick={clearAuth}
        >
          인증정리
        </Button>
      </div>
      
      {debugInfo && (
        <div className="text-xs bg-gray-50 p-2 rounded max-h-64 overflow-y-auto">
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default AuthDebug;