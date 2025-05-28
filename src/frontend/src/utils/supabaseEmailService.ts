// Supabase 이메일 서비스
export const sendVerificationEmailSupabase = async (
  email: string,
  userName: string,
  verificationCode: string
): Promise<{ success: boolean; message: string }> => {
  // Supabase Edge Functions를 통한 이메일 발송
  // 실제 구현은 Supabase Edge Functions에서 처리
  console.log('📧 Supabase Email Service (placeholder)');
  console.log(`받는 사람: ${email}`);
  console.log(`사용자명: ${userName}`);
  console.log(`인증번호: ${verificationCode}`);
  
  // 시뮬레이션으로 대체
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    message: 'Supabase를 통해 인증번호가 발송되었습니다. (시뮬레이션)'
  };
};