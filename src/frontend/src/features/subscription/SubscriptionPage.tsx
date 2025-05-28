import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import apiClient from '../../api/apiClient';
import { supabase } from '../../lib/supabase';
import paymentService from '../../services/paymentService';

interface SubscriptionPlan {
  id: number;
  name: string;
  plan_type: string;
  description: string;
  price: string;
  duration_days: number;
  max_courses: number | null;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

interface CurrentSubscription {
  id: number;
  plan: SubscriptionPlan;
  status: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  days_remaining: number;
  auto_renewal: boolean;
}

const SubscriptionPage: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // 구독 플랜 목록 조회
      const plansResponse = await apiClient.subscriptions.getPlans();
      setPlans(plansResponse.data || []);
      
      // 현재 구독 정보 조회
      try {
        const subscriptionResponse = await apiClient.subscriptions.getUserSubscription();
        if (subscriptionResponse.data.subscription) {
          setCurrentSubscription(subscriptionResponse.data);
        }
      } catch (error) {
        // 구독이 없는 경우 무시
        console.log('No active subscription');
      }
      
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (planId: number) => {
    try {
      setIsProcessing(true);
      setSelectedPlan(planId);
      
      // Supabase와 나이스페이를 통한 구독 결제
      const result = await paymentService.subscribeWithPayment(planId.toString());
      
      if (result.success) {
        alert('구독이 성공적으로 완료되었습니다!');
        fetchData(); // 데이터 새로고침
      } else {
        alert('결제 실패: ' + (result.error || '알 수 없는 오류'));
      }
      
    } catch (error: any) {
      console.error('Error creating subscription payment:', error);
      alert('결제 요청 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const openNicePayPayment = (paymentData: any) => {
    // NicePay JS SDK 로드 및 결제창 호출
    const loadNicePaySDK = () => {
      return new Promise<void>((resolve, reject) => {
        // 이미 로드된 경우
        if (window.AUTHNICE) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://pay.nicepay.co.kr/v1/js/';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('NicePay SDK 로드 실패'));
        document.head.appendChild(script);
      });
    };

    loadNicePaySDK()
      .then(() => {
        if (window.AUTHNICE) {
          window.AUTHNICE.requestPay({
            clientId: paymentData.clientId,
            method: paymentData.method,
            orderId: paymentData.orderId,
            amount: paymentData.amount,
            goodsName: paymentData.goodsName,
            returnUrl: paymentData.returnUrl,
            mallUserId: paymentData.mallUserId,
            buyerName: paymentData.buyerName,
            buyerEmail: paymentData.buyerEmail,
            buyerTel: paymentData.buyerTel || '',
            useEscrow: paymentData.useEscrow,
            currency: paymentData.currency,
            locale: paymentData.locale,
            mallReserved: paymentData.mallReserved,
            fnError: function (result: any) {
              alert('결제 오류: ' + result.errorMsg);
              setIsProcessing(false);
              setSelectedPlan(null);
            }
          });
        } else {
          throw new Error('AUTHNICE 객체를 찾을 수 없습니다');
        }
      })
      .catch((error) => {
        console.error('NicePay SDK 로드 또는 결제 요청 실패:', error);
        
        // 테스트 환경에서는 시뮬레이션 결제 진행
        if (window.confirm('결제 SDK 로드에 실패했습니다.\n테스트 결제를 진행하시겠습니까?')) {
          handlePaymentComplete(paymentData.orderId, 'test_tid_' + Date.now());
        } else {
          setIsProcessing(false);
          setSelectedPlan(null);
        }
      });
  };

  const handlePaymentComplete = async (orderId: string, tid: string) => {
    try {
      // 결제 완료 처리는 PaymentComplete 컴포넌트에서 처리됨
      console.log('Payment completed - Order ID:', orderId, 'TID:', tid);
      alert('구독이 완료되었습니다!');
      fetchData(); // 데이터 새로고침
    } catch (error: any) {
      console.error('Error handling payment completion:', error);
      alert('결제 완료 처리 중 오류가 발생했습니다.');
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;
    
    if (!window.confirm('구독을 취소하시겠습니까?')) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('로그인이 필요합니다.');
        return;
      }

      // Supabase에서 구독 상태를 'cancelled'로 업데이트
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (error) {
        throw new Error('구독 취소 처리 중 오류가 발생했습니다.');
      }
      
      alert('구독이 취소되었습니다.');
      fetchData();
      
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      alert('구독 취소 중 오류가 발생했습니다: ' + error.message);
    }
  };

  const getPlanTypeLabel = (planType: string) => {
    const labels: Record<string, string> = {
      free: '무료',
      basic: '베이직',
      premium: '프리미엄',
      enterprise: '엔터프라이즈'
    };
    return labels[planType] || planType;
  };

  const getPlanColor = (planType: string) => {
    const colors: Record<string, string> = {
      free: 'border-gray-300',
      basic: 'border-blue-500',
      premium: 'border-purple-500',
      enterprise: 'border-gold-500'
    };
    return colors[planType] || 'border-gray-300';
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">구독 플랜</h1>
          <p className="text-xl text-gray-600">
            AI 기반 맞춤형 학습으로 더 효과적인 학습을 경험하세요
          </p>
        </div>

        {/* 현재 구독 정보 */}
        {currentSubscription && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  현재 구독: {currentSubscription.plan.name}
                </h3>
                <p className="text-blue-700">
                  {currentSubscription.is_active ? (
                    <>
                      {currentSubscription.days_remaining}일 남음 
                      (만료일: {new Date(currentSubscription.end_date).toLocaleDateString()})
                    </>
                  ) : (
                    '구독이 만료되었습니다'
                  )}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="secondary" 
                  onClick={handleCancelSubscription}
                  disabled={!currentSubscription.is_active}
                >
                  구독 취소
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 구독 플랜 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-lg border-2 ${getPlanColor(plan.plan_type)} ${
                plan.plan_type === 'premium' ? 'transform scale-105' : ''
              }`}
            >
              {plan.plan_type === 'premium' && (
                <div className="bg-purple-500 text-white text-center py-2 rounded-t-lg">
                  <span className="text-sm font-semibold">가장 인기</span>
                </div>
              )}
              
              <div className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    ₩{parseInt(plan.price).toLocaleString()}
                  </div>
                  <div className="text-gray-600">
                    {plan.duration_days}일
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                      </svg>
                      <span className="text-gray-600">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.max_courses && (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                      </svg>
                      <span className="text-gray-600">
                        최대 {plan.max_courses}개 강의 수강
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  variant={plan.plan_type === 'premium' ? 'primary' : 'secondary'}
                  fullWidth
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={
                    isProcessing || 
                    (currentSubscription?.plan.id === plan.id && currentSubscription.is_active) ||
                    plan.plan_type === 'free'
                  }
                >
                  {isProcessing && selectedPlan === plan.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      처리 중...
                    </div>
                  ) : currentSubscription?.plan.id === plan.id && currentSubscription.is_active ? (
                    '현재 플랜'
                  ) : plan.plan_type === 'free' ? (
                    '무료 플랜'
                  ) : (
                    '구독하기'
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* 구독 안내 */}
        <div className="mt-12 bg-gray-50 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            구독 혜택
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">AI 맞춤형 학습</h4>
              <p className="text-gray-600">개인의 학습 패턴을 분석하여 최적의 학습 경로를 제안합니다.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">24시간 AI 튜터</h4>
              <p className="text-gray-600">언제든지 질문하고 즉시 답변을 받을 수 있습니다.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">학습 분석</h4>
              <p className="text-gray-600">상세한 학습 데이터 분석으로 성장을 확인할 수 있습니다.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SubscriptionPage;