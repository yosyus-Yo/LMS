import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import apiClient from '../../api/apiClient';

interface Certificate {
  id: string;
  certificate_number: string;
  issued_at: string;
  completion_date: string;
  final_score?: number;
  total_study_hours: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  course_title: string;
  course_description?: string;
  instructor_first_name?: string;
  instructor_last_name?: string;
}

const CertificateDetail: React.FC = () => {
  const { certificateNumber } = useParams<{ certificateNumber: string }>();
  const navigate = useNavigate();
  
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (certificateNumber) {
      fetchCertificate();
    }
  }, [certificateNumber]);

  const fetchCertificate = async () => {
    if (!certificateNumber) return;

    try {
      setIsLoading(true);
      const { data } = await apiClient.certificates.getCertificateByNumber(certificateNumber);
      setCertificate(data);
    } catch (error) {
      console.error('수료증 조회 실패:', error);
      alert(error instanceof Error ? error.message : '수료증을 찾을 수 없습니다.');
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // PDF 다운로드 기능 구현 예정
    alert('PDF 다운로드 기능은 준비 중입니다.');
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

  if (!certificate) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="mb-4">
            <svg className="mx-auto h-24 w-24 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">수료증을 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-4">
            입력하신 수료증 번호가 올바르지 않거나 존재하지 않는 수료증입니다.
          </p>
          <Button onClick={() => navigate('/certificates')} variant="primary">
            수료증 목록으로 돌아가기
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8 print:hidden">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            뒤로 가기
          </button>
          
          <div className="flex space-x-3">
            <Button variant="secondary" onClick={handlePrint}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              인쇄
            </Button>
            <Button variant="primary" onClick={handleDownloadPDF}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF 다운로드
            </Button>
          </div>
        </div>

        {/* 수료증 */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-8 md:p-12 print:border-0 print:shadow-none">
          {/* 수료증 헤더 */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full mx-auto flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              수료증
            </h1>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
              Certificate of Completion
            </h2>
            
            <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-blue-600 mx-auto"></div>
          </div>

          {/* 수료자 정보 */}
          <div className="text-center mb-8">
            <p className="text-lg text-gray-600 mb-2">이 증서는 다음과 같이 수여됩니다</p>
            <p className="text-lg text-gray-600 mb-4">This certificate is awarded to</p>
            
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 border-b-2 border-gray-300 pb-2 inline-block">
              {certificate.first_name} {certificate.last_name}
            </h3>
          </div>

          {/* 강의 정보 */}
          <div className="text-center mb-8">
            <p className="text-lg text-gray-600 mb-2">다음 강의를 성공적으로 완료하였음을 증명합니다</p>
            <p className="text-lg text-gray-600 mb-6">for successfully completing the course</p>
            
            <h4 className="text-2xl md:text-3xl font-bold text-indigo-600 mb-4">
              {certificate.course_title}
            </h4>
            
            {certificate.course_description && (
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                {certificate.course_description}
              </p>
            )}
          </div>

          {/* 수료 정보 */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="text-center">
              <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                수료일 / Completion Date
              </h5>
              <p className="text-lg font-semibold text-gray-900">
                {formatDate(certificate.completion_date)}
              </p>
            </div>
            
            <div className="text-center">
              <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                최종 점수 / Final Score
              </h5>
              <p className="text-lg font-semibold text-gray-900">
                {certificate.final_score ? `${certificate.final_score.toFixed(1)}점` : 'N/A'}
              </p>
            </div>
            
            <div className="text-center">
              <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                총 학습시간 / Total Study Hours
              </h5>
              <p className="text-lg font-semibold text-gray-900">
                {formatStudyHours(certificate.total_study_hours)}
              </p>
            </div>
            
            <div className="text-center">
              <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                강사 / Instructor
              </h5>
              <p className="text-lg font-semibold text-gray-900">
                {certificate.instructor_first_name} {certificate.instructor_last_name}
              </p>
            </div>
          </div>

          {/* 서명 및 발급 정보 */}
          <div className="flex justify-between items-end mb-8">
            <div className="text-center">
              <div className="w-48 border-b border-gray-400 mb-2"></div>
              <p className="text-sm text-gray-600">강사 서명</p>
              <p className="text-sm text-gray-600">Instructor Signature</p>
            </div>
            
            <div className="text-center">
              <div className="w-48 border-b border-gray-400 mb-2"></div>
              <p className="text-sm text-gray-600">기관 인증</p>
              <p className="text-sm text-gray-600">Institution Verification</p>
            </div>
          </div>

          {/* 수료증 번호 및 발급일 */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <div>
                <p>수료증 번호: <span className="font-mono font-medium">{certificate.certificate_number}</span></p>
                <p>Certificate Number</p>
              </div>
              <div className="text-right">
                <p>발급일: {formatDate(certificate.issued_at)}</p>
                <p>Issue Date</p>
              </div>
            </div>
          </div>

          {/* QR 코드 영역 (향후 구현) */}
          <div className="text-center mt-6 print:hidden">
            <p className="text-xs text-gray-500">
              이 수료증은 디지털 서명되어 있으며, 온라인에서 진위를 확인할 수 있습니다.
            </p>
          </div>
        </div>

        {/* 검증 정보 */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6 print:hidden">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">수료증 검증 정보</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">수료자:</span>
              <span className="ml-2 text-gray-600">{certificate.first_name} {certificate.last_name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">이메일:</span>
              <span className="ml-2 text-gray-600">{certificate.email}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">수료증 번호:</span>
              <span className="ml-2 text-gray-600 font-mono">{certificate.certificate_number}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">발급일:</span>
              <span className="ml-2 text-gray-600">{formatDate(certificate.issued_at)}</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-green-800">
                이 수료증은 검증되었습니다. 정식 발급된 수료증입니다.
              </span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CertificateDetail;