import React from 'react';
import Layout from '../../components/common/Layout';

const Terms: React.FC = () => {
  return (
    <Layout>
      <div className="px-4 py-6">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">📋 이용약관</h1>
          <p className="text-gray-600 text-sm">AI-LMS 서비스 이용약관입니다</p>
          <p className="text-gray-500 text-xs mt-1">최종 업데이트: 2024년 6월 1일</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 space-y-6">
            
            {/* 제1조 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">제1조 (목적)</h2>
              <div className="text-gray-700 text-sm leading-relaxed space-y-2">
                <p>
                  이 약관은 AI-LMS(이하 "회사")가 제공하는 온라인 학습 관리 시스템 서비스(이하 "서비스")의 
                  이용조건 및 절차, 회사와 이용자의 권리, 의무, 책임사항과 기타 필요한 사항을 규정함을 목적으로 합니다.
                </p>
              </div>
            </section>

            {/* 제2조 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">제2조 (정의)</h2>
              <div className="text-gray-700 text-sm leading-relaxed space-y-2">
                <p>이 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>"서비스"</strong>란 회사가 제공하는 AI 기반 온라인 학습 관리 시스템을 의미합니다.</li>
                  <li><strong>"이용자"</strong>란 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
                  <li><strong>"회원"</strong>이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며, 회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.</li>
                  <li><strong>"콘텐츠"</strong>란 서비스에 게시된 강의, 영상, 문서, 이미지 등의 모든 정보를 말합니다.</li>
                </ul>
              </div>
            </section>

            {/* 제3조 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">제3조 (약관의 효력 및 변경)</h2>
              <div className="text-gray-700 text-sm leading-relaxed space-y-2">
                <p>1. 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력을 발생합니다.</p>
                <p>2. 회사는 합리적인 사유가 발생할 경우 이 약관을 변경할 수 있으며, 약관이 변경되는 경우 변경된 약관의 내용과 시행일을 정하여, 그 시행일로부터 최소 7일 이전에 서비스 내 공지사항을 통해 예고합니다.</p>
                <p>3. 이용자가 변경된 약관에 동의하지 않는 경우, 이용자는 서비스 이용을 중단하고 회원탈퇴를 할 수 있습니다.</p>
              </div>
            </section>

            {/* 제4조 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">제4조 (서비스의 제공)</h2>
              <div className="text-gray-700 text-sm leading-relaxed space-y-2">
                <p>회사가 제공하는 서비스는 다음과 같습니다:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>온라인 강의 수강 서비스</li>
                  <li>학습 진도 관리 및 통계 서비스</li>
                  <li>커뮤니티 및 Q&A 서비스</li>
                  <li>AI 기반 학습 추천 서비스</li>
                  <li>기타 회사가 추가 개발하거나 다른 회사와의 제휴계약 등을 통해 회원에게 제공하는 일체의 서비스</li>
                </ul>
              </div>
            </section>

            {/* 제5조 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">제5조 (회원가입)</h2>
              <div className="text-gray-700 text-sm leading-relaxed space-y-2">
                <p>1. 이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.</p>
                <p>2. 회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>가입신청자가 이 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
                  <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                  <li>기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
                </ul>
              </div>
            </section>

            {/* 제6조 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">제6조 (이용자의 의무)</h2>
              <div className="text-gray-700 text-sm leading-relaxed space-y-2">
                <p>이용자는 다음 행위를 하여서는 안 됩니다:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>신청 또는 변경 시 허위내용의 등록</li>
                  <li>다른 사람의 정보 도용</li>
                  <li>회사가 게시한 정보의 변경</li>
                  <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
                  <li>회사 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                  <li>회사 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                  <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
                </ul>
              </div>
            </section>

            {/* 제7조 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">제7조 (저작권의 귀속 및 이용제한)</h2>
              <div className="text-gray-700 text-sm leading-relaxed space-y-2">
                <p>1. 회사가 작성한 저작물에 대한 저작권 기타 지적재산권은 회사에 귀속합니다.</p>
                <p>2. 이용자는 서비스를 이용함으로써 얻은 정보 중 회사에게 지적재산권이 귀속된 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안됩니다.</p>
                <p>3. 회사는 약정에 따라 이용자에게 귀속된 저작권을 사용하는 경우 당해 이용자에게 통보하여야 합니다.</p>
              </div>
            </section>

            {/* 제8조 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">제8조 (개인정보보호)</h2>
              <div className="text-gray-700 text-sm leading-relaxed space-y-2">
                <p>1. 회사는 이용자의 개인정보 수집시 서비스제공을 위하여 필요한 범위에서 최소한의 개인정보를 수집합니다.</p>
                <p>2. 회사는 회원가입시 구매계약이행에 필요한 정보를 미리 수집하지 않습니다. 단, 관련 법령상 의무이행을 위하여 구매계약 이전에 본인확인이 필요한 경우로서 최소한의 특정 개인정보를 수집하는 경우에는 그러하지 아니합니다.</p>
                <p>3. 회사는 이용자의 개인정보를 수집·이용하는 때에는 당해 이용자에게 그 목적을 고지하고 동의를 받습니다.</p>
                <p>4. 회사는 수집된 개인정보를 목적외의 용도로 이용할 수 없으며, 새로운 이용목적이 발생한 경우 또는 제3자에게 제공하는 경우에는 이용·제공단계에서 당해 이용자에게 그 목적을 고지하고 동의를 받습니다.</p>
              </div>
            </section>

            {/* 부칙 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">부칙</h2>
              <div className="text-gray-700 text-sm leading-relaxed space-y-2">
                <p>이 약관은 2024년 6월 1일부터 적용됩니다.</p>
              </div>
            </section>

          </div>
        </div>

        {/* 하단 링크 */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-3">관련 정책도 함께 확인해보세요:</p>
          <div className="flex gap-3">
            <a
              href="/privacy"
              className="flex-1 bg-white text-gray-700 px-4 py-3 rounded-lg text-center text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-200"
            >
              🔒 개인정보처리방침
            </a>
            <a
              href="/contact"
              className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg text-center text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              💬 문의하기
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Terms;