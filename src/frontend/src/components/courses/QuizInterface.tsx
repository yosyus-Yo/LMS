import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import Button from '../common/Button';

interface Quiz {
  id: number;
  chapter: number;
  title: string;
  description: string;
  time_limit_minutes: number;
  pass_percentage: number;
  is_randomized: boolean;
  show_answers: boolean;
  max_attempts: number;
  questions: Question[];
  total_questions: number;
  total_points: number;
}

interface Question {
  id: number;
  quiz: number;
  question_text: string;
  question_type: 'multiple_choice' | 'single_choice' | 'true_false' | 'short_answer' | 'essay';
  explanation: string;
  points: number;
  order: number;
  is_required: boolean;
  answers: Answer[];
}

interface Answer {
  id: number;
  question: number;
  answer_text: string;
  is_correct: boolean;
  explanation: string;
  order: number;
}

interface QuizResult {
  score: number;
  total_points: number;
  percentage: number;
  passed: boolean;
  attempt_number: number;
}

interface QuizInterfaceProps {
  quizId: number;
  onComplete?: (result: QuizResult) => void;
  onClose?: () => void;
}

const QuizInterface: React.FC<QuizInterfaceProps> = ({ quizId, onComplete, onClose }) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setIsLoading(true);
        // TODO: Supabase API로 퀴즈 데이터 가져오기 구현 필요
        console.log('Quiz loading temporarily disabled for migration');
        setQuiz(null);
      } catch (error) {
        console.error('Error fetching quiz:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (timeLeft === null) return;

    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev ? prev - 1 : 0);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAnswerChange = (questionId: number, answerValue: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerValue
    }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    setIsSubmitting(true);
    try {
      // TODO: Supabase API로 퀴즈 제출 구현 필요
      console.log('Quiz submission temporarily disabled for migration');
      const mockResult: QuizResult = {
        score: 0,
        total_points: 0,
        percentage: 0,
        passed: false,
        attempt_number: 1
      };
      setResult(mockResult);
      onComplete?.(mockResult);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('퀴즈 제출 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderQuestion = (question: Question, index: number) => {
    const userAnswer = answers[question.id];

    return (
      <div key={question.id} className="space-y-4">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-medium">
            {index + 1}. {question.question_text}
          </h3>
          <span className="text-sm text-gray-500 ml-4">
            {question.points}점
          </span>
        </div>

        <div className="space-y-3">
          {question.question_type === 'multiple_choice' && (
            <div className="space-y-2">
              {question.answers.map((answer) => (
                <label key={answer.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={Array.isArray(userAnswer) ? userAnswer.includes(answer.id) : false}
                    onChange={(e) => {
                      const currentAnswers = Array.isArray(userAnswer) ? userAnswer : [];
                      if (e.target.checked) {
                        handleAnswerChange(question.id, [...currentAnswers, answer.id]);
                      } else {
                        handleAnswerChange(question.id, currentAnswers.filter(id => id !== answer.id));
                      }
                    }}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{answer.answer_text}</span>
                </label>
              ))}
            </div>
          )}

          {question.question_type === 'single_choice' && (
            <div className="space-y-2">
              {question.answers.map((answer) => (
                <label key={answer.id} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={`question_${question.id}`}
                    checked={userAnswer === answer.id}
                    onChange={() => handleAnswerChange(question.id, answer.id)}
                    className="border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{answer.answer_text}</span>
                </label>
              ))}
            </div>
          )}

          {question.question_type === 'true_false' && (
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={`question_${question.id}`}
                  checked={userAnswer === 'true'}
                  onChange={() => handleAnswerChange(question.id, 'true')}
                  className="border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>참</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={`question_${question.id}`}
                  checked={userAnswer === 'false'}
                  onChange={() => handleAnswerChange(question.id, 'false')}
                  className="border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>거짓</span>
              </label>
            </div>
          )}

          {(question.question_type === 'short_answer' || question.question_type === 'essay') && (
            <textarea
              value={userAnswer || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={question.question_type === 'essay' ? 6 : 3}
              placeholder="답안을 입력하세요..."
            />
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">퀴즈를 불러올 수 없습니다.</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className={`text-6xl mb-4 ${result.passed ? 'text-green-500' : 'text-red-500'}`}>
            {result.passed ? '🎉' : '😞'}
          </div>
          
          <h2 className="text-2xl font-bold mb-4">
            {result.passed ? '축하합니다!' : '아쉽습니다'}
          </h2>
          
          <div className="space-y-2 mb-6">
            <p className="text-lg">
              점수: <span className="font-bold">{result.score}</span> / {result.total_points}점
            </p>
            <p className="text-lg">
              정답률: <span className="font-bold">{result.percentage.toFixed(1)}%</span>
            </p>
            <p className="text-sm text-gray-600">
              시도 횟수: {result.attempt_number}회
            </p>
          </div>

          <div className="flex justify-center space-x-4">
            {!result.passed && quiz.max_attempts > 0 && result.attempt_number < quiz.max_attempts && (
              <Button
                variant="primary"
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                  setCurrentQuestionIndex(0);
                  if (quiz.time_limit_minutes > 0) {
                    setTimeLeft(quiz.time_limit_minutes * 60);
                  }
                }}
              >
                다시 시도
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>
              닫기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* 퀴즈 헤더 */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{quiz.title}</h1>
            {quiz.description && (
              <p className="text-gray-600 mt-2">{quiz.description}</p>
            )}
          </div>
          
          <div className="text-right">
            {timeLeft !== null && (
              <div className={`text-lg font-mono ${timeLeft < 300 ? 'text-red-600' : 'text-gray-600'}`}>
                남은 시간: {formatTime(timeLeft)}
              </div>
            )}
            <div className="text-sm text-gray-500 mt-1">
              총 {quiz.total_questions}문항 · {quiz.total_points}점 만점
            </div>
          </div>
        </div>
      </div>

      {/* 진행률 표시 */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>진행률</span>
          <span>{Math.round(((Object.keys(answers).length) / quiz.questions.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(Object.keys(answers).length / quiz.questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* 질문들 */}
      <div className="space-y-8 mb-8">
        {quiz.questions.map((question, index) => renderQuestion(question, index))}
      </div>

      {/* 제출 버튼 */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          답변한 문항: {Object.keys(answers).length} / {quiz.questions.length}
        </div>
        
        <div className="space-x-4">
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || Object.keys(answers).length === 0}
          >
            {isSubmitting ? '제출 중...' : '제출하기'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizInterface;