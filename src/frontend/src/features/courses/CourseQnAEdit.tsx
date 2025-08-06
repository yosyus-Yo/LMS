import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../app/store';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import apiClient from '../../api/apiClient';

interface Course {
  id: string;
  title: string;
  instructor: {
    first_name: string;
    last_name: string;
  };
}

interface QnAItem {
  id: string;
  title: string;
  content: string;
  is_private: boolean;
  author: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

const CourseQnAEdit: React.FC = () => {
  const { courseId, qnaId } = useParams<{ courseId: string; qnaId: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [qnaItem, setQnaItem] = useState<QnAItem | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (courseId && qnaId) {
      fetchData();
    }
  }, [courseId, qnaId]);

  const fetchData = async () => {
    if (!courseId || !qnaId) return;

    try {
      setIsLoading(true);
      
      // 강의 정보와 Q&A 정보를 병렬로 가져오기
      const [courseResponse, qnaResponse] = await Promise.all([
        apiClient.courses.getById(courseId),
        apiClient.courseQnA.getQnAById(qnaId)
      ]);

      setCourse(courseResponse.data);
      setQnaItem(qnaResponse.data);
      
      // 폼 데이터 설정
      setTitle(qnaResponse.data.title || '');
      setContent(qnaResponse.data.content || '');
      setIsPrivate(qnaResponse.data.is_private || false);

      // 작성자 권한 확인
      if (user && qnaResponse.data.author.id !== user.id) {
        alert('본인이 작성한 질문만 수정할 수 있습니다.');
        navigate(`/courses/${courseId}/qna/${qnaId}`);
        return;
      }

    } catch (error) {
      console.error('데이터 조회 실패:', error);
      alert('질문 정보를 불러올 수 없습니다.');
      navigate(`/courses/${courseId}/qna`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!courseId || !qnaId || !title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    if (!qnaItem || qnaItem.author.id !== user?.id) {
      alert('본인이 작성한 질문만 수정할 수 있습니다.');
      return;
    }

    try {
      setIsSaving(true);
      
      await apiClient.courseQnA.updateQnA(qnaId, {
        title: title.trim(),
        content: content.trim(),
        is_private: isPrivate
      });

      alert('질문이 수정되었습니다.');
      navigate(`/courses/${courseId}/qna/${qnaId}`);
    } catch (error) {
      console.error('질문 수정 실패:', error);
      alert(error instanceof Error ? error.message : '질문 수정에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    const hasChanges = 
      title !== qnaItem?.title || 
      content !== qnaItem?.content || 
      isPrivate !== qnaItem?.is_private;

    if (hasChanges) {
      if (window.confirm('변경사항이 있습니다. 정말 취소하시겠습니까?')) {
        navigate(`/courses/${courseId}/qna/${qnaId}`);
      }
    } else {
      navigate(`/courses/${courseId}/qna/${qnaId}`);
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

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-600 mb-4">질문을 수정하려면 로그인해주세요.</p>
          <Button onClick={() => navigate('/login')} variant="primary">
            로그인하기
          </Button>
        </div>
      </Layout>
    );
  }

  if (!qnaItem) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">질문을 찾을 수 없습니다</h2>
          <Button onClick={() => navigate(`/courses/${courseId}/qna`)} variant="primary">
            Q&A 목록으로 돌아가기
          </Button>
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
            <h1 className="text-2xl font-bold text-gray-900">질문 수정</h1>
            <button
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {course && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-blue-900 font-medium">{course.title}</span>
                <span className="text-blue-600 ml-2">
                  - {course.instructor.first_name} {course.instructor.last_name} 강사
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 수정 폼 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6">
          {/* 제목 */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              질문 제목 *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="질문의 제목을 입력해주세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* 내용 */}
          <div className="mb-6">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              질문 내용 *
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="질문 내용을 상세히 작성해주세요."
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              required
            />
            <div className="text-sm text-gray-500 mt-1">
              {content.length}/1000자
            </div>
          </div>

          {/* 공개 설정 */}
          <div className="mb-6">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isPrivate"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isPrivate" className="text-sm font-medium text-gray-700">
                비공개 질문으로 설정
              </label>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {isPrivate 
                ? '강사와 본인만 볼 수 있는 개인적인 질문입니다.' 
                : '다른 수강생들도 볼 수 있는 공개 질문입니다.'
              }
            </div>
          </div>

          {/* 수정 안내 */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-yellow-800 mb-1">수정 시 주의사항</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• 질문이 수정되면 다른 수강생들에게도 변경된 내용이 표시됩니다</li>
                  <li>• 이미 작성된 답변은 유지되며, 수정된 질문에 대한 추가 답변을 받을 수 있습니다</li>
                  <li>• 공개/비공개 설정을 변경할 수 있습니다</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              onClick={handleCancel}
              variant="secondary"
              disabled={isSaving}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSaving || !title.trim() || !content.trim()}
            >
              {isSaving ? '수정 중...' : '수정 완료'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CourseQnAEdit;