import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../../app/store';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import apiClient from '../../api/apiClient';

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
}

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const courseId = searchParams.get('courseId');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        if (!courseId) {
          navigate('/courses');
          return;
        }

        const courseResponse = await apiClient.courses.getById(courseId);
        setCourse(courseResponse.data);
        
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

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* 성공 메시지 */}
            <div className="p-8 text-center border-b border-gray-200">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">결제가 완료되었습니다!</h1>
              <p className="text-gray-600">수강신청이 성공적으로 처리되었습니다.</p>
            </div>

            {/* 강의 정보 */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">수강 강의</h2>
              
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
                  <div className="text-lg font-bold text-green-600">
                    수강신청 완료
                  </div>
                </div>
              </div>
            </div>

            {/* 결제 정보 */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">결제 정보</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">결제 금액</span>
                  <span className="text-gray-900">₩{parseFloat(course.price).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">결제 방법</span>
                  <span className="text-gray-900">개발 모드</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">결제 일시</span>
                  <span className="text-gray-900">{new Date().toLocaleDateString('ko-KR')}</span>
                </div>
              </div>
            </div>

            {/* 안내 메시지 */}
            <div className="p-6 border-b border-gray-200">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-blue-800 mb-1">수강 안내</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• 이제 강의를 시청하실 수 있습니다.</li>
                      <li>• 대시보드에서 수강 중인 강의를 확인하세요.</li>
                      <li>• 강의는 언제든지 반복해서 시청 가능합니다.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="p-6">
              <div className="flex space-x-4">
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="secondary"
                  className="flex-1"
                >
                  대시보드로 이동
                </Button>
                <Button
                  onClick={() => navigate(`/courses/${courseId}/learn`)}
                  variant="primary"
                  className="flex-1"
                >
                  강의 시작하기
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentSuccess;