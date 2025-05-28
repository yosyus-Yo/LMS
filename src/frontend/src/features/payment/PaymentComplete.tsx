import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../../app/store';
import paymentService from '../../services/paymentService';

interface PaymentResult {
  success: boolean;
  message: string;
  orderId?: string;
  amount?: number;
  subscription?: {
    plan_name: string;
    valid_until: string;
  };
}

const PaymentComplete: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // URL 파라미터에서 나이스페이 결제 결과 정보 추출
        const resultCode = searchParams.get('resultCode');
        const resultMsg = searchParams.get('resultMsg');
        const tid = searchParams.get('tid');
        const orderId = searchParams.get('orderId');
        const amount = searchParams.get('amount');
        const payMethod = searchParams.get('payMethod');
        const mallReserved = searchParams.get('mallReserved');

        if (resultCode === '0000') {
          // 결제 성공
          const paymentResult = {
            success: true,
            paymentId: tid || undefined,
            orderId: orderId || undefined,
            amount: amount ? parseInt(amount) : 0,
            method: payMethod || undefined,
            data: {
              mallReserved,
              tid,
              resultCode,
              resultMsg
            }
          };

          const isCompleted = await paymentService.completePayment(paymentResult);
          
          if (isCompleted) {
            setResult({
              success: true,
              message: '결제가 성공적으로 완료되었습니다.',
              orderId: orderId || undefined,
              amount: paymentResult.amount
            });

            // 결제 타입에 따라 리다이렉트 설정
            const parsedMallReserved = mallReserved ? JSON.parse(mallReserved) : {};
            
            setTimeout(() => {
              if (parsedMallReserved.paymentType === 'course') {
                navigate(`/courses/${parsedMallReserved.courseId}`);
              } else if (parsedMallReserved.paymentType === 'subscription') {
                navigate('/dashboard');
              } else {
                navigate('/dashboard');
              }
            }, 3000);
          } else {
            throw new Error('결제 완료 처리 중 오류가 발생했습니다.');
          }
        } else {
          // 결제 실패
          setResult({
            success: false,
            message: resultMsg || '결제가 실패했습니다.',
            orderId: orderId || undefined
          });

          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        }
      } catch (error: any) {
        console.error('Payment verification error:', error);
        setResult({
          success: false,
          message: error.message || '결제 검증 중 오류가 발생했습니다.'
        });

        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">결제 처리 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        {result?.success ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">결제 완료</h2>
            <p className="text-gray-600 mb-4">{result.message}</p>
            {result.subscription && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600">구독 플랜</p>
                <p className="font-semibold">{result.subscription.plan_name}</p>
                <p className="text-sm text-gray-600 mt-2">유효기간</p>
                <p className="font-semibold">{new Date(result.subscription.valid_until).toLocaleDateString()}</p>
              </div>
            )}
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              대시보드로 가기
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">결제 실패</h2>
            <p className="text-gray-600 mb-4">{result?.message}</p>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/subscription')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                다시 시도
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
              >
                대시보드로 가기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentComplete;