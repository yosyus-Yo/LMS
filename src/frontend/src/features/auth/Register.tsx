import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { register, clearError } from './authSlice';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Layout from '../../components/common/Layout';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'student' as 'student' | 'instructor' | 'admin',
    phoneNumber: '',
    address: '',
    organization: '',
    jobTitle: '',
    bio: '',
  });
  
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
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
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'role' ? value as 'student' | 'instructor' | 'admin' : value,
    });
  };
  
  const validateForm = (): boolean => {
    let valid = true;
    const newErrors = {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
    };
    
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
    
    // 전화번호 검증 (선택사항)
    if (formData.phoneNumber && !/^[0-9-+\s()]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = '올바른 전화번호 형식이 아닙니다';
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
          email: formData.email,
          password: '***HIDDEN***',
          first_name: formData.firstName,
          last_name: formData.lastName,
        });
        
        await dispatch(register({
          email: formData.email,
          password: formData.password,
          password_confirm: formData.confirmPassword,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: formData.role,
          phone_number: formData.phoneNumber,
          address: formData.address,
          organization: formData.organization,
          job_title: formData.jobTitle,
          bio: formData.bio,
        })).unwrap();
        
        // 회원가입 성공 시 로그인 페이지로 이동
        alert('회원가입이 성공적으로 완료되었습니다. 로그인 페이지로 이동합니다.');
        navigate('/login');
      } catch (err: any) {
        console.error('Registration failed', err);
        // 에러 처리는 authSlice의 extraReducers에서 처리됨
        // 이메일 중복 등의 에러 메시지가 Redux store의 error 상태에 저장되어 UI에 표시됨
      }
    }
  };
  
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm space-y-6">
          {/* 로고와 제목 */}
          <div className="text-center">
            <div className="text-4xl mb-4">✨</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">회원가입</h1>
            <p className="text-gray-600">AI-LMS에 참여하세요</p>
          </div>
          
          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          {/* 회원가입 폼 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 이름 입력 */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  label="👤 이름"
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
                  label="👤 성"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="성"
                  error={formErrors.lastName}
                  fullWidth
                />
              </div>
              
              <Input
                id="email"
                name="email"
                type="email"
                label="📧 이메일"
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
                label="🔒 비밀번호"
                value={formData.password}
                onChange={handleChange}
                placeholder="최소 6자 이상"
                error={formErrors.password}
                fullWidth
              />
              
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                label="🔒 비밀번호 확인"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="비밀번호를 다시 입력하세요"
                error={formErrors.confirmPassword}
                fullWidth
              />
              
              {/* 역할 선택 - 모바일 최적화 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  🎯 가입 유형을 선택해주세요
                </label>
                
                <div className="space-y-3">
                  {/* 학생 선택 */}
                  <div
                    className={`relative flex cursor-pointer rounded-lg border p-3 transition-all ${
                      formData.role === 'student'
                        ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                        : 'border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => setFormData({ ...formData, role: 'student' })}
                  >
                    <div className="flex h-5 items-center">
                      <input
                        id="role-student"
                        name="role"
                        type="radio"
                        value="student"
                        checked={formData.role === 'student'}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">🎓</span>
                        <label htmlFor="role-student" className="text-sm font-medium text-gray-900 cursor-pointer">
                          학생으로 가입
                        </label>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        강의를 수강하고 학습할 수 있습니다
                      </p>
                    </div>
                  </div>

                  {/* 강사 선택 */}
                  <div
                    className={`relative flex cursor-pointer rounded-lg border p-3 transition-all ${
                      formData.role === 'instructor'
                        ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                        : 'border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => setFormData({ ...formData, role: 'instructor' })}
                  >
                    <div className="flex h-5 items-center">
                      <input
                        id="role-instructor"
                        name="role"
                        type="radio"
                        value="instructor"
                        checked={formData.role === 'instructor'}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">👨‍🏫</span>
                        <label htmlFor="role-instructor" className="text-sm font-medium text-gray-900 cursor-pointer">
                          강사로 가입
                        </label>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        강의를 생성하고 수강생을 관리할 수 있습니다
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 회원가입 버튼 */}
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="w-full py-3 text-lg font-medium"
              >
                {isLoading ? '회원가입 중...' : '🎉 회원가입 완료'}
              </Button>
            </form>
          </div>
          
          {/* 로그인 링크 */}
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">이미 계정이 있으신가요?</div>
            <Link 
              to="/login" 
              className="inline-block w-full py-3 px-4 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              🔑 로그인하기
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Register;