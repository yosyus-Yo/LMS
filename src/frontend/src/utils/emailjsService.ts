import emailjs from '@emailjs/browser';

// EmailJS 설정
const EMAILJS_CONFIG = {
  serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID || 'your_service_id',
  templateId: process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'your_template_id',
  publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'your_public_key',
};

// EmailJS 초기화
emailjs.init(EMAILJS_CONFIG.publicKey);

interface EmailVerificationParams extends Record<string, unknown> {
  to_email: string;
  to_name: string;
  verification_code: string;
  company_name: string;
  expires_in: string;
}

interface WelcomeEmailParams extends Record<string, unknown> {
  to_email: string;
  to_name: string;
  company_name: string;
  login_url: string;
}

// 인증번호 이메일 발송
export const sendVerificationEmailJS = async (
  email: string,
  name: string,
  verificationCode: string
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('📧 EmailJS로 인증 이메일 발송 시작...');
    
    const templateParams: EmailVerificationParams = {
      to_email: email,
      to_name: name,
      verification_code: verificationCode,
      company_name: 'AI LMS',
      expires_in: '5분',
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );

    if (response.status === 200) {
      console.log('✅ EmailJS 이메일 발송 성공:', response);
      return {
        success: true,
        message: '인증번호가 이메일로 발송되었습니다.',
      };
    } else {
      throw new Error('이메일 발송 실패');
    }
  } catch (error: any) {
    console.error('❌ EmailJS 이메일 발송 실패:', error);
    return {
      success: false,
      message: `이메일 발송에 실패했습니다: ${error.text || error.message}`,
    };
  }
};

// 환영 이메일 발송
export const sendWelcomeEmailJS = async (
  email: string,
  name: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const templateParams: WelcomeEmailParams = {
      to_email: email,
      to_name: name,
      company_name: 'AI LMS',
      login_url: `${window.location.origin}/login`,
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      'welcome_template', // 환영 이메일용 별도 템플릿
      templateParams
    );

    if (response.status === 200) {
      return {
        success: true,
        message: '환영 이메일이 발송되었습니다.',
      };
    } else {
      throw new Error('환영 이메일 발송 실패');
    }
  } catch (error: any) {
    console.error('❌ 환영 이메일 발송 실패:', error);
    return {
      success: false,
      message: `환영 이메일 발송에 실패했습니다: ${error.text || error.message}`,
    };
  }
};

// EmailJS 설정 상태 확인
export const checkEmailJSConfig = (): {
  isConfigured: boolean;
  missingKeys: string[];
} => {
  const missingKeys: string[] = [];
  
  if (!EMAILJS_CONFIG.serviceId || EMAILJS_CONFIG.serviceId === 'your_service_id') {
    missingKeys.push('REACT_APP_EMAILJS_SERVICE_ID');
  }
  if (!EMAILJS_CONFIG.templateId || EMAILJS_CONFIG.templateId === 'your_template_id') {
    missingKeys.push('REACT_APP_EMAILJS_TEMPLATE_ID');
  }
  if (!EMAILJS_CONFIG.publicKey || EMAILJS_CONFIG.publicKey === 'your_public_key') {
    missingKeys.push('REACT_APP_EMAILJS_PUBLIC_KEY');
  }

  return {
    isConfigured: missingKeys.length === 0,
    missingKeys,
  };
};

// 이메일 템플릿 HTML (EmailJS 대시보드에서 사용)
export const EMAIL_TEMPLATES = {
  verification: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">{{company_name}}</h1>
        <p style="color: #f0f0f0; margin: 10px 0 0 0;">이메일 인증</p>
      </div>
      
      <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">안녕하세요, {{to_name}}님!</h2>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
          회원가입을 완료하기 위해 아래 인증번호를 입력해주세요.
        </p>
        
        <div style="background: #f8f9fa; border: 2px dashed #dee2e6; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0;">
          <h3 style="color: #495057; margin: 0 0 10px 0;">인증번호</h3>
          <div style="font-size: 36px; font-weight: bold; color: #007bff; letter-spacing: 8px; font-family: 'Courier New', monospace;">
            {{verification_code}}
          </div>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          ⏰ 이 인증번호는 <strong>{{expires_in}}</strong> 후에 만료됩니다.<br>
          🔒 보안을 위해 인증번호를 다른 사람과 공유하지 마세요.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          본 이메일은 발신전용입니다. 문의사항이 있으시면 고객센터로 연락해주세요.
        </p>
      </div>
    </div>
  `,
  
  welcome: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">{{company_name}}에 오신 것을 환영합니다! 🎉</h1>
      </div>
      
      <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">{{to_name}}님, 환영합니다!</h2>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
          AI LMS 회원가입이 성공적으로 완료되었습니다. 이제 다양한 강의를 수강하실 수 있습니다.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{login_url}}" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
            지금 시작하기
          </a>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <h3 style="color: #495057; margin: 0 0 15px 0;">🚀 시작해보세요</h3>
          <ul style="color: #666; margin: 0; padding-left: 20px;">
            <li>다양한 AI 강의 둘러보기</li>
            <li>나만의 학습 계획 세우기</li>
            <li>커뮤니티에서 다른 학습자들과 소통하기</li>
          </ul>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          궁금한 점이 있으시면 언제든 고객센터로 문의해주세요.<br>
          즐거운 학습 되세요!
        </p>
      </div>
    </div>
  `
};