import React, { useState, useRef, useEffect } from 'react';
import { groqService, ChatMessage } from '../../services/groqService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 메시지 영역 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 첫 로드 시 환영 메시지 표시
  useEffect(() => {
    if (isFirstLoad && isOpen) {
      const welcomeMessage: Message = {
        id: 'welcome',
        text: groqService.isReady() 
          ? '안녕하세요! AI-LMS 어시스턴트입니다. 학습에 관한 질문이 있으시면 언제든지 물어보세요! 🎓' 
          : '안녕하세요! 현재 AI 서비스가 설정되지 않아 제한된 기능만 제공됩니다. 기본적인 질문은 답변해드릴 수 있어요.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      setIsFirstLoad(false);
    }
  }, [isOpen, isFirstLoad]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;

    const userMessageText = inputMessage.trim();
    
    // 사용자 메시지 추가
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userMessageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // 대화 히스토리를 ChatMessage 형식으로 변환
      const conversationHistory: ChatMessage[] = messages.map((msg, index) => ({
        id: msg.id,
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
        timestamp: msg.timestamp
      }));

      // Groq API 호출
      const response = await groqService.sendMessage(userMessageText, conversationHistory);
      
      let botReply = '';
      
      if (response.success && response.message) {
        botReply = response.message;
      } else {
        // API 실패 시 빠른 응답으로 fallback
        console.log('Groq API 실패, 빠른 응답으로 fallback:', response.error);
        const quickResponse = await groqService.getQuickResponse(userMessageText);
        
        if (quickResponse.success && quickResponse.message) {
          botReply = quickResponse.message;
        } else {
          botReply = '죄송합니다. 일시적으로 응답할 수 없습니다. 잠시 후 다시 시도해주세요. 🤔';
        }
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botReply,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      
    } catch (error) {
      console.error('챗봇 응답 오류:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: '죄송합니다. 시스템에 일시적인 문제가 발생했습니다. 다시 시도해주세요.',
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* 챗봇 토글 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg focus:outline-none"
      >
        {isOpen ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            ></path>
          </svg>
        )}
      </button>

      {/* 챗봇 창 */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col">
          {/* 헤더 */}
          <div className="bg-indigo-600 text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center">
              <svg
                className="w-6 h-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                ></path>
              </svg>
              <h3 className="font-semibold">AI 튜터</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 focus:outline-none"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 px-4 py-3 overflow-y-auto max-h-96">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-3 ${
                  message.sender === 'user' ? 'text-right' : ''
                }`}
              >
                <div
                  className={`inline-block px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {message.text}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="mb-3">
                <div className="inline-block px-4 py-2 rounded-lg bg-gray-200 text-gray-800">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce delay-100"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <div className="border-t border-gray-200 p-3 flex">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={inputMessage.trim() === '' || isTyping}
              className={`px-4 py-2 rounded-r-lg ${
                inputMessage.trim() === '' || isTyping
                  ? 'bg-gray-300 text-gray-500'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;