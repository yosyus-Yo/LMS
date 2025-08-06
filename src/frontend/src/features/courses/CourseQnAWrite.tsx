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

const CourseQnAWrite: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourseInfo();
      checkEnrollment();
    }
  }, [courseId]);

  const fetchCourseInfo = async () => {
    if (!courseId) return;

    try {
      const { data } = await apiClient.courses.getById(courseId);
      setCourse(data);
    } catch (error) {
      console.error('강의 정보 조회 실패:', error);
      alert('강의 정보를 불러올 수 없습니다.');
      navigate('/courses');
    }
  };

  const checkEnrollment = async () => {
    if (!courseId || !user) return;

    try {
      const { data: enrollments } = await apiClient.enrollments.getUserEnrollments();
      const enrollment = enrollments.find((e: any) => e.course.id === courseId);
      setIsEnrolled(!!enrollment);
      
      if (!enrollment) {
        alert('수강신청한 강의에서만 질문을 작성할 수 있습니다.');
        navigate(`/courses/${courseId}`);
      }
    } catch (error) {
      console.error('수강신청 확인 실패:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!courseId || !title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    if (!isEnrolled) {
      alert('수강신청한 강의에서만 질문을 작성할 수 있습니다.');
      return;
    }

    try {
      setIsLoading(true);
      
      const { data } = await apiClient.courseQnA.createQuestion({
        course_id: courseId,
        title: title.trim(),
        content: content.trim(),
        is_private: isPrivate
      });

      alert('질문이 등록되었습니다.');
      navigate(`/courses/${courseId}/qna/${data.id}`);
    } catch (error) {
      console.error('질문 작성 실패:', error);
      alert(error instanceof Error ? error.message : '질문 작성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (title.trim() || content.trim()) {
      if (window.confirm('작성 중인 내용이 있습니다. 정말 취소하시겠습니까?')) {
        navigate(`/courses/${courseId}/qna`);
      }
    } else {
      navigate(`/courses/${courseId}/qna`);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-600 mb-4">질문을 작성하려면 로그인해주세요.</p>
          <Button onClick={() => navigate('/login')} variant="primary">
            로그인하기
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
            <h1 className="text-2xl font-bold text-gray-900">질문 작성</h1>
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

        {/* 작성 폼 */}
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
              placeholder="질문 내용을 상세히 작성해주세요. 강의의 어느 부분에 대한 질문인지, 어떤 점이 궁금한지 구체적으로 적어주시면 더 정확한 답변을 받을 수 있습니다."
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

          {/* 작성 가이드 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">💡 좋은 질문 작성 팁</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 구체적인 상황이나 문제를 명시해주세요</li>
              <li>• 강의의 몇 분 몇 초 부분인지 시간을 알려주세요</li>
              <li>• 어떤 부분이 이해되지 않는지 구체적으로 적어주세요</li>
              <li>• 에러가 발생한다면 에러 메시지를 함께 첨부해주세요</li>
            </ul>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              onClick={handleCancel}
              variant="secondary"
              disabled={isLoading}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !title.trim() || !content.trim()}
            >
              {isLoading ? '등록 중...' : '질문 등록'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CourseQnAWrite;