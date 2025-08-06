import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppSelector } from '../../app/store';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import apiClient from '../../api/apiClient';

interface QnAItem {
  id: string;
  title: string;
  content: string;
  status: 'pending' | 'answered' | 'closed';
  is_private: boolean;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
  answers: QnAAnswer[];
}

interface QnAAnswer {
  id: string;
  content: string;
  created_at: string;
  author: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
}

interface QnAStats {
  totalQuestions: number;
  answeredQuestions: number;
  pendingQuestions: number;
  myQuestions: number;
  answerRate: number;
}

const CourseQnAList: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAppSelector((state) => state.auth);
  
  const [qnaList, setQnaList] = useState<QnAItem[]>([]);
  const [stats, setStats] = useState<QnAStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'answered' | 'mine'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isInstructor, setIsInstructor] = useState(false);

  useEffect(() => {
    if (courseId) {
      checkInstructorPermission();
      fetchQnAData();
      fetchStats();
    }
  }, [courseId, activeFilter, searchTerm]);

  const checkInstructorPermission = async () => {
    if (!user || !courseId) return;

    try {
      const { data: course } = await apiClient.courses.getById(courseId);
      setIsInstructor(
        course.instructor_id === user.id || user.role === 'admin'
      );
    } catch (error) {
      console.error('강사 권한 확인 실패:', error);
    }
  };

  const fetchQnAData = async () => {
    if (!courseId) return;

    try {
      setIsLoading(true);
      
      const filters: any = {};
      
      if (activeFilter === 'pending') {
        filters.status = 'pending';
      } else if (activeFilter === 'answered') {
        filters.status = 'answered';
      }
      
      if (searchTerm) {
        filters.search = searchTerm;
      }

      const { data } = await apiClient.courseQnA.getQnAList(courseId, filters);
      
      // 내 질문만 보기 필터 (클라이언트 측에서 처리)
      let filteredData = data || [];
      if (activeFilter === 'mine' && user) {
        filteredData = filteredData.filter((item: QnAItem) => item.author.id === user.id);
      }
      
      setQnaList(filteredData);
    } catch (error) {
      console.error('Q&A 목록 조회 실패:', error);
      setQnaList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!courseId) return;

    try {
      const { data } = await apiClient.courseQnA.getQnAStats(courseId);
      setStats(data);
    } catch (error) {
      console.error('Q&A 통계 조회 실패:', error);
    }
  };

  const getStatusBadge = (status: string, answerCount: number) => {
    if (answerCount > 0 || status === 'answered') {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
          ✅ 답변완료
        </span>
      );
    } else if (status === 'pending') {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
          ⏳ 답변대기
        </span>
      );
    } else {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
          🔒 종료
        </span>
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 1) {
      return '어제';
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">강의 Q&A</h1>
            <Link to={`/courses/${courseId}/qna/write`}>
              <Button variant="primary" size="sm">
                ❓ 질문하기
              </Button>
            </Link>
          </div>

          {/* 통계 카드 */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="text-sm text-gray-600">전체 질문</div>
                <div className="text-xl font-bold text-gray-900">{stats.totalQuestions}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="text-sm text-gray-600">답변완료</div>
                <div className="text-xl font-bold text-green-600">{stats.answeredQuestions}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="text-sm text-gray-600">답변대기</div>
                <div className="text-xl font-bold text-yellow-600">{stats.pendingQuestions}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="text-sm text-gray-600">내 질문</div>
                <div className="text-xl font-bold text-indigo-600">{stats.myQuestions}</div>
              </div>
            </div>
          )}

          {/* 필터 및 검색 */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex space-x-2">
              {[
                { key: 'all', label: '전체' },
                { key: 'pending', label: '답변대기' },
                { key: 'answered', label: '답변완료' },
                { key: 'mine', label: '내 질문' }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key as any)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeFilter === filter.key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="질문 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Q&A 목록 */}
        <div className="space-y-4">
          {qnaList.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <div className="text-gray-500 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">질문이 없습니다</h3>
              <p className="text-gray-500 mb-4">
                {activeFilter === 'mine' 
                  ? '아직 작성한 질문이 없습니다.' 
                  : '첫 번째 질문을 작성해보세요!'}
              </p>
              <Link to={`/courses/${courseId}/qna/write`}>
                <Button variant="primary">질문하기</Button>
              </Link>
            </div>
          ) : (
            qnaList.map((qna) => (
              <div key={qna.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(qna.status, qna.answers?.length || 0)}
                      {qna.is_private && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          🔒 비공개
                        </span>
                      )}
                    </div>
                    <Link 
                      to={`/courses/${courseId}/qna/${qna.id}`}
                      className="block hover:text-indigo-600"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {qna.title}
                      </h3>
                    </Link>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {qna.content}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>
                      {qna.author.first_name} {qna.author.last_name}
                      {qna.author.role === 'instructor' && ' (강사)'}
                    </span>
                    <span>{formatDate(qna.created_at)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {qna.view_count}
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {qna.like_count}
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {qna.answers?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CourseQnAList;