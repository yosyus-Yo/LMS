import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppSelector } from '../../app/store';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import apiClient from '../../api/apiClient';

interface QnADetail {
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
  updated_at: string;
  author: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
}

const CourseQnADetail: React.FC = () => {
  const { courseId, qnaId } = useParams<{ courseId: string; qnaId: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  
  const [qnaDetail, setQnaDetail] = useState<QnADetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnswerLoading, setIsAnswerLoading] = useState(false);
  const [answerContent, setAnswerContent] = useState('');
  const [isInstructor, setIsInstructor] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [editAnswerContent, setEditAnswerContent] = useState('');

  useEffect(() => {
    if (courseId && qnaId) {
      checkInstructorPermission();
      fetchQnADetail();
    }
  }, [courseId, qnaId]);

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

  const fetchQnADetail = async () => {
    if (!qnaId) return;

    try {
      setIsLoading(true);
      const { data } = await apiClient.courseQnA.getQnAById(qnaId);
      setQnaDetail(data);
    } catch (error) {
      console.error('Q&A 상세 조회 실패:', error);
      alert('질문을 불러올 수 없습니다.');
      navigate(`/courses/${courseId}/qna`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!courseId || !qnaId || !answerContent.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }

    if (!isInstructor && user?.id !== qnaDetail?.author.id) {
      alert('강사 또는 질문 작성자만 답변을 작성할 수 있습니다.');
      return;
    }

    try {
      setIsAnswerLoading(true);
      await apiClient.courseQnA.createAnswer({
        course_id: courseId,
        parent_id: qnaId,
        content: answerContent.trim()
      });

      setAnswerContent('');
      await fetchQnADetail(); // 답변 추가 후 새로고침
      alert(isInstructor ? '답변이 등록되었습니다.' : '댓글이 등록되었습니다.');
    } catch (error) {
      console.error('답변 작성 실패:', error);
      alert(error instanceof Error ? error.message : (isInstructor ? '답변 작성에 실패했습니다.' : '댓글 작성에 실패했습니다.'));
    } finally {
      setIsAnswerLoading(false);
    }
  };

  const handleToggleLike = async () => {
    if (!qnaId) return;

    try {
      const { data } = await apiClient.courseQnA.toggleLike(qnaId);
      setIsLiked(data.liked);
      
      // 좋아요 수 업데이트
      if (qnaDetail) {
        setQnaDetail(prev => prev ? {
          ...prev,
          like_count: data.liked ? prev.like_count + 1 : prev.like_count - 1
        } : null);
      }
    } catch (error) {
      console.error('좋아요 실패:', error);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!qnaId || !qnaDetail) return;

    if (qnaDetail.author.id !== user?.id) {
      alert('본인이 작성한 질문만 삭제할 수 있습니다.');
      return;
    }

    try {
      setIsDeleting(true);
      await apiClient.courseQnA.deleteQnA(qnaId);
      alert('질문이 삭제되었습니다.');
      navigate(`/courses/${courseId}/qna`);
    } catch (error) {
      console.error('질문 삭제 실패:', error);
      alert(error instanceof Error ? error.message : '질문 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleEditAnswer = (answer: QnAAnswer) => {
    setEditingAnswerId(answer.id);
    setEditAnswerContent(answer.content);
  };

  const handleCancelEditAnswer = () => {
    setEditingAnswerId(null);
    setEditAnswerContent('');
  };

  const handleSaveEditAnswer = async (answerId: string) => {
    if (!editAnswerContent.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }

    try {
      await apiClient.courseQnA.updateQnA(answerId, {
        content: editAnswerContent.trim()
      });

      setEditingAnswerId(null);
      setEditAnswerContent('');
      await fetchQnADetail(); // 새로고침
      alert('답변이 수정되었습니다.');
    } catch (error) {
      console.error('답변 수정 실패:', error);
      alert(error instanceof Error ? error.message : '답변 수정에 실패했습니다.');
    }
  };

  const handleDeleteAnswer = async (answerId: string) => {
    if (!window.confirm('답변을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await apiClient.courseQnA.deleteQnA(answerId);
      await fetchQnADetail(); // 새로고침
      alert('답변이 삭제되었습니다.');
    } catch (error) {
      console.error('답변 삭제 실패:', error);
      alert(error instanceof Error ? error.message : '답변 삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string, answerCount: number) => {
    if (answerCount > 0 || status === 'answered') {
      return (
        <span className="inline-flex px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
          ✅ 답변완료
        </span>
      );
    } else if (status === 'pending') {
      return (
        <span className="inline-flex px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">
          ⏳ 답변대기
        </span>
      );
    } else {
      return (
        <span className="inline-flex px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
          🔒 종료
        </span>
      );
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

  if (!qnaDetail) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">질문을 찾을 수 없습니다</h2>
          <Link to={`/courses/${courseId}/qna`}>
            <Button variant="primary">Q&A 목록으로 돌아가기</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            to={`/courses/${courseId}/qna`}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Q&A 목록으로
          </Link>
          
          {user?.id === qnaDetail.author.id && (
            <div className="flex space-x-2">
              <Link to={`/courses/${courseId}/qna/${qnaId}/edit`}>
                <Button variant="secondary" size="sm">수정</Button>
              </Link>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                삭제
              </Button>
            </div>
          )}
        </div>

        {/* 질문 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            {getStatusBadge(qnaDetail.status, qnaDetail.answers?.length || 0)}
            {qnaDetail.is_private && (
              <span className="inline-flex px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
                🔒 비공개
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {qnaDetail.title}
          </h1>

          <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
            <div className="flex items-center space-x-4">
              <span className="font-medium">
                {qnaDetail.author.first_name} {qnaDetail.author.last_name}
                {qnaDetail.author.role === 'instructor' && ' (강사)'}
              </span>
              <span>{formatDate(qnaDetail.created_at)}</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {qnaDetail.view_count}
              </span>
              <button
                onClick={handleToggleLike}
                className={`flex items-center ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
              >
                <svg className="w-4 h-4 mr-1" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {qnaDetail.like_count}
              </button>
            </div>
          </div>

          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {qnaDetail.content}
            </div>
          </div>
        </div>

        {/* 답변 목록 */}
        {qnaDetail.answers && qnaDetail.answers.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              답변 ({qnaDetail.answers.length})
            </h2>
            
            <div className="space-y-4">
              {qnaDetail.answers.map((answer) => (
                <div key={answer.id} className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-blue-900">
                        {answer.author.first_name} {answer.author.last_name}
                        {answer.author.role === 'instructor' && (
                          <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            강사
                          </span>
                        )}
                        {answer.author.id === qnaDetail.author.id && answer.author.role !== 'instructor' && (
                          <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            작성자
                          </span>
                        )}
                      </span>
                      <span className="text-sm text-blue-600">
                        {formatDate(answer.created_at)}
                      </span>
                    </div>
                    
                    {user?.id === answer.author.id && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditAnswer(answer)}
                          className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100 px-2 py-1 rounded"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteAnswer(answer.id)}
                          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-100 px-2 py-1 rounded"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="prose max-w-none">
                    {editingAnswerId === answer.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={editAnswerContent}
                          onChange={(e) => setEditAnswerContent(e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleCancelEditAnswer}
                          >
                            취소
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleSaveEditAnswer(answer.id)}
                            disabled={!editAnswerContent.trim()}
                          >
                            저장
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-blue-900 leading-relaxed">
                        {answer.content}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 답변 작성 (강사 또는 질문 작성자) */}
        {(isInstructor || user?.id === qnaDetail?.author.id) && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isInstructor ? '답변 작성' : '댓글 작성'}
            </h3>
            
            <div className="mb-4">
              <textarea
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                placeholder={
                  isInstructor 
                    ? "학생의 질문에 대한 답변을 작성해주세요..." 
                    : "질문에 대한 추가 설명이나 댓글을 작성해주세요..."
                }
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitAnswer}
                disabled={isAnswerLoading || !answerContent.trim()}
                variant="primary"
              >
                {isAnswerLoading ? '등록 중...' : (isInstructor ? '답변 등록' : '댓글 등록')}
              </Button>
            </div>
          </div>
        )}

        {/* 삭제 확인 모달 */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                질문 삭제 확인
              </h3>
              <p className="text-gray-600 mb-6">
                이 질문을 삭제하시겠습니까? 삭제된 질문과 모든 답변은 복구할 수 없습니다.
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                >
                  취소
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDeleteQuestion}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? '삭제 중...' : '삭제'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CourseQnADetail;