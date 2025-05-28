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
          
          {/* 역할 선택 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              가입 유형을 선택해주세요 *
            </label>
            
            <div className="space-y-3">
              {/* 학생 선택 */}
              <div
                className={`relative flex cursor-pointer rounded-lg border p-4 transition-all ${
                  formData.role === 'student'
                    ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600'
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
                    <span className="text-2xl mr-2">🎓</span>
                    <label htmlFor="role-student" className="text-base font-medium text-gray-900 cursor-pointer">
                      학생으로 가입
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    강의를 수강하고 학습할 수 있습니다. 개인정보 수정 권한을 가집니다.
                  </p>
                </div>
              </div>

              {/* 강사 선택 */}
              <div
                className={`relative flex cursor-pointer rounded-lg border p-4 transition-all ${
                  formData.role === 'instructor'
                    ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600'
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
                    <span className="text-2xl mr-2">👨‍🏫</span>
                    <label htmlFor="role-instructor" className="text-base font-medium text-gray-900 cursor-pointer">
                      강사로 가입
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    강의를 생성하고 수강생을 관리할 수 있습니다. (수강생 이름, 이메일만 조회 가능)
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* 추가 정보 섹션 */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">선택 정보</h3>
            <p className="text-sm text-gray-600 mb-4">아래 정보는 선택사항이며, 나중에 프로필에서 수정할 수 있습니다.</p>
            
            <div className="space-y-4">
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                label="전화번호"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="010-1234-5678"
                error={formErrors.phoneNumber}
                fullWidth
              />
              
              <Input
                id="address"
                name="address"
                type="text"
                label="주소"
                value={formData.address}
                onChange={handleChange}
                placeholder="서울시 강남구..."
                fullWidth
              />
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  id="organization"
                  name="organization"
                  type="text"
                  label="소속 기관"
                  value={formData.organization}
                  onChange={handleChange}
                  placeholder="회사명 또는 학교명"
                  fullWidth
                />
                
                <Input
                  id="jobTitle"
                  name="jobTitle"
                  type="text"
                  label="직책"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  placeholder="개발자, 학생 등"
                  fullWidth
                />
              </div>
              
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  자기소개
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="간단한 자기소개를 입력해주세요..."
                />
              </div>
            </div>
          </div>
          
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