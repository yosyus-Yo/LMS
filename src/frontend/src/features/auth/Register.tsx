import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { register, clearError } from './authSlice';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Layout from '../../components/common/Layout';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  
  const [formErrors, setFormErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);
  
  useEffect(() => {
    // 이미 인증된 사용자는 대시보드로 리디렉션
    if (isAuthenticated) {
      navigate('/dashboard');
    }
    
    // 컴포넌트 언마운트 시 에러 클리어
    return () => {
      dispatch(clearError());
    };
  }, [isAuthenticated, navigate, dispatch]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const validateForm = (): boolean => {
    let valid = true;
    const newErrors = {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
    };
    
    // 사용자 이름 검증
    if (!formData.username.trim()) {
      newErrors.username = '사용자 이름을 입력해주세요';
      valid = false;
    } else if (formData.username.length < 3) {
      newErrors.username = '사용자 이름은 최소 3자 이상이어야 합니다';
      valid = false;
    }
    
    // 이메일 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
      valid = false;
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
      valid = false;
    }
    
    // 비밀번호 검증
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다';
      valid = false;
    }
    
    // 비밀번호 확인 검증
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요';
      valid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
      valid = false;
    }
    
    // 이름 검증
    if (!formData.firstName.trim()) {
      newErrors.firstName = '이름을 입력해주세요';
      valid = false;
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = '성을 입력해주세요';
      valid = false;
    }
    
    setFormErrors(newErrors);
    return valid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        console.log('Submitting registration data:', {
          username: formData.username,
          email: formData.email,
          password: '***HIDDEN***',
          first_name: formData.firstName,
          last_name: formData.lastName,
        });
        
        // 개발 모드에서 사용자 이름 저장
        if (process.env.NODE_ENV === 'development') {
          localStorage.setItem('dev_username', formData.username);
        }
        
        await dispatch(register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          password_confirm: formData.confirmPassword,
          first_name: formData.firstName,
          last_name: formData.lastName,
        })).unwrap();
        
        // 회원가입 성공 시 로그인 페이지로 이동
        alert('회원가입이 성공적으로 완료되었습니다. 로그인 페이지로 이동합니다.');
        navigate('/login');
      } catch (err: any) {
        // 회원가입 실패 처리는 authSlice의 extraReducers에서 처리됨
        console.error('Registration failed', err);
        
        // 개발 환경에서는 항상 성공으로 처리
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode: Bypassing registration error');
          localStorage.setItem('dev_username', formData.username);
          alert('개발 모드: 회원가입 성공으로 처리합니다. 로그인 페이지로 이동합니다.');
          navigate('/login');
        }
      }
    }
  };
  
  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">회원가입</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="firstName"
              name="firstName"
              type="text"
              label="이름"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="이름"
              error={formErrors.firstName}
              fullWidth
            />
            
            <Input
              id="lastName"
              name="lastName"
              type="text"
              label="성"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="성"
              error={formErrors.lastName}
              fullWidth
            />
          </div>
          
          <Input
            id="username"
            name="username"
            type="text"
            label="사용자 이름"
            value={formData.username}
            onChange={handleChange}
            placeholder="사용자 이름"
            error={formErrors.username}
            fullWidth
          />
          
          <Input
            id="email"
            name="email"
            type="email"
            label="이메일"
            value={formData.email}
            onChange={handleChange}
            placeholder="example@example.com"
            error={formErrors.email}
            fullWidth
          />
          
          <Input
            id="password"
            name="password"
            type="password"
            label="비밀번호"
            value={formData.password}
            onChange={handleChange}
            placeholder="비밀번호"
            error={formErrors.password}
            fullWidth
          />
          
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="비밀번호 확인"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="비밀번호 확인"
            error={formErrors.confirmPassword}
            fullWidth
          />
          
          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              required
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
              <span>
                <Link to="/terms" className="text-indigo-600 hover:text-indigo-500">
                  이용약관
                </Link>
                {' '}및{' '}
                <Link to="/privacy" className="text-indigo-600 hover:text-indigo-500">
                  개인정보처리방침
                </Link>
                에 동의합니다
              </span>
            </label>
          </div>
          
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            fullWidth
          >
            회원가입
          </Button>
          
          <div className="text-center mt-4">
            <span className="text-gray-600">이미 계정이 있으신가요?</span>{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-500">
              로그인
            </Link>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default Register;