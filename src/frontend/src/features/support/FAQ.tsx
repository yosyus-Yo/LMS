import React, { useState } from 'react';
import Layout from '../../components/common/Layout';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const FAQ: React.FC = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  const faqData: FAQItem[] = [
    {
      id: 1,
      question: "회원가입은 어떻게 하나요?",
      answer: "상단의 '회원가입' 버튼을 클릭하시거나 모바일에서는 햄버거 메뉴에서 회원가입을 선택하세요. 이메일과 비밀번호를 입력하시면 간단하게 가입할 수 있습니다.",
      category: "계정"
    },
    {
      id: 2,
      question: "강의는 어떻게 수강하나요?",
      answer: "강의 목록에서 원하는 강의를 선택하고, 수강신청 또는 결제를 완료하시면 바로 학습을 시작할 수 있습니다. 대시보드에서 수강 중인 강의를 관리할 수 있습니다.",
      category: "강의"
    },
    {
      id: 3,
      question: "모바일에서도 사용할 수 있나요?",
      answer: "네! AI-LMS는 모바일 환경에 완전히 최적화되어 있습니다. 스마트폰이나 태블릿에서도 모든 기능을 자유롭게 사용하실 수 있습니다.",
      category: "기술"
    },
    {
      id: 4,
      question: "학습 진도는 어떻게 관리되나요?",
      answer: "각 챕터를 완료하시면 체크박스를 클릭해주세요. 진도율이 자동으로 계산되어 대시보드에 표시됩니다. 언제든지 학습 현황을 확인할 수 있습니다.",
      category: "강의"
    },
    {
      id: 5,
      question: "결제는 어떤 방법으로 할 수 있나요?",
      answer: "신용카드, 체크카드, 계좌이체 등 다양한 결제 수단을 지원합니다. 안전한 결제 시스템을 통해 개인정보가 보호됩니다.",
      category: "결제"
    },
    {
      id: 6,
      question: "비밀번호를 잊어버렸어요.",
      answer: "로그인 페이지에서 '비밀번호 찾기'를 클릭하시고, 가입시 사용한 이메일을 입력하시면 비밀번호 재설정 링크를 받으실 수 있습니다.",
      category: "계정"
    },
    {
      id: 7,
      question: "커뮤니티에서는 무엇을 할 수 있나요?",
      answer: "다른 학습자들과 질문과 답변을 주고받고, 학습 경험을 공유할 수 있습니다. 카테고리별로 게시글을 분류해서 원하는 정보를 쉽게 찾을 수 있습니다.",
      category: "커뮤니티"
    },
    {
      id: 8,
      question: "환불 정책이 어떻게 되나요?",
      answer: "강의 시작 후 7일 이내, 진도율 10% 미만인 경우 100% 환불이 가능합니다. 자세한 환불 정책은 이용약관을 참고해주세요.",
      category: "결제"
    }
  ];

  const categories = ['전체', ...Array.from(new Set(faqData.map(item => item.category)))];

  const filteredFAQ = selectedCategory === '전체' 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory);

  const toggleItem = (id: number) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <Layout>
      <div className="px-4 py-6">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">❓ 자주 묻는 질문</h1>
          <p className="text-gray-600 text-sm">궁금한 점들을 빠르게 해결해보세요</p>
        </div>

        {/* 카테고리 필터 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ 목록 */}
        <div className="space-y-3">
          {filteredFAQ.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-100">
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center flex-1">
                  <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded mr-3">
                    {item.category}
                  </span>
                  <span className="font-medium text-gray-900 text-sm">{item.question}</span>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    openItems.includes(item.id) ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {openItems.includes(item.id) && (
                <div className="px-4 pb-4">
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-gray-600 text-sm leading-relaxed">{item.answer}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 추가 도움 */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">💡 더 궁금한 점이 있으신가요?</h2>
          <p className="text-gray-600 text-sm mb-4">
            위에서 원하는 답변을 찾지 못하셨다면 언제든지 문의해주세요.
          </p>
          <div className="flex gap-3">
            <a
              href="/contact"
              className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg text-center text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              💬 문의하기
            </a>
            <a
              href="/help"
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg text-center text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              📖 도움말
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FAQ;