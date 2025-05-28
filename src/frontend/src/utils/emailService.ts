// 통합 이메일 서비스
import { sendVerificationEmailJS, checkEmailJSConfig } from './emailjsService';
import { sendVerificationEmailSupabase } from './supabaseEmailService';

// 개발용 팝업 이벤트 타입
export interface VerificationPopupEvent {
  email: string;
  code: string;
  showPopup: boolean;
}

// 개발용 팝업 이벤트 리스너
let popupEventListener: ((event: VerificationPopupEvent) => void) | null = null;

export const setVerificationPopupListener = (listener: (event: VerificationPopupEvent) => void) => {
  popupEventListener = listener;
};

export const removeVerificationPopupListener = () => {
  popupEventListener = null;
};

interface EmailVerificationData {
  email: string;
  code: string;
  expiresAt: Date;
}

// 이메일 발송 방법 선택
type EmailMethod = 'simulation' | 'emailjs' | 'supabase' | 'external';

const EMAIL_METHOD: EmailMethod = (process.env.REACT_APP_EMAIL_METHOD as EmailMethod) || 'simulation';

// 통합 이메일 발송 함수
export const sendVerificationEmail = async (
  email: string, 
  verificationCode: string,
  userName: string = 'User'
): Promise<{ success: boolean; message: string }> => {
  console.log(`📧 이메일 발송 방법: ${EMAIL_METHOD}`);
  
  try {
    switch (EMAIL_METHOD) {
      case 'emailjs': {
        // EmailJS를 통한 실제 이메일 발송
        const config = checkEmailJSConfig();
        if (!config.isConfigured) {
          console.warn('EmailJS 설정이 완료되지 않았습니다. 시뮬레이션 모드로 전환합니다.');
          return await sendSimulatedEmail(email, verificationCode);
        }
        
        const result = await sendVerificationEmailJS(email, userName, verificationCode);
        
        // 개발환경에서는 백업으로 localStorage에도 저장
        if (process.env.NODE_ENV === 'development') {
          saveVerificationCode(email, verificationCode);
        }
        
        return result;
      }
      
      case 'supabase': {
        // Supabase Edge Functions를 통한 이메일 발송
        const result = await sendVerificationEmailSupabase(email, userName, verificationCode);
        
        // 개발환경에서는 백업으로 localStorage에도 저장
        if (process.env.NODE_ENV === 'development') {
          saveVerificationCode(email, verificationCode);
        }
        
        return result;
      }
      
      case 'external': {
        // 외부 API를 통한 이메일 발송 (향후 구현)
        return await sendExternalEmail(email, verificationCode, userName);
      }
      
      case 'simulation':
      default: {
        // 시뮬레이션 모드 (개발용)
        return await sendSimulatedEmail(email, verificationCode);
      }
    }
  } catch (error: any) {
    console.error('이메일 발송 실패:', error);
    
    // 실패시 시뮬레이션 모드로 폴백
    if (EMAIL_METHOD !== 'simulation') {
      console.log('실제 이메일 발송 실패. 시뮬레이션 모드로 전환합니다.');
      return await sendSimulatedEmail(email, verificationCode);
    }
    
    return {
      success: false,
      message: '이메일 발송에 실패했습니다. 다시 시도해주세요.'
    };
  }
};

// 시뮬레이션 이메일 발송
const sendSimulatedEmail = async (
  email: string, 
  verificationCode: string
): Promise<{ success: boolean; message: string }> => {
  console.log(`📧 [이메일 발송 시뮬레이션]`);
  console.log(`받는 사람: ${email}`);
  console.log(`인증번호: ${verificationCode}`);
  console.log(`발송 시간: ${new Date().toLocaleString()}`);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  saveVerificationCode(email, verificationCode);
  
  // 개발용 팝업 이벤트 발생
  if (popupEventListener) {
    popupEventListener({
      email,
      code: verificationCode,
      showPopup: true
    });
  }
  
  return {
    success: true,
    message: '인증번호가 성공적으로 발송되었습니다. (개발용 팝업으로 확인하세요)'
  };
};

// 외부 이메일 서비스 (SendGrid, AWS SES 등)
const sendExternalEmail = async (
  email: string, 
  verificationCode: string,
  userName: string
): Promise<{ success: boolean; message: string }> => {
  // 여기에 실제 외부 이메일 서비스 API 호출 구현
  // 예: SendGrid, AWS SES, Mailgun 등
  
  console.log('🚧 외부 이메일 서비스는 아직 구현되지 않았습니다.');
  return await sendSimulatedEmail(email, verificationCode);
};

// 인증번호 localStorage 저장
const saveVerificationCode = (email: string, code: string) => {
  const verificationData: EmailVerificationData = {
    email,
    code,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5분 후 만료
  };
  localStorage.setItem(`verification_${email}`, JSON.stringify(verificationData));
};

// 인증번호 검증 (개발환경용)
export const verifyEmailCode = (email: string, inputCode: string): {
  success: boolean;
  message: string;
} => {
  try {
    const stored = localStorage.getItem(`verification_${email}`);
    if (!stored) {
      return {
        success: false,
        message: '인증번호를 먼저 발송해주세요.'
      };
    }
    
    const verificationData: EmailVerificationData = JSON.parse(stored);
    
    // 만료 시간 확인
    if (new Date() > new Date(verificationData.expiresAt)) {
      localStorage.removeItem(`verification_${email}`);
      return {
        success: false,
        message: '인증번호가 만료되었습니다. 다시 발송해주세요.'
      };
    }
    
    // 인증번호 확인
    if (verificationData.code === inputCode) {
      localStorage.removeItem(`verification_${email}`);
      return {
        success: true,
        message: '이메일 인증이 완료되었습니다.'
      };
    } else {
      return {
        success: false,
        message: '인증번호가 일치하지 않습니다.'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: '인증번호 확인 중 오류가 발생했습니다.'
    };
  }
};

// 이메일 도메인 검증
export const validateEmailDomain = (email: string): boolean => {
  const allowedDomains = [
    'gmail.com',
    'naver.com', 
    'daum.net',
    'kakao.com',
    'yahoo.com',
    'outlook.com',
    'hotmail.com',
    'nate.com',
    'hanmail.net'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  return allowedDomains.includes(domain) || 
         domain?.endsWith('.co.kr') || 
         domain?.endsWith('.com') ||
         domain?.endsWith('.net') ||
         domain?.endsWith('.org');
};

// 전화번호 포맷팅
export const formatPhoneNumber = (phone: string): string => {
  const numbers = phone.replace(/[^0-9]/g, '');
  
  if (numbers.length === 11) {
    return numbers.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  } else if (numbers.length === 10) {
    return numbers.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  
  return phone;
};

// 비밀번호 강도 검사
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  message: string;
  strength: 'weak' | 'medium' | 'strong';
} => {
  if (password.length < 8) {
    return {
      isValid: false,
      message: '비밀번호는 최소 8자 이상이어야 합니다.',
      strength: 'weak'
    };
  }
  
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const criteriaCount = [hasLowerCase, hasUpperCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
  
  if (criteriaCount < 3) {
    return {
      isValid: false,
      message: '비밀번호는 대문자, 소문자, 숫자, 특수문자 중 최소 3가지를 포함해야 합니다.',
      strength: 'weak'
    };
  }
  
  if (criteriaCount === 3) {
    return {
      isValid: true,
      message: '보통 강도의 비밀번호입니다.',
      strength: 'medium'
    };
  }
  
  return {
    isValid: true,
    message: '강력한 비밀번호입니다.',
    strength: 'strong'
  };
};