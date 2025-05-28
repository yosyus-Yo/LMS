import Groq from 'groq-sdk';

// Groq 클라이언트 초기화
const groq = new Groq({
  apiKey: process.env.REACT_APP_GROQ_API_KEY,
  dangerouslyAllowBrowser: true // 브라우저에서 사용하기 위해 필요
});

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  success: boolean;
  message?: string;
  error?: string;
}

class GroqService {
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = !!process.env.REACT_APP_GROQ_API_KEY && 
                       process.env.REACT_APP_GROQ_API_KEY !== 'your_groq_api_key_here';
  }

  // Groq API 설정 상태 확인
  isReady(): boolean {
    return this.isConfigured;
  }

  // 챗봇과 대화하기
  async sendMessage(
    userMessage: string, 
    conversationHistory: ChatMessage[] = []
  ): Promise<ChatResponse> {
    if (!this.isReady()) {
      return {
        success: false,
        error: 'Groq API key가 설정되지 않았습니다. .env 파일을 확인해주세요.'
      };
    }

    try {
      console.log('🤖 Groq API 호출 시작:', userMessage);

      // 시스템 프롬프트 설정 - 학습 관리 시스템 전용 AI 어시스턴트
      const systemPrompt = `당신은 AI-LMS(학습 관리 시스템)의 전문 AI 튜터입니다.

핵심 원칙:
- 반드시 한국어로만 답변해주세요
- 모든 사용자에게 정중하고 친근한 어조로 대화해주세요
- 존댓말을 사용하여 예의를 지켜주세요

역할과 임무:
- 학습자들의 학습 목표 달성을 적극적으로 지원
- 강의 내용, 학습 방법, 기술적 질문에 상세하고 친절한 답변 제공
- 학습자의 수준에 맞춰 쉽고 이해하기 쉬운 설명 제공
- 학습 동기 부여와 격려를 통한 지속적인 학습 지원

응답 가이드라인:
- 정중하고 따뜻한 어조 유지 ("안녕하세요", "감사합니다", "도움이 되셨기를 바랍니다" 등)
- 구체적이고 실용적인 조언 제공
- 이해하기 쉬운 예시와 단계별 설명 포함
- 학습자의 노력을 인정하고 격려하는 메시지 포함
- 추가 질문이나 도움이 필요한 경우 언제든 말씀해 달라는 안내

제한사항:
- 부적절하거나 유해한 내용에 대해서는 정중히 거절
- 확실하지 않은 정보는 추측하지 않고 솔직하게 설명
- 학습과 관련 없는 주제는 정중히 학습 관련 질문으로 유도
- 개인정보나 민감한 정보 요청은 거절

특별 지침:
모든 답변은 "안녕하세요!" 또는 적절한 인사로 시작하고, 도움이 되는 정보 제공 후 "더 궁금한 점이 있으시면 언제든 말씀해 주세요!"와 같은 친근한 마무리로 끝내주세요.`;

      // 대화 메시지 구성
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        // 최근 5개 대화만 포함 (토큰 제한 고려)
        ...conversationHistory.slice(-5).map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        { role: 'user' as const, content: userMessage }
      ];

      // Groq API 호출
      const completion = await groq.chat.completions.create({
        messages,
        model: 'llama3-8b-8192', // Groq에서 지원하는 모델
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        stream: false
      });

      const responseContent = completion.choices[0]?.message?.content;

      if (!responseContent) {
        throw new Error('AI 응답을 받지 못했습니다.');
      }

      console.log('✅ Groq API 응답 성공');

      return {
        success: true,
        message: responseContent.trim()
      };

    } catch (error: any) {
      console.error('❌ Groq API 오류:', error);
      
      let errorMessage = 'AI 서비스에 일시적인 문제가 발생했습니다.';
      
      if (error?.status === 401) {
        errorMessage = 'API 키가 유효하지 않습니다.';
      } else if (error?.status === 429) {
        errorMessage = 'API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
      } else if (error?.status === 500) {
        errorMessage = 'AI 서비스가 일시적으로 불안정합니다.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // 빠른 응답 (미리 정의된 답변)
  async getQuickResponse(query: string): Promise<ChatResponse> {
    const quickResponses: { [key: string]: string } = {
      '안녕': '안녕하세요! AI-LMS 전문 튜터입니다. 😊\n\n학습에 관해 궁금한 점이나 도움이 필요한 부분이 있으시면 언제든지 편하게 말씀해 주세요. 최선을 다해 도움을 드리겠습니다!\n\n더 궁금한 점이 있으시면 언제든 말씀해 주세요!',
      '도움': '안녕하세요! 기꺼이 도움을 드리겠습니다.\n\n다음과 같은 영역에서 지원해 드릴 수 있습니다:\n• 📚 학습 방법 및 전략 조언\n• 🎯 개인 맞춤형 학습 계획 수립\n• 💻 기술 관련 질문 답변\n• 📖 강의 및 교육 자료 추천\n• 🚀 학습 동기 부여 및 격려\n\n구체적으로 어떤 부분에서 도움이 필요하신지 말씀해 주시면, 더욱 정확하고 유용한 조언을 드릴 수 있습니다.\n\n더 궁금한 점이 있으시면 언제든 말씀해 주세요!',
      '강의': '안녕하세요! 강의 관련 문의를 주셔서 감사합니다.\n\n현재 다양한 분야의 강의들이 준비되어 있습니다:\n• 💻 프로그래밍 (Python, JavaScript, Java 등)\n• 🤖 AI/머신러닝\n• 📊 데이터 사이언스\n• 🌐 웹 개발\n• 📱 모바일 앱 개발\n• 그 외 다양한 IT 분야\n\n어떤 분야에 관심이 있으시거나 특별히 찾고 계신 강의가 있으신가요? 회원님의 현재 수준과 목표를 알려주시면, 가장 적합한 강의를 추천해 드리겠습니다.\n\n더 궁금한 점이 있으시면 언제든 말씀해 주세요!',
      '학습': '안녕하세요! 효과적인 학습에 대해 문의해 주셔서 감사합니다.\n\n성공적인 학습을 위한 핵심 전략들을 소개해 드릴게요:\n\n📈 **학습 효과를 높이는 방법:**\n• 🎯 명확한 학습 목표 설정\n• ⏰ 꾸준한 학습 스케줄 유지\n• 💪 이론과 실습의 균형\n• 📝 주기적인 복습과 정리\n• 👥 학습 커뮤니티 적극 활용\n• 🏆 작은 성취도 인정하며 동기 유지\n\n개인의 학습 스타일과 목표에 따라 더 구체적인 조언을 드릴 수 있습니다. 현재 어떤 분야를 학습하고 계시거나 특별히 고민되는 부분이 있으시면 말씀해 주세요!\n\n더 궁금한 점이 있으시면 언제든 말씀해 주세요!'
    };

    const normalizedQuery = query.toLowerCase().trim();
    
    for (const [key, response] of Object.entries(quickResponses)) {
      if (normalizedQuery.includes(key)) {
        return {
          success: true,
          message: response
        };
      }
    }

    // 빠른 응답에 없으면 실제 AI API 호출
    return this.sendMessage(query);
  }
}

export const groqService = new GroqService();