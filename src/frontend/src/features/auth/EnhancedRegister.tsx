import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Layout from '../../components/common/Layout';
import { 
  sendVerificationEmail, 
  verifyEmailCode, 
  validateEmailDomain, 
  formatPhoneNumber,
  validatePasswordStrength,
  setVerificationPopupListener,
  removeVerificationPopupListener,
  VerificationPopupEvent
} from '../../utils/emailService';
import VerificationCodeModal from '../../components/common/VerificationCodeModal';

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'student' | 'instructor';
}

interface FormErrors {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  verification: string;
}

const EnhancedRegister: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    verification: '',
  });

  const [emailDuplicateCheck, setEmailDuplicateCheck] = useState<{
    checked: boolean;
    isAvailable: boolean;
    message: string;
  }>({
    checked: false,
    isAvailable: false,
    message: '',
  });

  const [emailVerification, setEmailVerification] = useState<{
    sent: boolean;
    code: string;
    inputCode: string;
    verified: boolean;
    expiresAt: Date | null;
  }>({
    sent: false,
    code: '',
    inputCode: '',
    verified: false,
    expiresAt: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  // 인증번호 팝업 상태
  const [verificationPopup, setVerificationPopup] = useState<{
    isOpen: boolean;
    email: string;
    code: string;
  }>({
    isOpen: false,
    email: '',
    code: '',
  });

  // 카운트다운 타이머
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // 인증번호 팝업 이벤트 리스너 설정
  useEffect(() => {
    const handleVerificationPopup = (event: VerificationPopupEvent) => {
      if (event.showPopup) {
        setVerificationPopup({
          isOpen: true,
          email: event.email,
          code: event.code,
        });
      }
    };

    setVerificationPopupListener(handleVerificationPopup);

    return () => {
      removeVerificationPopupListener();
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // 전화번호 포맷팅
    if (name === 'phone') {
      const formattedPhone = formatPhoneNumber(value);
      setFormData(prev => ({ ...prev, [name]: formattedPhone }));
    } else if (name === 'role') {
      setFormData(prev => ({ ...prev, [name]: value as 'student' | 'instructor' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // 이메일이 변경되면 중복확인 상태 초기화
    if (name === 'email') {
      setEmailDuplicateCheck({
        checked: false,
        isAvailable: false,
        message: '',
      });
      setEmailVerification({
        sent: false,
        code: '',
        inputCode: '',
        verified: false,
        expiresAt: null,
      });
    }
  };

  // 이메일 유효성 검증
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && validateEmailDomain(email);
  };

  // 전화번호 유효성 검증
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^(010|011|016|017|018|019)-?\d{3,4}-?\d{4}$/;
    return phoneRegex.test(phone.replace(/[^0-9]/g, ''));
  };

  // 이메일 중복 확인 (실제 계정 생성 없이)
  const checkEmailDuplicate = async () => {
    if (!formData.email) {
      setFormErrors(prev => ({ ...prev, email: '이메일을 입력해주세요' }));
      return;
    }

    if (!validateEmail(formData.email)) {
      setFormErrors(prev => ({ ...prev, email: '유효한 이메일 주소를 입력해주세요 (gmail, naver, daum 등)' }));
      return;
    }

    console.log('🔍 이메일 중복 확인 시작:', formData.email);
    setIsLoading(true);
    
    try {
      // user_profiles 테이블에서 직접 조회 시도 (RLS가 비활성화되어 있으므로 가능)
      console.log('🔍 user_profiles 테이블에서 이메일 확인 중...');
      
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, email')
        .eq('email', formData.email.toLowerCase())
        .limit(1);

      if (profileError) {
        console.warn('⚠️ user_profiles 조회 실패:', profileError.message);
        
        // RLS 오류 등으로 조회가 실패해도 진행 허용 (회원가입 시 실제 확인)
        setEmailDuplicateCheck({
          checked: true,
          isAvailable: true,
          message: '이메일을 확인했습니다 (제한적 확인)',
        });
        setFormErrors(prev => ({ ...prev, email: '' }));
        
        if (profileError.message.includes('infinite recursion') ||
            profileError.message.includes('policy')) {
          alert('현재 이메일 중복 확인에 제한이 있습니다.\n회원가입 시 정확한 중복 확인이 진행됩니다.');
        }
      } else if (profileData && profileData.length > 0) {
        // 이메일이 이미 존재
        console.log('❌ 이미 사용 중인 이메일:', formData.email);
        setEmailDuplicateCheck({
          checked: true,
          isAvailable: false,
          message: '이미 사용 중인 이메일입니다',
        });
        setFormErrors(prev => ({ ...prev, email: '이미 사용 중인 이메일입니다' }));
      } else {
        // 이메일 사용 가능
        console.log('✅ 사용 가능한 이메일:', formData.email);
        setEmailDuplicateCheck({
          checked: true,
          isAvailable: true,
          message: '사용 가능한 이메일입니다',
        });
        setFormErrors(prev => ({ ...prev, email: '' }));
      }
      
    } catch (error: any) {
      console.error('❌ 이메일 중복 확인 실패:', error);
      
      // 오류 발생 시에도 진행 허용 (회원가입 시 실제 확인)
      setEmailDuplicateCheck({
        checked: true,
        isAvailable: true,
        message: '이메일을 확인했습니다 (제한적 확인)',
      });
      setFormErrors(prev => ({ ...prev, email: '' }));
      
      console.warn('⚠️ 이메일 중복 확인 중 오류 발생, 회원가입 시 실제 확인 진행');
    }
    
    setIsLoading(false);
  };

  // 인증번호 발송
  const sendVerificationCode = async () => {
    if (!emailDuplicateCheck.isAvailable) {
      alert('먼저 이메일 중복확인을 완료해주세요');
      return;
    }

    setIsLoading(true);
    try {
      // 6자리 랜덤 인증번호 생성
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // 이메일 발송 서비스 호출 (사용자 이름 포함)
      const userName = `${formData.lastName} ${formData.firstName}`.trim() || '사용자';
      const result = await sendVerificationEmail(formData.email, verificationCode, userName);
      
      if (result.success) {
        setEmailVerification({
          sent: true,
          code: verificationCode,
          inputCode: '',
          verified: false,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5분 후 만료
        });

        setCountdown(300); // 5분 카운트다운
        
        alert('인증번호가 이메일로 발송되었습니다. 이메일을 확인해주세요.');
      } else {
        // 이메일 발송 실패 시 처리
        if (result.message.includes('EmailJS')) {
          alert('이메일 발송 서비스에 문제가 있습니다. 관리자에게 문의하세요.');
        } else {
          alert(`인증번호 발송 실패: ${result.message}`);
        }
        
        // 발송 실패 시에도 임시로 진행할 수 있도록 설정 (운영 환경에서는 제거 가능)
        console.warn('⚠️ 이메일 발송 실패, 임시 인증번호 설정');
        setEmailVerification({
          sent: true,
          code: verificationCode,
          inputCode: '',
          verified: false,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        });
        setCountdown(300);
      }
    } catch (error: any) {
      console.error('❌ 인증번호 발송 오류:', error);
      alert('인증번호 발송 중 오류가 발생했습니다. 네트워크 연결을 확인하고 다시 시도해주세요.');
    }
    setIsLoading(false);
  };

  // 인증번호 확인
  const verifyCode = () => {
    if (!emailVerification.inputCode) {
      setFormErrors(prev => ({ ...prev, verification: '인증번호를 입력해주세요' }));
      return;
    }

    // 이메일 서비스의 검증 함수 사용
    const result = verifyEmailCode(formData.email, emailVerification.inputCode);
    
    if (result.success) {
      setEmailVerification(prev => ({ ...prev, verified: true }));
      setFormErrors(prev => ({ ...prev, verification: '' }));
      alert(result.message);
    } else {
      setFormErrors(prev => ({ ...prev, verification: result.message }));
    }
  };

  // 폼 유효성 검증
  const validateForm = (): boolean => {
    let valid = true;
    const newErrors: FormErrors = {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      verification: '',
    };

    // 이름 검증
    if (!formData.firstName.trim()) {
      newErrors.firstName = '이름을 입력해주세요';
      valid = false;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = '성을 입력해주세요';
      valid = false;
    }

    // 전화번호 검증
    if (!formData.phone.trim()) {
      newErrors.phone = '전화번호를 입력해주세요';
      valid = false;
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)';
      valid = false;
    }

    // 이메일 검증
    if (!emailDuplicateCheck.checked || !emailDuplicateCheck.isAvailable) {
      newErrors.email = '이메일 중복확인을 완료해주세요';
      valid = false;
    }

    if (!emailVerification.verified) {
      newErrors.verification = '이메일 인증을 완료해주세요';
      valid = false;
    }

    // 비밀번호 검증
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
      valid = false;
    } else {
      const passwordValidation = validatePasswordStrength(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.message;
        valid = false;
      }
    }

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
      valid = false;
    }

    setFormErrors(newErrors);
    return valid;
  };

  // 회원가입 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      console.log('🔄 회원가입 시작:', {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: formData.role,
      });

      // Supabase Auth 회원가입
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            role: formData.role,
          }
        }
      });

      if (error) {
        console.error('❌ Supabase Auth 회원가입 실패:', error);
        
        // 구체적인 에러 메시지 처리
        let errorMessage = '회원가입에 실패했습니다.';
        
        if (error.message.includes('User already registered')) {
          errorMessage = '이미 등록된 이메일 주소입니다. 로그인을 시도해보세요.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = '유효하지 않은 이메일 주소입니다.';
        } else if (error.message.includes('Password')) {
          errorMessage = '비밀번호가 요구사항을 만족하지 않습니다. (최소 6자 이상)';
        } else if (error.message.includes('Signup is disabled')) {
          errorMessage = '현재 회원가입이 비활성화되어 있습니다. 관리자에게 문의하세요.';
        } else {
          errorMessage += `\n상세 오류: ${error.message}`;
        }
        
        alert(errorMessage);
        return;
      }

      console.log('✅ Supabase Auth 회원가입 성공:', data);
      
      // user_profiles 테이블에 프로필 데이터 저장
      if (data.user) {
        try {
          console.log('🔄 사용자 프로필 생성 중...');
          console.log('📋 프로필 데이터:', {
            id: data.user.id,
            email: formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: formData.role,
            phone_number: formData.phone
          });
          
          // 먼저 이미 프로필이 존재하는지 확인
          const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', data.user.id)
            .single();
          
          if (existingProfile) {
            console.log('ℹ️ 이미 프로필이 존재합니다. 업데이트를 시도합니다.');
            
            // 기존 프로필 업데이트
            const { error: updateError } = await supabase
              .from('user_profiles')
              .update({
                email: formData.email.toLowerCase(),
                first_name: formData.firstName?.trim() || null,
                last_name: formData.lastName?.trim() || null,
                role: formData.role,
                phone_number: formData.phone?.trim() || null,
                is_active: true,
                updated_at: new Date().toISOString()
              })
              .eq('id', data.user.id);
            
            if (updateError) {
              throw updateError;
            }
            console.log('✅ 기존 프로필 업데이트 성공');
          } else {
            // 새 프로필 생성
            const { error: insertError } = await supabase
              .from('user_profiles')
              .insert({
                id: data.user.id,
                email: formData.email.toLowerCase(),
                first_name: formData.firstName?.trim() || null,
                last_name: formData.lastName?.trim() || null,
                role: formData.role,
                phone_number: formData.phone?.trim() || null,
                is_active: true
              });
            
            if (insertError) {
              throw insertError;
            }
            console.log('✅ 새 프로필 생성 성공');
          }
        } catch (profileError: any) {
          console.error('❌ 사용자 프로필 처리 실패:', profileError);
          console.error('❌ 프로필 오류 상세:', {
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint
          });
          
          // 프로필 생성 실패 시에도 회원가입은 성공했으므로 사용자에게 알림
          let errorMsg = profileError.message || '알 수 없는 오류';
          if (profileError.code) {
            errorMsg += ` (코드: ${profileError.code})`;
          }
          
          alert(`회원가입은 성공했지만 프로필 생성 중 오류가 발생했습니다.\n\n오류: ${errorMsg}\n\n로그인 후 프로필을 다시 설정해주세요.`);
        }
        
        // 회원가입 성공 메시지
        let successMessage = `회원가입이 완료되었습니다!\n\n` +
          `이메일: ${formData.email}\n` +
          `역할: ${formData.role === 'student' ? '학생' : '강사'}\n` +
          `이름: ${formData.lastName} ${formData.firstName}\n`;
        
        if (data.user.email_confirmed_at) {
          // 이메일이 이미 확인된 경우 (즉시 로그인 가능)
          successMessage += `\n바로 로그인하실 수 있습니다.`;
        } else {
          // 이메일 확인이 필요한 경우
          successMessage += `\n이메일로 발송된 확인 링크를 클릭한 후 로그인하세요.`;
        }
        
        alert(successMessage);
        navigate('/login');
      } else {
        console.warn('⚠️ 회원가입 응답에 사용자 데이터가 없음');
        alert('회원가입 요청이 처리되었습니다. 이메일을 확인한 후 로그인을 시도해보세요.');
        navigate('/login');
      }

    } catch (error: any) {
      console.error('❌ 회원가입 중 예상치 못한 오류:', error);
      
      let errorMessage = '회원가입 중 오류가 발생했습니다.';
      if (error.message) {
        errorMessage += `\n오류 내용: ${error.message}`;
      }
      errorMessage += '\n\n잠시 후 다시 시도해주세요.';
      
      alert(errorMessage);
    }
    setIsLoading(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">회원가입</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이름 */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="lastName"
              name="lastName"
              type="text"
              label="성"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="홍"
              error={formErrors.lastName}
              required
            />
            <Input
              id="firstName"
              name="firstName"
              type="text"
              label="이름"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="길동"
              error={formErrors.firstName}
              required
            />
          </div>

          {/* 전화번호 */}
          <Input
            id="phone"
            name="phone"
            type="tel"
            label="전화번호"
            value={formData.phone}
            onChange={handleChange}
            placeholder="010-1234-5678"
            error={formErrors.phone}
            required
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
                    ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600'
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
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
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
                    ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600'
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
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
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

          {/* 이메일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일 *
            </label>
            <div className="flex gap-2">
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@gmail.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <Button
                type="button"
                onClick={checkEmailDuplicate}
                variant="secondary"
                isLoading={isLoading}
                disabled={!formData.email || emailDuplicateCheck.checked}
              >
                중복확인
              </Button>
            </div>
            {formErrors.email && (
              <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
            )}
            {emailDuplicateCheck.checked && (
              <p className={`text-sm mt-1 ${
                emailDuplicateCheck.isAvailable ? 'text-green-600' : 'text-red-600'
              }`}>
                {emailDuplicateCheck.message}
              </p>
            )}
          </div>

          {/* 이메일 인증 */}
          {emailDuplicateCheck.isAvailable && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일 인증 *
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={sendVerificationCode}
                    variant="secondary"
                    isLoading={isLoading}
                    disabled={emailVerification.sent && countdown > 0}
                  >
                    {emailVerification.sent 
                      ? countdown > 0 
                        ? `재발송 (${formatTime(countdown)})`
                        : '재발송'
                      : '인증번호 발송'
                    }
                  </Button>
                </div>
                
                {emailVerification.sent && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="인증번호 6자리"
                      value={emailVerification.inputCode}
                      onChange={(e) => setEmailVerification(prev => ({ 
                        ...prev, 
                        inputCode: e.target.value.replace(/\D/g, '').slice(0, 6)
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={6}
                    />
                    <Button
                      type="button"
                      onClick={verifyCode}
                      variant="primary"
                      disabled={emailVerification.verified || !emailVerification.inputCode}
                    >
                      {emailVerification.verified ? '인증완료' : '인증확인'}
                    </Button>
                  </div>
                )}
                
                {formErrors.verification && (
                  <p className="text-red-500 text-sm">{formErrors.verification}</p>
                )}
                
                {emailVerification.verified && (
                  <p className="text-green-600 text-sm">✅ 이메일 인증이 완료되었습니다</p>
                )}
              </div>
            </div>
          )}

          {/* 비밀번호 */}
          <Input
            id="password"
            name="password"
            type="password"
            label="비밀번호"
            value={formData.password}
            onChange={handleChange}
            placeholder="영문 대소문자, 숫자 포함 8자 이상"
            error={formErrors.password}
            required
          />

          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="비밀번호 확인"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="비밀번호 재입력"
            error={formErrors.confirmPassword}
            required
          />

          {/* 약관 동의 */}
          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              required
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
              <Link to="/terms" className="text-blue-600 hover:text-blue-500">
                이용약관
              </Link>
              {' '}및{' '}
              <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
                개인정보처리방침
              </Link>
              에 동의합니다 *
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            fullWidth
            disabled={!emailVerification.verified}
          >
            회원가입
          </Button>

          <div className="text-center mt-4">
            <span className="text-gray-600">이미 계정이 있으신가요?</span>{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-500">
              로그인
            </Link>
          </div>
        </form>
      </div>

      {/* 인증번호 팝업 모달 */}
      <VerificationCodeModal
        isOpen={verificationPopup.isOpen}
        onClose={() => setVerificationPopup(prev => ({ ...prev, isOpen: false }))}
        email={verificationPopup.email}
        verificationCode={verificationPopup.code}
        onCopyCode={() => {
          // 인증번호 입력 필드에 자동으로 채우기
          setEmailVerification(prev => ({
            ...prev,
            inputCode: verificationPopup.code
          }));
        }}
      />
    </Layout>
  );
};

export default EnhancedRegister;