import React from 'react';
import Layout from '../../components/common/Layout';

const Help: React.FC = () => {
  return (
    <Layout>
      <div className="px-4 py-6">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">❓ 도움말</h1>
          <p className="text-gray-600 text-sm">AI-LMS 사용법을 알아보세요</p>
        </div>

        {/* 주요 기능 가이드 */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📚 주요 기능 가이드</h2>
            
            <div className="space-y-4">
              <div className="border-l-4 border-indigo-500 pl-4">
                <h3 className="font-medium text-gray-900">강의 수강하기</h3>
                <p className="text-gray-600 text-sm mt-1">
                  1. 강의 목록에서 원하는 강의를 선택하세요<br/>
                  2. 강의 소개 페이지에서 상세 정보를 확인하세요<br/>
                  3. 수강신청 또는 결제를 진행하세요<br/>
                  4. 대시보드에서 학습을 시작하세요
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-gray-900">학습 진도 관리</h3>
                <p className="text-gray-600 text-sm mt-1">
                  • 각 챕터 완료 시 체크박스를 클릭하세요<br/>
                  • 진도율이 자동으로 업데이트됩니다<br/>
                  • 대시보드에서 전체 학습 현황을 확인할 수 있습니다
                </p>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium text-gray-900">커뮤니티 참여</h3>
                <p className="text-gray-600 text-sm mt-1">
                  • 다른 학습자들과 질문과 답변을 주고받으세요<br/>
                  • 학습 경험을 공유하고 토론에 참여하세요<br/>
                  • 카테고리별로 게시글을 분류해서 찾아보세요
                </p>
              </div>

              <div className="border-l-4 border-orange-500 pl-4">
                <h3 className="font-medium text-gray-900">모바일 사용법</h3>
                <p className="text-gray-600 text-sm mt-1">
                  • 상단 햄버거 메뉴(☰)를 터치해서 메뉴를 열어보세요<br/>
                  • 모든 기능이 터치에 최적화되어 있습니다<br/>
                  • 언제 어디서나 학습을 계속할 수 있습니다
                </p>
              </div>
            </div>
          </div>

          {/* 빠른 링크 */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🔗 빠른 링크</h2>
            <div className="grid grid-cols-1 gap-3">
              <a href="/faq" className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="text-lg mr-3">❓</span>
                <div>
                  <div className="font-medium text-gray-900">자주 묻는 질문</div>
                  <div className="text-sm text-gray-600">일반적인 문제들의 해결책을 찾아보세요</div>
                </div>
              </a>
              
              <a href="/contact" className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="text-lg mr-3">💬</span>
                <div>
                  <div className="font-medium text-gray-900">문의하기</div>
                  <div className="text-sm text-gray-600">추가 도움이 필요하시면 언제든 연락하세요</div>
                </div>
              </a>
            </div>
          </div>

          {/* 기술 지원 */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🛠️ 기술 지원</h2>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900">권장 브라우저</h3>
                <p className="text-blue-700 text-sm">Chrome, Safari, Firefox, Edge 최신 버전</p>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-900">모바일 지원</h3>
                <p className="text-green-700 text-sm">iOS 13+, Android 8+ 지원</p>
              </div>
              
              <div className="p-3 bg-yellow-50 rounded-lg">
                <h3 className="font-medium text-yellow-900">문제 해결</h3>
                <p className="text-yellow-700 text-sm">페이지가 로드되지 않을 때는 브라우저 캐시를 삭제해보세요</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Help;