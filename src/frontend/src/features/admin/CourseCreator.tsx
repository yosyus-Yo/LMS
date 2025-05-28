import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../app/store';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { supabase } from '../../lib/supabase';
// import { setupStorageBuckets } from '../../utils/storageSetup';
// import StorageSetupGuide from '../../components/admin/StorageSetupGuide';

interface CourseForm {
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  thumbnail: File | null;
  tags: string[];
}

interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  chapters: Chapter[];
}

interface Chapter {
  id: string;
  title: string;
  description: string;
  content_type: 'video' | 'text' | 'pdf' | 'quiz';
  video_file: File | null;
  video_url: string;
  text_content: string;
  duration_minutes: number;
  order: number;
}

const CourseCreator: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // 관리자 권한 확인
  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') {
      alert('관리자 권한이 필요합니다.');
      navigate('/login');
      return;
    }
  }, [isAuthenticated, user, navigate]);
  
  const [courseForm, setCourseForm] = useState<CourseForm>({
    title: '',
    description: '',
    category: '',
    level: 'beginner',
    price: 0,
    thumbnail: null,
    tags: []
  });

  const [modules, setModules] = useState<Module[]>([]);
  const [newTag, setNewTag] = useState('');
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [categories, setCategories] = useState<{ id: string; name: string; icon?: string }[]>([]);
  const [showStorageGuide, setShowStorageGuide] = useState(false);

  // 컴포넌트 초기화
  useEffect(() => {
    const initializeComponent = async () => {
      // 카테고리 조회
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, icon')
          .order('name');

        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error('카테고리 조회 실패:', error);
        // 기본 카테고리 사용
        setCategories([
          { id: 'temp-1', name: 'AI/머신러닝' },
          { id: 'temp-2', name: '웹 개발' },
          { id: 'temp-3', name: '기타' }
        ]);
      }
    };

    initializeComponent();
  }, []);

  const handleCourseFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCourseForm(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value
    }));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCourseForm(prev => ({ ...prev, thumbnail: file }));
      
      // 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !courseForm.tags.includes(newTag.trim())) {
      setCourseForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setCourseForm(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const addModule = () => {
    const newModule: Module = {
      id: `module_${Date.now()}`,
      title: '',
      description: '',
      order: modules.length + 1,
      chapters: []
    };
    setModules(prev => [...prev, newModule]);
  };

  const updateModule = (moduleId: string, field: keyof Module, value: any) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId ? { ...module, [field]: value } : module
    ));
  };

  const removeModule = (moduleId: string) => {
    setModules(prev => prev.filter(module => module.id !== moduleId));
  };

  const addChapter = (moduleId: string) => {
    const newChapter: Chapter = {
      id: `chapter_${Date.now()}`,
      title: '',
      description: '',
      content_type: 'video',
      video_file: null,
      video_url: '',
      text_content: '',
      duration_minutes: 0,
      order: 1
    };

    setModules(prev => prev.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          chapters: [...module.chapters, { ...newChapter, order: module.chapters.length + 1 }]
        };
      }
      return module;
    }));
  };

  const updateChapter = (moduleId: string, chapterId: string, field: keyof Chapter, value: any) => {
    setModules(prev => prev.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          chapters: module.chapters.map(chapter =>
            chapter.id === chapterId ? { ...chapter, [field]: value } : chapter
          )
        };
      }
      return module;
    }));
  };

  const removeChapter = (moduleId: string, chapterId: string) => {
    setModules(prev => prev.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          chapters: module.chapters.filter(chapter => chapter.id !== chapterId)
        };
      }
      return module;
    }));
  };

  // 비디오 길이 감지 함수
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const durationInMinutes = Math.ceil(video.duration / 60);
        resolve(durationInMinutes);
      };
      
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error('비디오 길이를 읽을 수 없습니다.'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const handleVideoUpload = async (moduleId: string, chapterId: string, file: File) => {
    try {
      console.log('🔄 비디오 업로드 시작:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        moduleId,
        chapterId
      });

      // 1. 파일 유효성 검사
      const maxSize = 500 * 1024 * 1024; // 500MB
      const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime'];
      
      if (file.size > maxSize) {
        throw new Error(`파일 크기가 너무 큽니다. 최대 500MB까지 업로드 가능합니다. (현재: ${Math.round(file.size / 1024 / 1024)}MB)`);
      }
      
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`지원하지 않는 파일 형식입니다. 지원 형식: MP4, WebM, OGG, AVI, MOV (현재: ${file.type})`);
      }

      // 2. 비디오 길이 감지
      console.log('📏 비디오 길이 감지 중...');
      const duration = await getVideoDuration(file);
      console.log(`⏱️ 비디오 길이: ${duration}분`);
      
      // 3. 파일 경로 생성
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `courses/${moduleId}/${chapterId}/${fileName}`;

      console.log('📁 업로드 경로:', filePath);
      
      // 4. Storage 버킷 사용 (기존 chapter-files 우선)
      let bucketName = 'chapter-files'; // 기본값: 기존 버킷 사용
      
      try {
        // 버킷 목록 조회 시도 (권한이 있다면)
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (!listError && buckets) {
          console.log('📋 조회된 버킷들:', buckets.map(b => `${b.name}(${b.public ? 'public' : 'private'})`));
          
          // 사용 가능한 버킷 우선순위: chapter-files > course-videos
          const availableBucket = buckets.find(bucket => 
            bucket.name === 'chapter-files' || bucket.name === 'course-videos'
          );
          
          if (availableBucket) {
            bucketName = availableBucket.name;
            console.log('✅ 발견된 버킷 사용:', bucketName, '(public:', availableBucket.public + ')');
            
            if (!availableBucket.public) {
              console.warn('⚠️ 버킷이 private 상태입니다. Public으로 변경이 필요할 수 있습니다.');
            }
          } else {
            console.warn('⚠️ 권장 버킷을 찾을 수 없어 chapter-files 시도');
          }
        } else {
          console.warn('⚠️ 버킷 목록 조회 실패 (권한 부족), chapter-files 사용 시도:', listError?.message);
        }
      } catch (error) {
        console.warn('⚠️ 버킷 조회 중 오류, chapter-files 사용 시도:', error);
      }
      
      console.log('🎯 사용할 버킷:', bucketName);
      
      // 5. Supabase Storage에 비디오 업로드
      console.log('⬆️ 파일 업로드 시작... (버킷:', bucketName + ')');
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Supabase 업로드 오류:', error);
        throw new Error(`업로드 실패: ${error.message}`);
      }

      console.log('✅ 업로드 성공:', data);

      // 6. 업로드된 파일의 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      console.log('📹 생성된 비디오 URL:', publicUrl);

      // 7. URL 유효성 테스트
      try {
        const testResponse = await fetch(publicUrl, { method: 'HEAD' });
        if (!testResponse.ok) {
          console.warn('⚠️ 생성된 URL에 접근할 수 없습니다:', testResponse.status);
        } else {
          console.log('✅ URL 접근 가능 확인됨');
        }
      } catch (urlError) {
        console.warn('⚠️ URL 테스트 실패:', urlError);
      }

      // 8. 챕터 업데이트 (길이 포함)
      updateChapter(moduleId, chapterId, 'video_url', publicUrl);
      updateChapter(moduleId, chapterId, 'duration_minutes', duration);
      updateChapter(moduleId, chapterId, 'video_file', file);

      alert(`동영상이 성공적으로 업로드되었습니다!\n- 파일명: ${file.name}\n- 길이: ${duration}분\n- 크기: ${Math.round(file.size / 1024 / 1024)}MB`);
    } catch (error: any) {
      console.error('❌ 동영상 업로드 실패:', error);
      alert('동영상 업로드에 실패했습니다:\n\n' + error.message);
    }
  };

  const uploadThumbnail = async (): Promise<string | null> => {
    if (!courseForm.thumbnail) return null;

    try {
      const fileExt = courseForm.thumbnail.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `course_${Date.now()}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('course-thumbnails')
        .upload(filePath, courseForm.thumbnail);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('course-thumbnails')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('썸네일 업로드 실패:', error);
      throw error;
    }
  };

  // slug 생성 함수
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // 특수문자 제거
      .replace(/\s+/g, '-') // 공백을 하이픈으로
      .replace(/-+/g, '-') // 연속 하이픈 제거
      .trim()
      + '-' + Date.now(); // 고유성을 위해 타임스탬프 추가
  };

  const createCourse = async () => {
    try {
      setIsLoading(true);

      // 1. 썸네일 업로드
      const thumbnailUrl = await uploadThumbnail();

      // 2. 현재 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다');

      // 3. slug 생성
      const courseSlug = generateSlug(courseForm.title);

      // 4. 카테고리 ID 찾기
      const selectedCategory = categories.find(cat => cat.name === courseForm.category);
      
      // 5. 강의 생성
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
          title: courseForm.title,
          slug: courseSlug,
          description: courseForm.description,
          short_description: courseForm.description.substring(0, 200),
          instructor_id: user.id,
          category_id: selectedCategory?.id || null,
          level: courseForm.level,
          price: courseForm.price,
          thumbnail_url: thumbnailUrl,
          status: 'draft',
          tags: courseForm.tags,
          learning_outcomes: [],
          language: 'Korean'
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // 4. 모듈과 챕터 생성
      for (const module of modules) {
        const { data: createdModule, error: moduleError } = await supabase
          .from('modules')
          .insert({
            title: module.title,
            description: module.description,
            course_id: course.id,
            order_index: module.order
          })
          .select()
          .single();

        if (moduleError) throw moduleError;

        // 챕터 생성
        for (const chapter of module.chapters) {
          const { error: chapterError } = await supabase
            .from('chapters')
            .insert({
              title: chapter.title,
              description: chapter.description,
              content_type: chapter.content_type,
              video_url: chapter.video_url,
              content: chapter.text_content,
              duration_minutes: chapter.duration_minutes,
              module_id: createdModule.id,
              order_index: chapter.order
            });

          if (chapterError) throw chapterError;
        }
      }

      alert('강의가 성공적으로 생성되었습니다!');
      navigate('/admin');

    } catch (error: any) {
      console.error('강의 생성 실패:', error);
      alert('강의 생성에 실패했습니다: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      return !!(courseForm.title && courseForm.description && courseForm.category);
    }
    if (step === 2) {
      return modules.length > 0 && modules.every(module => 
        module.title && module.chapters.length > 0 && 
        module.chapters.every(chapter => chapter.title)
      );
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    } else {
      alert('필수 정보를 모두 입력해주세요.');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">새 강의 만들기</h1>
          <div className="flex space-x-2">
            <Button variant="secondary" onClick={() => navigate('/admin')}>
              취소
            </Button>
          </div>
        </div>

        {/* 진행 단계 표시 */}
        <div className="flex items-center justify-center space-x-8 mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-300 text-gray-500'
              }`}>
                {step}
              </div>
              <span className={`ml-2 text-sm ${
                currentStep >= step ? 'text-indigo-600' : 'text-gray-500'
              }`}>
                {step === 1 ? '기본 정보' : step === 2 ? '커리큘럼' : '미리보기'}
              </span>
              {step < 3 && <div className="w-16 h-0.5 bg-gray-300 ml-4" />}
            </div>
          ))}
        </div>

        {/* 단계별 컨텐츠 */}
        <div className="bg-white rounded-lg shadow p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">강의 기본 정보</h2>
              
              <Input
                label="강의 제목 *"
                name="title"
                value={courseForm.title}
                onChange={handleCourseFormChange}
                placeholder="강의 제목을 입력하세요"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  강의 설명 *
                </label>
                <textarea
                  name="description"
                  value={courseForm.description}
                  onChange={handleCourseFormChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="강의에 대한 자세한 설명을 입력하세요"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    카테고리 *
                  </label>
                  <select
                    name="category"
                    value={courseForm.category}
                    onChange={handleCourseFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">카테고리 선택</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.icon ? `${category.icon} ${category.name}` : category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    난이도
                  </label>
                  <select
                    name="level"
                    value={courseForm.level}
                    onChange={handleCourseFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="beginner">초급</option>
                    <option value="intermediate">중급</option>
                    <option value="advanced">고급</option>
                  </select>
                </div>
              </div>

              <Input
                label="강의 가격 (원)"
                name="price"
                type="number"
                value={courseForm.price}
                onChange={handleCourseFormChange}
                placeholder="0"
                min="0"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  썸네일 이미지
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleThumbnailChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    이미지 선택
                  </Button>
                  {thumbnailPreview && (
                    <img
                      src={thumbnailPreview}
                      alt="썸네일 미리보기"
                      className="w-20 h-20 object-cover rounded-md border"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  태그
                </label>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    placeholder="태그 입력"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Button type="button" onClick={addTag} variant="secondary">
                    추가
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {courseForm.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="ml-2 text-indigo-600 hover:text-indigo-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">커리큘럼 구성</h2>
                <Button onClick={addModule} variant="primary">
                  모듈 추가
                </Button>
              </div>

              {modules.map((module, moduleIndex) => (
                <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium">모듈 {moduleIndex + 1}</h3>
                    <Button
                      onClick={() => removeModule(module.id)}
                      variant="secondary"
                      className="text-red-600 hover:text-red-800"
                    >
                      삭제
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <Input
                      label="모듈 제목 *"
                      value={module.title}
                      onChange={(e) => updateModule(module.id, 'title', e.target.value)}
                      placeholder="모듈 제목"
                      required
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        모듈 설명
                      </label>
                      <textarea
                        value={module.description}
                        onChange={(e) => updateModule(module.id, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="모듈 설명"
                      />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">챕터</h4>
                        <Button
                          onClick={() => addChapter(module.id)}
                          variant="secondary"
                          size="sm"
                        >
                          챕터 추가
                        </Button>
                      </div>

                      {module.chapters.map((chapter, chapterIndex) => (
                        <div key={chapter.id} className="bg-white p-3 rounded border mb-3">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-sm font-medium">챕터 {chapterIndex + 1}</span>
                            <Button
                              onClick={() => removeChapter(module.id, chapter.id)}
                              variant="secondary"
                              size="sm"
                              className="text-red-600 hover:text-red-800"
                            >
                              삭제
                            </Button>
                          </div>

                          <div className="space-y-3">
                            <Input
                              label="챕터 제목 *"
                              value={chapter.title}
                              onChange={(e) => updateChapter(module.id, chapter.id, 'title', e.target.value)}
                              placeholder="챕터 제목"
                              required
                            />

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                콘텐츠 유형
                              </label>
                              <select
                                value={chapter.content_type}
                                onChange={(e) => updateChapter(module.id, chapter.id, 'content_type', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="video">동영상</option>
                                <option value="text">텍스트</option>
                                <option value="pdf">PDF</option>
                                <option value="quiz">퀴즈</option>
                              </select>
                            </div>

                            {chapter.content_type === 'video' && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  동영상 파일
                                </label>
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleVideoUpload(module.id, chapter.id, file);
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                {chapter.video_url && (
                                  <div className="mt-2 space-y-1">
                                    <p className="text-sm text-green-600">
                                      ✅ 동영상이 업로드되었습니다
                                    </p>
                                    {chapter.duration_minutes > 0 && (
                                      <p className="text-sm text-blue-600">
                                        📺 재생 시간: {chapter.duration_minutes}분
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                챕터 설명
                              </label>
                              <textarea
                                value={chapter.description}
                                onChange={(e) => updateChapter(module.id, chapter.id, 'description', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="챕터 설명 (선택사항)"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">강의 미리보기</h2>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">{courseForm.title}</h3>
                <p className="text-gray-600 mb-4">{courseForm.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">카테고리: </span>
                    <span>{courseForm.category}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">난이도: </span>
                    <span>{courseForm.level === 'beginner' ? '초급' : courseForm.level === 'intermediate' ? '중급' : '고급'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">가격: </span>
                    <span>{courseForm.price.toLocaleString()}원</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">모듈 수: </span>
                    <span>{modules.length}개</span>
                  </div>
                </div>

                {courseForm.tags.length > 0 && (
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-500">태그: </span>
                    {courseForm.tags.map((tag, index) => (
                      <span key={index} className="inline-block bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm mr-2">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="font-medium">커리큘럼</h4>
                  {modules.map((module, moduleIndex) => (
                    <div key={module.id} className="bg-white p-3 rounded border">
                      <h5 className="font-medium">모듈 {moduleIndex + 1}: {module.title}</h5>
                      <p className="text-sm text-gray-600 mb-2">{module.description}</p>
                      <ul className="text-sm space-y-1">
                        {module.chapters.map((chapter, chapterIndex) => (
                          <li key={chapter.id} className="flex justify-between">
                            <span>• {chapter.title}</span>
                            <span className="text-gray-500">{chapter.duration_minutes}분</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 네비게이션 버튼 */}
        <div className="flex justify-between">
          <div className="flex space-x-2">
            <Button
              onClick={prevStep}
              variant="secondary"
              disabled={currentStep === 1}
            >
              이전
            </Button>
            
            <Button
              onClick={() => setShowStorageGuide(true)}
              variant="secondary"
              className="bg-orange-100 text-orange-700 hover:bg-orange-200"
            >
              📁 Storage 설정 가이드
            </Button>
          </div>

          <div className="flex space-x-2">
            {currentStep < 3 ? (
              <Button onClick={nextStep} variant="primary">
                다음
              </Button>
            ) : (
              <Button
                onClick={createCourse}
                variant="primary"
                isLoading={isLoading}
              >
                강의 생성
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Storage 설정 가이드 모달 */}
      {showStorageGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Storage 설정 안내</h3>
            <p className="text-gray-600 mb-4">
              Supabase Storage 버킷이 설정되지 않았습니다. 
              관리자 콘솔에서 버킷을 설정해주세요.
            </p>
            <Button onClick={() => setShowStorageGuide(false)} variant="primary">
              확인
            </Button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CourseCreator;