import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../app/store';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import apiClient from '../../api/apiClient';

interface Certificate {
  id: string;
  certificate_number: string;
  issued_at: string;
  completion_date: string;
  final_score: number;
  total_study_hours: number;
  course_title: string;
  course_description: string;
  instructor_first_name: string;
  instructor_last_name: string;
}

const CertificateList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCertificates();
    }
  }, [user]);

  const fetchCertificates = async () => {
    try {
      setIsLoading(true);
      const { data } = await apiClient.certificates.getUserCertificates();
      setCertificates(data || []);
    } catch (error) {
      console.error('수료증 조회 실패:', error);
      alert(error instanceof Error ? error.message : '수료증을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatStudyHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours}시간 ${remainingMinutes}분`;
    }
    return `${remainingMinutes}분`;
  };

  const handleDownloadCertificate = (certificateId: string) => {
    // PDF 다운로드 기능 구현 예정
    alert('PDF 다운로드 기능은 준비 중입니다.');
  };

  const handleViewCertificate = (certificateNumber: string) => {
    navigate(`/certificates/${certificateNumber}`);
  };

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-600 mb-4">수료증을 확인하려면 로그인해주세요.</p>
          <Button onClick={() => navigate('/login')} variant="primary">
            로그인하기
          </Button>
        </div>
      </Layout>
    );
  }

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
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">내 수료증</h1>
          <p className="text-gray-600">완료한 강의의 수료증을 확인하고 다운로드할 수 있습니다.</p>
        </div>

        {certificates.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">아직 수료증이 없습니다</h3>
            <p className="text-gray-600 mb-6">강의를 완료하면 자동으로 수료증이 발급됩니다.</p>
            <Button onClick={() => navigate('/courses')} variant="primary">
              강의 둘러보기
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {certificates.map((certificate) => (
              <div key={certificate.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                {/* 수료증 헤더 */}
                <div className="p-6 border-b bg-gradient-to-r from-indigo-50 to-blue-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                      ✅ 수료완료
                    </span>
                    <span className="text-sm text-gray-500">
                      {certificate.certificate_number}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {certificate.course_title}
                  </h3>
                  
                  <p className="text-sm text-gray-600">
                    강사: {certificate.instructor_first_name} {certificate.instructor_last_name}
                  </p>
                </div>

                {/* 수료증 정보 */}
                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">수료일</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(certificate.completion_date)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">최종 점수</span>
                      <span className="text-sm font-medium text-gray-900">
                        {certificate.final_score ? `${certificate.final_score.toFixed(1)}점` : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">총 학습시간</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatStudyHours(certificate.total_study_hours)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">발급일</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(certificate.issued_at)}
                      </span>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex space-x-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleViewCertificate(certificate.certificate_number)}
                      className="flex-1"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      보기
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownloadCertificate(certificate.id)}
                      className="flex-1"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      다운로드
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 수료증 검증 섹션 */}
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">수료증 검증</h2>
          <p className="text-gray-600 mb-4">
            수료증 번호를 입력하여 발급된 수료증의 진위를 확인할 수 있습니다.
          </p>
          
          <div className="flex space-x-3">
            <input
              type="text"
              placeholder="수료증 번호를 입력하세요 (예: CERT-2025-000001)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button variant="primary">
              검증하기
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CertificateList;