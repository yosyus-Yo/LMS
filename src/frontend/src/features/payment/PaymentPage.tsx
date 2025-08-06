import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../../app/store';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import apiClient from '../../api/apiClient';
import { supabase } from '../../lib/supabase';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  instructor: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
  };
  price: string;
  is_free: boolean;
  status: string;
}

const PaymentPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        if (!courseId) {
          throw new Error('Course ID is required');
        }

        const courseResponse = await apiClient.courses.getById(courseId);
        setCourse(courseResponse.data);
        
        // 무료 강의인 경우 결제 페이지에 올 이유가 없으므로 리디렉션
        if (courseResponse.data.is_free) {
          navigate(`/courses/${courseId}`);
          return;
        }
        
      } catch (error) {
        console.error('Error fetching course:', error);
        navigate('/courses');
      } finally {
        setIsLoading(false);
      }
    };

    if (!user) {
      navigate('/login');
      return;
    }

    fetchCourse();
  }, [courseId, user, navigate]);

  const handlePayment = async () => {
    if (!course || !user || !courseId) return;

    try {
      setIsProcessing(true);
      
      // 개발환경이므로 실제 결제는 하지 않고 바로 수강신청 처리
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          status: 'active',
          progress: 0,
          completed_chapters: [],
          enrollment_date: new Date().toISOString(),
          payment_amount: parseFloat(course.price),
          payment_status: 'completed',
          payment_method: 'development_mode'
        })
        .select()
        .single();
      
      if (enrollmentError) {
        let userMessage = '결제 처리 중 오류가 발생했습니다.';
        
        if (enrollmentError.code === '23505') {
          userMessage = '이미 수강신청된 강의입니다.';
        }
        
        throw new Error(userMessage);
      }
      
      // 결제 완료 페이지로 이동
      navigate(`/payment/success?courseId=${courseId}`);
      
    } catch (error) {
      console.error('Payment error:', error);
      let errorMessage = '결제 처리 중 오류가 발생했습니다.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
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

  if (!course) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">강의를 찾을 수 없습니다.</div>
        </div>
      </Layout>
    );
  }

  const instructorName = `${course.instructor.first_name || ''} ${course.instructor.last_name || ''}`.trim() || course.instructor.email;
  const price = parseFloat(course.price);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">결제하기</h1>
            <p className="text-gray-600">강의 수강을 위한 결제를 진행합니다.</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* 강의 정보 */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">주문 상품</h2>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <img
                    src={course.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=200&fit=crop"}
                    alt={course.title}
                    className="w-24 h-16 object-cover rounded-lg"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{course.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                  <p className="text-sm text-gray-500 mt-2">강사: {instructorName}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">
                    ₩{price.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* 결제 정보 */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">결제 정보</h2>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-yellow-800">
                    <strong>개발 환경:</strong> 실제 결제는 이루어지지 않습니다. 테스트 결제입니다.
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">상품 금액</span>
                  <span className="text-gray-900">₩{price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">할인 금액</span>
                  <span className="text-gray-900">₩0</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">총 결제금액</span>
                    <span className="text-xl font-bold text-indigo-600">₩{price.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 결제 방법 */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">결제 방법</h2>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span className="text-gray-700 font-medium">개발 모드 결제</span>
                </div>
                <p className="text-sm text-gray-500 mt-2 ml-9">
                  개발 환경에서는 실제 결제가 진행되지 않습니다.
                </p>
              </div>
            </div>

            {/* 결제 동의 및 버튼 */}
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="agree"
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    defaultChecked
                  />
                  <label htmlFor="agree" className="text-sm text-gray-700">
                    <span className="font-medium">결제 진행에 동의합니다.</span>
                    <span className="block text-gray-500 mt-1">
                      개발 환경에서는 실제 결제가 이루어지지 않으며, 수강신청만 처리됩니다.
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={() => navigate(`/courses/${courseId}`)}
                  variant="secondary"
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  variant="primary"
                  className="flex-1"
                >
                  {isProcessing ? '처리 중...' : `₩${price.toLocaleString()} 결제하기`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentPage;