import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppSelector } from '../../app/store';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import apiClient from '../../api/apiClient';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  parent_id?: string;
  author: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
  };
}

interface Post {
  id: string;
  title: string;
  content: string;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
  images?: string[];
  author: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
  };
  category?: {
    id: string;
    name: string;
  };
  comments: Comment[];
}

const CommunityDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const fetchPost = async () => {
    if (!postId) return;
    
    try {
      setIsLoading(true);
      const response = await apiClient.community.getPostById(postId);
      setPost(response.data);
    } catch (error) {
      console.error('게시글 로딩 실패:', error);
      alert('게시글을 불러올 수 없습니다.');
      navigate('/community');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!post || !postId) return;
    
    const confirmMessage = `정말로 이 게시글을 삭제하시겠습니까?\n\n⚠️ 다음 데이터가 모두 삭제됩니다:\n• 게시글 내용\n• 모든 댓글 (${post.comments?.length || 0}개)\n• 첨부된 이미지 파일\n\n이 작업은 되돌릴 수 없습니다.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    try {
      await apiClient.community.deletePost(postId);
      alert('게시글과 모든 관련 데이터가 삭제되었습니다.');
      navigate('/community');
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      alert('게시글 삭제에 실패했습니다.');
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    
    if (!newComment.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }
    
    if (!postId) return;
    
    setIsSubmittingComment(true);
    
    try {
      await apiClient.community.createComment({
        post_id: postId,
        content: newComment.trim()
      });
      
      setNewComment('');
      await fetchPost(); // 댓글 목록 새로고침
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      alert('댓글 작성에 실패했습니다.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content);
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editingCommentContent.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }
    
    try {
      await apiClient.community.updateComment(commentId, editingCommentContent.trim());
      setEditingCommentId(null);
      setEditingCommentContent('');
      await fetchPost(); // 댓글 목록 새로고침
    } catch (error) {
      console.error('댓글 수정 실패:', error);
      alert('댓글 수정에 실패했습니다.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      await apiClient.community.deleteComment(commentId);
      await fetchPost(); // 댓글 목록 새로고침
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getAuthorName = (author: Post['author'] | Comment['author']) => {
    if (author.first_name && author.last_name) {
      return `${author.first_name} ${author.last_name}`;
    }
    return author.email.split('@')[0];
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

  if (!post) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <p className="text-lg text-gray-600">게시글을 찾을 수 없습니다.</p>
        </div>
      </Layout>
    );
  }

  const isAuthor = user?.id === post.author.id;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 뒤로 가기 */}
        <div className="mb-6">
          <Link 
            to="/community"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            목록으로 돌아가기
          </Link>
        </div>

        {/* 게시글 */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {post.category && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {post.category.name}
                  </span>
                )}
              </div>
              
              {isAuthor && (
                <div className="flex space-x-2">
                  <Link to={`/community/write/${post.id}`}>
                    <Button variant="secondary" size="sm">
                      수정
                    </Button>
                  </Link>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={handleDeletePost}
                    className="text-red-600 hover:text-red-800"
                  >
                    삭제
                  </Button>
                </div>
              )}
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>
            
            <div className="flex items-center text-sm text-gray-500 space-x-4">
              <span>{getAuthorName(post.author)}</span>
              <span>{formatDate(post.created_at)}</span>
              <span>조회 {post.view_count}</span>
            </div>
          </div>
          
          <div className="px-6 py-6">
            <div className="prose max-w-none prose-lg prose-headings:text-gray-900 prose-a:text-indigo-600 prose-strong:text-gray-900 prose-code:text-indigo-600 prose-code:bg-gray-100 prose-pre:bg-gray-900">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code(props: any) {
                    const { children, className, node, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || '');
                    return match ? (
                      <SyntaxHighlighter
                        style={tomorrow}
                        language={match[1]}
                        PreTag="div"
                        {...rest}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...rest}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              댓글 ({post.comments?.length || 0})
            </h2>
          </div>
          
          {/* 댓글 작성 */}
          {user ? (
            <div className="px-6 py-4 border-b border-gray-200">
              <form onSubmit={handleSubmitComment}>
                <div className="mb-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="댓글을 작성하세요..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    variant="primary"
                    disabled={isSubmittingComment}
                  >
                    {isSubmittingComment ? '작성 중...' : '댓글 작성'}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="px-6 py-4 border-b border-gray-200 text-center">
              <p className="text-gray-500 mb-2">댓글을 작성하려면 로그인해주세요.</p>
              <Link to="/login">
                <Button variant="primary" size="sm">
                  로그인
                </Button>
              </Link>
            </div>
          )}
          
          {/* 댓글 목록 */}
          <div className="divide-y divide-gray-200">
            {post.comments && post.comments.length > 0 ? (
              post.comments.map((comment) => (
                <div key={comment.id} className="px-6 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {getAuthorName(comment.author)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(comment.created_at)}
                      </span>
                      {comment.updated_at !== comment.created_at && (
                        <span className="text-xs text-gray-400">(편집됨)</span>
                      )}
                    </div>
                    
                    {user?.id === comment.author.id && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditComment(comment)}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-sm text-red-500 hover:text-red-700"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {editingCommentId === comment.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingCommentContent}
                        onChange={(e) => setEditingCommentContent(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleUpdateComment(comment.id)}
                        >
                          수정 완료
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditingCommentContent('');
                          }}
                        >
                          취소
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700">{comment.content}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CommunityDetail;