import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { login, clearError } from './authSlice';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Layout from '../../components/common/Layout';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
  });

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // 이미 인증된 사용자는 role에 따라 리디렉션
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        // 관리자는 React 관리자 대시보드로 리디렉션
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
    
    // 컴포넌트 언마운트 시 에러 클리어
    return () => {
      dispatch(clearError());
    };
  }, [isAuthenticated, user, navigate, dispatch]);

  const validateForm = (): boolean => {
    let valid = true;
    const newErrors = { email: '', password: '' };
    
    if (!email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = '유효한 이메일 주소를 입력해주세요';
      valid = false;
    }
    
    if (!password) {
      newErrors.password = '비밀번호를 입력해주세요';
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다';
      valid = false;
    }
    
    setFormErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        console.log('🔄 로그인 시도:', { email, password: '***' });
        
        // 실제 Supabase 로그인 시도
        const result = await dispatch(login({ email, password })).unwrap();
        console.log('✅ 로그인 성공:', result);
        
        // role에 따라 리다이렉션
        if (result.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
        
      } catch (err: any) {
        console.error('❌ 로그인 실패:', err);
        
        // 사용자에게 친화적인 에러 메시지 표시
        let errorMessage = '로그인에 실패했습니다.';
        
        if (err.message) {
          if (err.message.includes('Invalid login credentials')) {
            errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
          } else if (err.message.includes('Email not confirmed')) {
            errorMessage = '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.';
          } else if (err.message.includes('Invalid email')) {
            errorMessage = '유효하지 않은 이메일 주소입니다.';
          } else if (err.message.includes('Too many requests')) {
            errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
          } else {
            errorMessage += `\n오류: ${err.message}`;
          }
        }
        
        // 추가 도움말 제공
        errorMessage += '\n\n문제가 계속되면 회원가입을 다시 하시거나 관리자에게 문의하세요.';
        
        alert(errorMessage);
        
        // 오류는 authSlice의 extraReducers에서도 처리됨
      }
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">로그인</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* 개발 모드용 테스트 계정 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">개발 모드 - 테스트 계정</h3>
            <div className="space-y-2 text-sm">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@test.com');
                  setPassword('test123');
                }}
                className="block w-full text-left px-2 py-1 hover:bg-blue-100 rounded"
              >
                👑 관리자: admin@test.com / test123
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('instructor@test.com');
                  setPassword('test123');
                }}
                className="block w-full text-left px-2 py-1 hover:bg-blue-100 rounded"
              >
                👨‍🏫 강사: instructor@test.com / test123
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('student@test.com');
                  setPassword('test123');
                }}
                className="block w-full text-left px-2 py-1 hover:bg-blue-100 rounded"
              >
                🎓 학생: student@test.com / test123
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            name="email"
            type="email"
            label="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일을 입력하세요"
            error={formErrors.email}
            fullWidth
          />
          
          <Input
            id="password"
            name="password"
            type="password"
            label="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            error={formErrors.password}
            fullWidth
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                로그인 상태 유지
              </label>
            </div>
            
            <div className="text-sm">
              <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-500">
                비밀번호를 잊으셨나요?
              </Link>
            </div>
          </div>
          
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            fullWidth
          >
            로그인
          </Button>
          
          <div className="text-center mt-4">
            <span className="text-gray-600">계정이 없으신가요?</span>{' '}
            <Link to="/register" className="text-indigo-600 hover:text-indigo-500">
              회원가입
            </Link>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default Login;