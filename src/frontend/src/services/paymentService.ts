import { supabase } from '../lib/supabase';

// 나이스페이 결제 관련 타입 정의
interface PaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  orderName: string;
  paymentType: 'subscription' | 'course' | 'one_time';
  subscriptionId?: string;
  courseId?: string;
  couponCode?: string;
  returnUrl: string;
  cancelUrl: string;
}

interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  amount?: number;
  method?: string;
  error?: string;
  data?: any;
}

// 나이스페이 설정
const NICEPAY_CONFIG = {
  clientId: process.env.REACT_APP_NICEPAY_CLIENT_ID || '',
  mode: process.env.REACT_APP_NICEPAY_MODE || 'development', // development | production
  apiUrl: process.env.REACT_APP_NICEPAY_MODE === 'production' 
    ? 'https://api.nicepay.co.kr' 
    : 'https://sandbox-api.nicepay.co.kr'
};

class PaymentService {
  private static instance: PaymentService;
  
  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  // 결제 요청 생성
  async createPaymentRequest(request: PaymentRequest): Promise<{ orderId: string; paymentData: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Supabase에 결제 레코드 생성
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          payment_type: request.paymentType,
          amount: request.amount,
          currency: request.currency,
          order_id: request.orderId,
          status: 'pending',
          subscription_id: request.subscriptionId,
          course_id: request.courseId
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to create payment record: ${error.message}`);
      }

      // 나이스페이 결제 데이터 구성
      const paymentData = {
        clientId: NICEPAY_CONFIG.clientId,
        method: 'card', // 기본 카드 결제
        orderId: request.orderId,
        amount: request.amount,
        goodsName: request.orderName,
        returnUrl: request.returnUrl,
        cancelUrl: request.cancelUrl,
        mallReserved: JSON.stringify({
          userId: user.id,
          paymentType: request.paymentType,
          subscriptionId: request.subscriptionId,
          courseId: request.courseId
        })
      };

      return {
        orderId: request.orderId,
        paymentData
      };
    } catch (error: any) {
      console.error('Payment request creation failed:', error);
      throw error;
    }
  }

  // 나이스페이 결제창 호출
  async openPaymentWindow(paymentData: any): Promise<PaymentResult> {
    return new Promise((resolve) => {
      // 나이스페이 JavaScript SDK 사용
      // @ts-ignore
      if (typeof AUTHNICE !== 'undefined') {
        // @ts-ignore
        AUTHNICE.requestPay({
          clientId: paymentData.clientId,
          method: paymentData.method,
          orderId: paymentData.orderId,
          amount: paymentData.amount,
          goodsName: paymentData.goodsName,
          returnUrl: paymentData.returnUrl,
          cancelUrl: paymentData.cancelUrl,
          mallReserved: paymentData.mallReserved,
          fnError: (result: any) => {
            console.error('Payment failed:', result);
            resolve({
              success: false,
              error: result.resultMsg || 'Payment failed',
              data: result
            });
          }
        }, (result: any) => {
          if (result.resultCode === '0000') {
            resolve({
              success: true,
              paymentId: result.tid,
              orderId: result.orderId,
              amount: result.amount,
              method: result.payMethod,
              data: result
            });
          } else {
            resolve({
              success: false,
              error: result.resultMsg || 'Payment failed',
              data: result
            });
          }
        });
      } else {
        resolve({
          success: false,
          error: 'Payment system not available'
        });
      }
    });
  }

  // 결제 완료 처리
  async completePayment(paymentResult: PaymentResult): Promise<boolean> {
    try {
      if (!paymentResult.success || !paymentResult.paymentId) {
        throw new Error('Invalid payment result');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Supabase 결제 레코드 업데이트
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          pg_tid: paymentResult.paymentId,
          completed_at: new Date().toISOString()
        })
        .eq('order_id', paymentResult.orderId);
      
      if (error) {
        throw new Error(`Failed to update payment record: ${error.message}`);
      }

      // 결제 타입에 따른 후속 처리
      const mallReserved = JSON.parse(paymentResult.data?.mallReserved || '{}');
      
      if (mallReserved.paymentType === 'course' && mallReserved.courseId) {
        // 코스 수강등록
        await supabase
          .from('enrollments')
          .insert({
            user_id: user.id,
            course_id: mallReserved.courseId,
            status: 'active'
          });
      }
      
      if (mallReserved.paymentType === 'subscription' && mallReserved.subscriptionId) {
        // 구독 활성화 로직 구현
        // TODO: 구독 서비스와 연동
      }

      return true;
    } catch (error: any) {
      console.error('Payment completion failed:', error);
      return false;
    }
  }

  // 구독 결제
  async subscribeWithPayment(planId: string, couponCode?: string): Promise<PaymentResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // 구독 플랜 정보 조회
      const { data: plans } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();
      const plan = plans;
      
      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      let finalAmount = plan.price;
      
      // 쿠폰 적용
      if (couponCode) {
        // TODO: 쿠폰 검증 및 할인 적용 로직
      }

      const orderId = `SUB_${Date.now()}_${user.id}`;
      
      const paymentRequest: PaymentRequest = {
        amount: finalAmount,
        currency: 'KRW',
        orderId,
        orderName: `${plan.name} 구독`,
        paymentType: 'subscription',
        subscriptionId: planId,
        returnUrl: `${window.location.origin}/payment/complete`,
        cancelUrl: `${window.location.origin}/subscription`
      };

      const { paymentData } = await this.createPaymentRequest(paymentRequest);
      return await this.openPaymentWindow(paymentData);
    } catch (error: any) {
      console.error('Subscription payment failed:', error);
      return {
        success: false,
        error: error.message || 'Subscription payment failed'
      };
    }
  }

  // 코스 구매
  async purchaseCourse(courseId: string, couponCode?: string): Promise<PaymentResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // 코스 정보 조회
      const { data: course } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (!course) {
        throw new Error('Course not found');
      }

      if (course.is_free) {
        // 무료 코스인 경우 바로 수강등록
        await supabase
          .from('enrollments')
          .insert({
            user_id: user.id,
            course_id: courseId,
            status: 'active'
          });
        return {
          success: true,
          orderId: `FREE_${Date.now()}`,
          amount: 0
        };
      }

      let finalAmount = course.price;
      
      // 쿠폰 적용
      if (couponCode) {
        // TODO: 쿠폰 검증 및 할인 적용 로직
      }

      const orderId = `COURSE_${Date.now()}_${user.id}`;
      
      const paymentRequest: PaymentRequest = {
        amount: finalAmount,
        currency: 'KRW',
        orderId,
        orderName: course.title,
        paymentType: 'course',
        courseId,
        returnUrl: `${window.location.origin}/payment/complete`,
        cancelUrl: `${window.location.origin}/courses/${courseId}`
      };

      const { paymentData } = await this.createPaymentRequest(paymentRequest);
      return await this.openPaymentWindow(paymentData);
    } catch (error: any) {
      console.error('Course purchase failed:', error);
      return {
        success: false,
        error: error.message || 'Course purchase failed'
      };
    }
  }

  // 결제 내역 조회
  async getPaymentHistory(userId?: string): Promise<any[]> {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const user = userId || currentUser?.id;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // TODO: Supabase에서 결제 내역 조회 구현 필요
      console.log('Payment history fetch temporarily disabled for migration');
      return [];
    } catch (error: any) {
      console.error('Failed to fetch payment history:', error);
      return [];
    }
  }

  // 환불 요청
  async requestRefund(paymentId: string, reason: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // TODO: 환불 로직 구현
      // 1. 결제 정보 조회
      // 2. 환불 가능 여부 확인
      // 3. 나이스페이 환불 API 호출
      // 4. Supabase 결제 레코드 업데이트

      console.log(`Refund requested for payment ${paymentId}: ${reason}`);
      return true;
    } catch (error: any) {
      console.error('Refund request failed:', error);
      return false;
    }
  }
}

// 나이스페이 JavaScript SDK 로드
export const loadNicePaySDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.getElementById('nicepay-sdk')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = 'nicepay-sdk';
    script.src = NICEPAY_CONFIG.mode === 'production'
      ? 'https://pay.nicepay.co.kr/v1/js/'
      : 'https://pay.nicepay.co.kr/v1/js/';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load NicePay SDK'));
    document.head.appendChild(script);
  });
};

export default PaymentService.getInstance();