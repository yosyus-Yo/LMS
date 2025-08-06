import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../app/store';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import apiClient from '../../api/apiClient';

interface Post {
  id: string;
  title: string;
  content: string;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
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
  comment_count: number;
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

const CommunityList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, [selectedCategory, searchTerm, currentPage]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const [postsResponse, categoriesResponse] = await Promise.all([
        apiClient.community.getPosts({
          category: selectedCategory || undefined,
          search: searchTerm || undefined,
          page: currentPage,
          limit: postsPerPage
        }),
        apiClient.community.getCategories()
      ]);
      
      setPosts(postsResponse.data || []);
      setCategories(categoriesResponse.data || []);
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
      setPosts([]);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchData();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return '오늘';
    } else if (diffDays === 2) {
      return '어제';
    } else if (diffDays <= 7) {
      return `${diffDays - 1}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

  const getAuthorName = (author: Post['author']) => {
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

  return (
    <Layout>
      <div className="px-4 py-6">
        {/* 모바일 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">💬 커뮤니티</h1>
          <p className="text-gray-600 text-sm">학습자들과 자유롭게 소통하세요</p>
        </div>

        {/* 검색 및 필터 - 모바일 최적화 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <form onSubmit={handleSearch} className="space-y-3">
            <input
              type="text"
              placeholder="제목이나 내용으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 border border-gray-300 rounded-md px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">전체 카테고리</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="primary" className="px-6">
                🔍
              </Button>
            </div>
          </form>
        </div>

        {/* 글쓰기 버튼 - 모바일용 */}
        {user && (
          <div className="mb-4">
            <Link to="/community/write" className="block">
              <Button variant="primary" className="w-full py-3 text-base">
                ✍️ 새 글 작성하기
              </Button>
            </Link>
          </div>
        )}

        {/* 게시글 목록 - 모바일 카드 형태 */}
        {posts.length > 0 ? (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                {/* 카테고리 태그 */}
                {post.category && (
                  <div className="mb-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {post.category.name}
                    </span>
                  </div>
                )}
                
                {/* 제목 및 댓글 수 */}
                <Link 
                  to={`/community/${post.id}`}
                  className="block mb-3"
                >
                  <h3 className="text-base font-semibold text-gray-900 leading-5 mb-1">
                    {post.title}
                    {typeof post.comment_count === 'number' && post.comment_count > 0 && (
                      <span className="ml-1 text-red-500 text-sm font-medium">
                        [{post.comment_count}]
                      </span>
                    )}
                  </h3>
                </Link>
                
                {/* 메타 정보 */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center">
                      👤 {getAuthorName(post.author)}
                    </span>
                    <span className="flex items-center">
                      📅 {formatDate(post.created_at)}
                    </span>
                  </div>
                  <span className="flex items-center">
                    👁️ {post.view_count || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 14v20c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14m-16-4c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252" />
              </svg>
            </div>
            <p className="text-base text-gray-500 mb-2">📝 아직 게시글이 없습니다</p>
            <p className="text-sm text-gray-400 mb-6">첫 번째 게시글을 작성해보세요!</p>
            {user && (
              <Link to="/community/write" className="block">
                <Button variant="primary" className="w-full py-3">
                  ✍️ 첫 글 작성하기
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* 페이지네이션 - 모바일 최적화 */}
        {posts.length > 0 && (
          <div className="flex justify-center mt-6">
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-4 py-2 text-sm"
              >
                ← 이전
              </Button>
              <div className="flex items-center px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-md">
                {currentPage}
              </div>
              <Button
                variant="secondary"
                disabled={posts.length < postsPerPage}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-4 py-2 text-sm"
              >
                다음 →
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CommunityList;