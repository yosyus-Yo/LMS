import React, { useState } from 'react';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '일반 문의',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    '일반 문의',
    '기술 지원',
    '강의 관련',
    '결제/환불',
    '계정 문제',
    '기타'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 실제 구현에서는 API 호출
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSubmitted(true);
    setIsSubmitting(false);
    
    // 폼 초기화
    setFormData({
      name: '',
      email: '',
      category: '일반 문의',
      subject: '',
      message: ''
    });
  };

  if (submitted) {
    return (
      <Layout>
        <div className="px-4 py-6">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-100">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">문의가 접수되었습니다!</h1>
            <p className="text-gray-600 mb-6">
              소중한 의견을 보내주셔서 감사합니다.<br/>
              빠른 시일 내에 답변 드리겠습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSubmitted(false)}
                className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                새 문의 작성
              </button>
              <a
                href="/faq"
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg text-center text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                FAQ 보기
              </a>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">💬 문의하기</h1>
          <p className="text-gray-600 text-sm">궁금한 점이나 문제가 있으시면 언제든 연락해주세요</p>
        </div>

        {/* 연락처 정보 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📞 연락처 정보</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="text-lg mr-3">📧</span>
              <div>
                <div className="font-medium text-gray-900">이메일</div>
                <div className="text-sm text-gray-600">support@ai-lms.com</div>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-lg mr-3">🕐</span>
              <div>
                <div className="font-medium text-gray-900">운영시간</div>
                <div className="text-sm text-gray-600">평일 09:00 - 18:00 (주말, 공휴일 제외)</div>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-lg mr-3">⚡</span>
              <div>
                <div className="font-medium text-gray-900">응답시간</div>
                <div className="text-sm text-gray-600">영업일 기준 24시간 이내</div>
              </div>
            </div>
          </div>
        </div>

        {/* 문의 폼 */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">✍️ 문의 작성</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                이름 *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="이름을 입력해주세요"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일 *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="이메일을 입력해주세요"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                문의 유형 *
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                제목 *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="문의 제목을 입력해주세요"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                내용 *
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                value={formData.message}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="문의 내용을 자세히 작성해주세요"
              />
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                variant="primary" 
                disabled={isSubmitting}
                className="w-full py-3 text-base"
              >
                {isSubmitting ? '📤 전송 중...' : '📤 문의 전송'}
              </Button>
            </div>
          </form>
        </div>

        {/* 추가 정보 */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">💡 문의 전 확인해주세요</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• 자주 묻는 질문(FAQ)에서 답변을 먼저 찾아보세요</li>
            <li>• 기술적 문제의 경우 사용 중인 브라우저와 기기 정보를 포함해주세요</li>
            <li>• 계정 관련 문제의 경우 가입 시 사용한 이메일을 명시해주세요</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;