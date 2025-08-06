import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppSelector } from '../../app/store';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import MarkdownEditor from '../../components/common/MarkdownEditor';
import apiClient from '../../api/apiClient';

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  category_id?: string;
  images?: string[];
  author: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
  };
}

const CommunityWrite: React.FC = () => {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId?: string }>();
  const { user } = useAppSelector((state) => state.auth);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const isEditMode = !!postId;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchCategories();
    
    if (isEditMode) {
      fetchPost();
    }
  }, [user, postId, navigate, isEditMode]);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.community.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('카테고리 로딩 실패:', error);
    }
  };

  const fetchPost = async () => {
    if (!postId) return;
    
    try {
      setIsLoading(true);
      const response = await apiClient.community.getPostById(postId);
      const post = response.data;
      
      // 본인 글이 아니면 편집 불가
      if (post.author.id !== user?.id) {
        alert('본인이 작성한 글만 수정할 수 있습니다.');
        navigate('/community');
        return;
      }
      
      setTitle(post.title);
      setContent(post.content);
      setSelectedCategory(post.category_id || '');
      setUploadedImages(post.images || []);
    } catch (error) {
      console.error('게시글 로딩 실패:', error);
      alert('게시글을 불러올 수 없습니다.');
      navigate('/community');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      const uploadPromises = Array.from(files).map(file => 
        apiClient.community.uploadImage(file)
      );
      
      const results = await Promise.all(uploadPromises);
      const newImageUrls = results.map(result => result.data.url);
      
      setUploadedImages(prev => [...prev, ...newImageUrls]);
      
      // 이미지를 마크다운 형식으로 에디터에 삽입
      const imageMarkdown = newImageUrls.map(url => 
        `![업로드된 이미지](${url})`
      ).join('\n');
      
      setContent(prev => prev + '\n' + imageMarkdown);
      
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
    
    // 파일 입력 초기화
    e.target.value = '';
  };

  // 마크다운 에디터용 이미지 업로드 함수
  const handleMarkdownImageUpload = async (file: File): Promise<string> => {
    try {
      const result = await apiClient.community.uploadImage(file);
      const imageUrl = result.data.url;
      setUploadedImages(prev => [...prev, imageUrl]);
      return imageUrl;
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      throw new Error('이미지 업로드에 실패했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    
    if (!content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    
    try {
      const postData = {
        title: title.trim(),
        content: content.trim(),
        category_id: selectedCategory || undefined,
        images: uploadedImages
      };
      
      if (isEditMode && postId) {
        await apiClient.community.updatePost(postId, postData);
        alert('게시글이 수정되었습니다.');
        navigate(`/community/${postId}`);
      } else {
        const response = await apiClient.community.createPost(postData);
        alert('게시글이 작성되었습니다.');
        navigate(`/community/${response.data.id}`);
      }
    } catch (error) {
      console.error('게시글 저장 실패:', error);
      alert('게시글 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const removeImage = (imageUrl: string) => {
    setUploadedImages(prev => prev.filter(url => url !== imageUrl));
    setContent(prev => prev.replace(new RegExp(`!\\[.*?\\]\\(${imageUrl}\\)`, 'g'), ''));
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <p className="text-lg text-gray-600">로그인이 필요합니다.</p>
        </div>
      </Layout>
    );
  }

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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? '게시글 수정' : '새 게시글 작성'}
            </h1>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* 카테고리 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full md:w-64 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">카테고리 선택 (선택사항)</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목 *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목을 입력하세요"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* 이미지 업로드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이미지 첨부
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {isUploading && (
                    <div className="text-sm text-indigo-600">업로드 중...</div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, GIF, WebP 형식, 최대 5MB
                </p>
              </div>

              {/* 업로드된 이미지 미리보기 */}
              {uploadedImages.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    첨부된 이미지
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedImages.map((imageUrl, index) => (
                      <div key={index} className="relative">
                        <img
                          src={imageUrl}
                          alt={`첨부 이미지 ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(imageUrl)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  내용 * (마크다운 지원)
                </label>
                <MarkdownEditor
                  value={content}
                  onChange={setContent}
                  placeholder="마크다운으로 내용을 작성하세요"
                  onImageUpload={handleMarkdownImageUpload}
                />
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/community')}
              >
                취소
              </Button>
              
              <div className="flex space-x-3">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSaving || isUploading}
                >
                  {isSaving ? '저장 중...' : isEditMode ? '수정하기' : '작성하기'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CommunityWrite;