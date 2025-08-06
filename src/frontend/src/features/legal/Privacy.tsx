import React from 'react';
import Layout from '../../components/common/Layout';

const Privacy: React.FC = () => {
  return (
    <Layout>
      <div className="px-4 py-6">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">🔒 개인정보처리방침</h1>
          <p className="text-gray-600 text-sm">AI-LMS의 개인정보 처리방침입니다</p>
          <p className="text-gray-500 text-xs mt-1">최종 업데이트: 2024년 6월 1일</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 space-y-6">
            
            {/* 개요 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">개인정보처리방침 개요</h2>
              <div className="text-gray-700 text-sm leading-relaxed space-y-2">
                <p>
                  AI-LMS(이하 "회사")는 정보주체의 자유와 권리 보호를 위해 「개인정보 보호법」 및 관계 법령이 정한 바를 준수하여, 
                  적법하게 개인정보를 처리하고 안전하게 관리하고 있습니다. 이에 「개인정보 보호법」 제30조에 따라 정보주체에게 
                  개인정보 처리에 관한 절차 및 기준을 안내하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 
                  다음과 같이 개인정보 처리방침을 수립·공개합니다.
                </p>
              </div>
            </section>

            {/* 제1조 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">제1조 (개인정보의 처리목적)</h2>
              <div className="text-gray-700 text-sm leading-relaxed space-y-2">
                <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">1. 회원가입 및 관리</h3>
                  <p className="text-sm text-gray-600">회원 가입의사 확인, 회원자격 유지·관리, 서비스 부정이용 방지, 각종 고지·통지, 고충처리 목적으로 개인정보를 처리합니다.</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">2. 재화 또는 서비스 제공</h3>
                  <p className="text-sm text-gray-600">강의 서비스 제공, 콘텐츠 제공, 맞춤 서비스 제공, 본인인증, 연령인증, 요금결제·정산을 목적으로 개인정보를 처리합니다.</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">3. 마케팅 및 광고에의 활용</h3>
                  <p className="text-sm text-gray-600">신규 서비스(제품) 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공 및 참여기회 제공, 서비스의 유효성 확인을 목적으로 개인정보를 처리합니다.</p>
                </div>
              </div>
            </section>

            {/* 제2조 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">제2조 (개인정보의 처리 및 보유기간)</h2>
              <div className="text-gray-700 text-sm leading-relaxed space-y-2">
                <p>① 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
                <p>② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:</p>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <ul className="space-y-2 text-sm">
                    <li><strong>회원가입 및 관리:</strong> 회원탈퇴 시까지 (단, 관계법령 위반에 따른 수사·조사 등이 진행중인 경우에는 해당 수사·조사 종료시까지)</li>
                    <li><strong>재화 또는 서비스 제공:</strong> 재화·서비스 공급완료 및 요금결제·정산 완료시까지 (단, 다음의 경우에는 해당 기간 종료시까지)</li>
                    <li><strong>표시·광고에 관한 기록:</strong> 6개월</li>
                    <li><strong>계약 또는 청약철회 등에 관한 기록:</strong> 5년</li>
                    <li><strong>대금결제 및 재화 등의 공급에 관한 기록:</strong> 5년</li>
                    <li><strong>소비자의 불만 또는 분쟁처리에 관한 기록:</strong> 3년</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 제3조 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">제3조 (개인정보의 제3자 제공)</h2>
              <div className="text-gray-700 text-sm leading-relaxed space-y-2">
                <p>① 회사는 개인정보를 제1조(개인정보의 처리목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.</p>
                <p>② 회사는 다음과 같이 개인정보를 제3자에게 제공하고 있습니다:</p>
                
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-medium text-yellow-900 mb-2">결제서비스 제공업체</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• <strong>제공받는 자:</strong> 결제대행업체 (PG사)</li>
                    <li>• <strong>제공목적:</strong> 결제처리 및 정산</li>
                    <li>• <strong>제공항목:</strong> 이름, 연락처, 결제정보</li>
                    <li>• <strong>보유기간:</strong> 결제완료 후 5년</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 제4조 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">제4조 (개인정보처리의 위탁)</h2>
              <div className="text-gray-700 text-sm leading-relaxed space-y-2">
                <p>① 회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:</p>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-medium text-green-900 mb-2">클라우드 서비스 제공업체</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• <strong>위탁받는 자:</strong> AWS, Google Cloud Platform</li>
                    <li>• <strong>위탁업무:</strong> 데이터 저장 및 서버 운영</li>
                    <li>• <strong>위탁기간:</strong> 서비스 제공 기간</li>
                  </ul>
                </div>

                <p>② 회사는 위탁계약 체결시 「개인정보 보호법」 제26조에 따라 위탁업무 수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.</p>
              </div>
            </section>

            {/* 제5조 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">제5조 (정보주체의 권리·의무 및 행사방법)</h2>
              <div className="text-gray-700 text-sm leading-relaxed space-y-2">
                <p>① 정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>개인정보 처리현황 통지요구</li>
                  <li>개인정보 열람요구</li>
                  <li>개인정보 정정·삭제요구</li>
                  <li>개인정보 처리정지요구</li>
                </ul>
                <p>② 제1항에 따른 권리 행사는 회사에 대해 「개인정보 보호법」 시행규칙 별지 제8호 서식에 따라 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며 회사는 이에 대해 지체없이 조치하겠습니다.</p>
                <p>③ 정보주체가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우에는 회사는 정정 또는 삭제를 완료할 때까지 당해 개인정보를 이용하거나 제공하지 않습니다.</p>
              </div>
            </section>

            {/* 제6조 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">제6조 (개인정보의 안전성 확보조치)</h2>
              <div className="text-gray-700 text-sm leading-relaxed space-y-2">
                <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>관리적 조치:</strong> 내부관리계획 수립·시행, 정기적 직원 교육 등</li>
                  <li><strong>기술적 조치:</strong> 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</li>
                  <li><strong>물리적 조치:</strong> 전산실, 자료보관실 등의 접근통제</li>
                </ul>
              </div>
            </section>

            {/* 제7조 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">제7조 (개인정보보호책임자)</h2>
              <div className="text-gray-700 text-sm leading-relaxed space-y-2">
                <p>① 회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보보호책임자를 지정하고 있습니다:</p>
                
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <h3 className="font-medium text-indigo-900 mb-2">개인정보보호책임자</h3>
                  <ul className="text-sm text-indigo-700 space-y-1">
                    <li>• <strong>성명:</strong> 개인정보보호책임자</li>
                    <li>• <strong>직책:</strong> 개발팀장</li>
                    <li>• <strong>연락처:</strong> privacy@ai-lms.com</li>
                  </ul>
                </div>

                <p>② 정보주체께서는 회사의 서비스를 이용하시면서 발생한 모든 개인정보보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보보호책임자 및 담당부서로 문의하실 수 있습니다. 회사는 정보주체의 문의에 대해 지체없이 답변 및 처리해드릴 것입니다.</p>
              </div>
            </section>

            {/* 제8조 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">제8조 (개인정보처리방침 변경)</h2>
              <div className="text-gray-700 text-sm leading-relaxed space-y-2">
                <p>① 이 개인정보처리방침은 2024년 6월 1일부터 적용됩니다.</p>
                <p>② 이전의 개인정보처리방침은 아래에서 확인하실 수 있습니다.</p>
              </div>
            </section>

          </div>
        </div>

        {/* 하단 링크 */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-3">개인정보 관련 문의사항이 있으시면:</p>
          <div className="flex gap-3">
            <a
              href="/contact"
              className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg text-center text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              💬 개인정보 문의하기
            </a>
            <a
              href="/terms"
              className="flex-1 bg-white text-gray-700 px-4 py-3 rounded-lg text-center text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-200"
            >
              📋 이용약관 보기
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Privacy;