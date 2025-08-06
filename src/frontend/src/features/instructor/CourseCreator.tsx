import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppSelector } from '../../app/store';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import apiClient from '../../api/apiClient';
import { supabase } from '../../lib/supabase';
import { storageService } from '../../utils/supabaseStorage';

// Course 타입 정의
interface CourseWeek {
  id: string;
  week_number: number;
  title: string;
  description?: string;
  video_url?: string;
  video_file?: File; // 업로드할 파일
  materials?: string; // JSON string으로 저장된 자료 목록
  duration_minutes?: number;
  is_published: boolean;
  order_index: number;
}

interface Course {
  id?: string;
  title: string;
  description?: string;
  introduction?: string;
  content?: string;
  video_url?: string;
  thumbnail_url?: string; // 강의 썸네일 URL
  weeks?: CourseWeek[];
  status: 'draft' | 'published';
  level?: string;
  price?: number;
  is_free?: boolean;
}

const CourseCreator: React.FC = () => {
  const { courseId } = useParams<{ courseId?: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  
  const [course, setCourse] = useState<Course>({
    title: '',
    description: '',
    weeks: [],
    status: 'draft',
    level: 'beginner',
    price: 0,
    is_free: true
  });
  
  const [selectedWeek, setSelectedWeek] = useState<CourseWeek | null>(null);
  const [isEditingWeek, setIsEditingWeek] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailUploadProgress, setThumbnailUploadProgress] = useState(0);
  const [thumbnailUrl, setThumbnailUrl] = useState(''); // 썸네일 URL을 별도 state로 관리
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = !!courseId;

  useEffect(() => {
    if (isEditMode && courseId) {
      loadCourse();
    } else {
      // 새 강의 생성 시 0주차를 기본으로 생성
      initializeNewCourse();
    }
  }, [courseId]);

  // 페이지 이탈 시 임시 파일 정리
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isEditMode) {
        // 새 강의 생성 중이면 임시 파일 정리
        storageService.cleanupTempUploads();
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handlePopState = () => {
      if (!isEditMode) {
        storageService.cleanupTempUploads();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isEditMode]);

  const initializeNewCourse = () => {
    const week0: CourseWeek = {
      id: 'temp-week-0',
      week_number: 0,
      title: '강의 소개',
      description: '강의 소개 및 개요',
      video_url: '',
      materials: '',
      duration_minutes: 0,
      is_published: false,
      order_index: 0
    };

    setCourse(prev => ({
      ...prev,
      weeks: [week0]
    }));
    
    // 새 강의 생성 시에는 강의 소개 화면을 먼저 보여주기 위해 selectedWeek를 null로 설정
    setSelectedWeek(null);
  };

  const loadCourse = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.courses.getById(courseId!);
      const courseData = response.data;
      
      // 주차 데이터 불러오기
      const weeksResponse = await apiClient.modules.getWeeks(courseId!);
      courseData.weeks = weeksResponse.data;
      
      setCourse(courseData);
      
      // 썸네일 URL 설정
      if (courseData.thumbnail_url) {
        setThumbnailUrl(courseData.thumbnail_url);
      }
      
      // 0주차를 우선으로 선택, 없으면 첫 번째 주차 선택
      if (courseData.weeks && courseData.weeks.length > 0) {
        const week0 = courseData.weeks.find((week: CourseWeek) => week.week_number === 0);
        const firstWeek = week0 || courseData.weeks[0];
        setSelectedWeek(firstWeek);
      }
    } catch (error) {
      console.error('강의 로딩 실패:', error);
      alert('강의를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCourse = async () => {
    try {
      setIsSaving(true);
      
      if (!course.title.trim()) {
        alert('강의 제목을 입력해주세요.');
        return;
      }

      const courseData = {
        title: course.title,
        description: course.description,
        level: course.level,
        status: course.status,
        price: course.price,
        is_free: course.is_free,
        thumbnail_url: thumbnailUrl,
        instructor_id: user?.id
      };

      if (isEditMode && courseId) {
        // 강의 기본 정보 업데이트
        await apiClient.courses.update(courseId, courseData);
        
        // 주차 데이터 저장
        if (course.weeks && course.weeks.length > 0) {
          await apiClient.modules.saveWeeks(courseId, course.weeks);
        }
        
        alert('강의가 수정되었습니다.');
        navigate('/my-courses');
      } else {
        // 새 강의 생성
        const result = await apiClient.courses.create(courseData);
        const newCourseId = result.data.id;
        
        // 주차 데이터 저장
        if (course.weeks && course.weeks.length > 0) {
          await apiClient.modules.saveWeeks(newCourseId, course.weeks);
        }
        
        // 강의 생성 성공 시 임시 파일을 정식 파일로 전환 (추적에서 제거)
        storageService.tempUploadedFiles.forEach(filePath => {
          storageService.removeTempUpload(filePath);
        });
        
        alert('강의가 생성되었습니다.');
        navigate('/my-courses');
      }
    } catch (error) {
      console.error('강의 저장 실패:', error);
      alert('강의 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const uploadVideoToSupabase = async (file: File, weekNumber: number): Promise<{ url: string; duration: number; filePath: string }> => {
    try {
      setUploading(true);
      setUploadProgress(0);

      // Storage 서비스를 사용하여 업로드 (URL과 duration 반환)
      const result = await storageService.uploadVideoWithProgress(
        file,
        courseId || 'new',
        weekNumber,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      return result;
    } catch (error) {
      console.error('영상 업로드 실패:', error);
      throw error;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // 썸네일 파일 선택 핸들러
  const handleThumbnailFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('파일 선택됨:', file?.name, file?.size);
    
    if (!file) {
      console.log('선택된 파일이 없습니다.');
      return;
    }

    // 파일 크기 체크 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.');
      e.target.value = ''; // 파일 선택 초기화
      return;
    }

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      e.target.value = ''; // 파일 선택 초기화
      return;
    }

    handleThumbnailUpload(file);
    e.target.value = ''; // 업로드 후 파일 선택 초기화 (같은 파일 재선택 가능하게)
  };

  const handleThumbnailUpload = async (file: File) => {
    try {
      setThumbnailUploading(true);
      setThumbnailUploadProgress(0);

      console.log('썸네일 업로드 시작:', file.name);

      // Storage 서비스를 사용하여 썸네일 업로드
      const thumbnailUrl = await storageService.uploadThumbnail(
        file,
        courseId || 'new',
        (progress) => {
          setThumbnailUploadProgress(progress);
        }
      );

      setThumbnailUrl(thumbnailUrl);
      console.log('썸네일 URL 설정 완료:', thumbnailUrl);
      
      // 편집 모드일 때 썸네일 업로드 후 자동 저장
      if (isEditMode && courseId) {
        const courseData = {
          title: course.title,
          description: course.description,
          level: course.level,
          status: course.status,
          price: course.price,
          is_free: course.is_free,
          thumbnail_url: thumbnailUrl,
          instructor_id: user?.id
        };
        
        await apiClient.courses.update(courseId, courseData);
        console.log('썸네일이 강의에 저장되었습니다.');
      }
      
      alert('썸네일이 성공적으로 업로드되었습니다!');
    } catch (error) {
      console.error('썸네일 업로드 실패:', error);
      alert('썸네일 업로드에 실패했습니다.');
    } finally {
      setThumbnailUploading(false);
      setThumbnailUploadProgress(0);
    }
  };

  const handleAddWeek = async () => {
    const currentWeeks = course.weeks || [];
    const nextWeekNumber = currentWeeks.length === 0 ? 0 : Math.max(...currentWeeks.map(w => w.week_number)) + 1;
    
    const newWeek: CourseWeek = {
      id: `temp-${Date.now()}`,
      week_number: nextWeekNumber,
      title: nextWeekNumber === 0 ? '강의 소개' : `${nextWeekNumber}주차`,
      description: '',
      video_url: '',
      materials: '',
      duration_minutes: 0,
      is_published: false,
      order_index: currentWeeks.length
    };
    
    const updatedWeeks = [...currentWeeks, newWeek];
    
    setCourse(prev => ({
      ...prev,
      weeks: updatedWeeks
    }));
    
    setSelectedWeek(newWeek);
    setIsEditingWeek(true);
    
    // 편집 모드에서는 실시간으로 주차 데이터 저장
    if (isEditMode && courseId) {
      try {
        await apiClient.modules.saveWeeks(courseId, updatedWeeks);
        console.log('새 주차가 저장되었습니다.');
      } catch (error) {
        console.error('새 주차 저장 실패:', error);
      }
    }
  };

  const handleWeekChange = async (updatedWeek: CourseWeek) => {
    setCourse(prev => ({
      ...prev,
      weeks: prev.weeks?.map(week => 
        week.id === updatedWeek.id ? updatedWeek : week
      ) || []
    }));
    setSelectedWeek(updatedWeek);
    
    // 편집 모드에서는 실시간으로 주차 데이터 저장
    if (isEditMode && courseId) {
      try {
        const updatedWeeks = course.weeks?.map(week => 
          week.id === updatedWeek.id ? updatedWeek : week
        ) || [];
        await apiClient.modules.saveWeeks(courseId, updatedWeeks);
        console.log('주차 데이터가 자동 저장되었습니다.');
      } catch (error) {
        console.error('주차 자동 저장 실패:', error);
      }
    }
  };

  const handleVideoUpload = async (file: File, weekId: string) => {
    try {
      const week = course.weeks?.find(w => w.id === weekId);
      if (!week) return;

      const { url: videoUrl, duration, filePath } = await uploadVideoToSupabase(file, week.week_number);
      
      const updatedWeek = { 
        ...week, 
        video_url: videoUrl,
        duration_minutes: duration 
      };
      
      // 주차 데이터 업데이트
      setCourse(prev => ({
        ...prev,
        weeks: prev.weeks?.map(w => 
          w.id === weekId ? updatedWeek : w
        ) || []
      }));
      setSelectedWeek(updatedWeek);
      
      // 편집 모드에서는 실시간으로 주차 데이터 저장
      if (isEditMode && courseId) {
        try {
          const updatedWeeks = course.weeks?.map(w => 
            w.id === weekId ? updatedWeek : w
          ) || [];
          await apiClient.modules.saveWeeks(courseId, updatedWeeks);
          console.log('주차 데이터가 자동 저장되었습니다.');
        } catch (error) {
          console.error('주차 자동 저장 실패:', error);
        }
      }
      
      alert(`동영상이 성공적으로 업로드되었습니다! (재생시간: ${duration}분)`);
    } catch (error) {
      console.error('동영상 업로드 실패:', error);
      alert('동영상 업로드에 실패했습니다.');
    }
  };

  const handleDeleteWeek = async (weekId: string) => {
    if (window.confirm('이 주차를 삭제하시겠습니까?')) {
      const updatedWeeks = course.weeks?.filter(week => week.id !== weekId) || [];
      
      setCourse(prev => ({
        ...prev,
        weeks: updatedWeeks
      }));
      
      if (selectedWeek?.id === weekId) {
        setSelectedWeek(null);
      }
      
      // 편집 모드에서는 실시간으로 주차 데이터 저장
      if (isEditMode && courseId) {
        try {
          await apiClient.modules.saveWeeks(courseId, updatedWeeks);
          console.log('주차 삭제가 저장되었습니다.');
        } catch (error) {
          console.error('주차 삭제 저장 실패:', error);
        }
      }
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">강의를 불러오는 중...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEditMode ? '강의 수정' : '새 강의 만들기'}
              </h1>
              <p className="text-gray-600 mt-2">
                강의 정보를 입력하고 주차별 콘텐츠를 추가해보세요
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={async () => {
                  if (!isEditMode) {
                    // 새 강의 생성 중 취소하면 임시 파일 정리
                    await storageService.cleanupTempUploads();
                  }
                  navigate('/my-courses');
                }}
                variant="secondary"
              >
                취소
              </Button>
              <Button
                onClick={handleSaveCourse}
                disabled={isSaving}
                variant="primary"
              >
                {isSaving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 사이드바 - 강의 기본 정보 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                <h2 className="text-lg font-semibold mb-4">강의 기본 정보</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      강의 제목 *
                    </label>
                    <input
                      type="text"
                      value={course.title}
                      onChange={(e) => setCourse(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="강의 제목을 입력하세요"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      간단한 설명
                    </label>
                    <textarea
                      value={course.description}
                      onChange={(e) => setCourse(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={2}
                      placeholder="강의에 대한 간단한 설명"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      강의 썸네일
                    </label>
                    
                    {thumbnailUrl ? (
                      <div className="space-y-2">
                        {/* 현재 썸네일 미리보기 */}
                        <div className="relative w-full h-24 bg-gray-100 rounded-lg overflow-hidden">
                          <img 
                            src={thumbnailUrl}
                            alt="강의 썸네일"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* 새 썸네일 업로드 */}
                        <div className="flex items-center space-x-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailFileSelect}
                            disabled={thumbnailUploading}
                            className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                          />
                          <button
                            onClick={() => setThumbnailUrl('')}
                            className="text-red-600 hover:text-red-800 text-xs whitespace-nowrap"
                          >
                            제거
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
                        <div className="text-center">
                          <svg className="mx-auto h-6 w-6 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div className="mt-1">
                            <label htmlFor="thumbnail-upload" className="cursor-pointer">
                              <span className="text-xs font-medium text-gray-900">썸네일 업로드</span>
                              <span className="block text-xs text-gray-500">PNG, JPG, WebP (최대 10MB)</span>
                            </label>
                            <input
                              id="thumbnail-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleThumbnailFileSelect}
                              disabled={thumbnailUploading}
                              className="sr-only"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {thumbnailUploading && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>업로드 중...</span>
                          <span>{thumbnailUploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className="bg-indigo-600 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${thumbnailUploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      난이도
                    </label>
                    <select
                      value={course.level}
                      onChange={(e) => setCourse(prev => ({ ...prev, level: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="beginner">초급</option>
                      <option value="intermediate">중급</option>
                      <option value="advanced">고급</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      공개 상태
                    </label>
                    <select
                      value={course.status}
                      onChange={(e) => setCourse(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="draft">초안</option>
                      <option value="published">공개</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_free"
                      checked={course.is_free}
                      onChange={(e) => setCourse(prev => ({ 
                        ...prev, 
                        is_free: e.target.checked,
                        price: e.target.checked ? 0 : prev.price
                      }))}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_free" className="ml-2 block text-sm text-gray-900">
                      무료 강의
                    </label>
                  </div>

                  {!course.is_free && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        가격 (원)
                      </label>
                      <input
                        type="number"
                        value={course.price}
                        onChange={(e) => setCourse(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        min="0"
                      />
                    </div>
                  )}
                </div>

                {/* 주차 목록 */}
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-md font-medium">주차 목록</h3>
                    <button
                      onClick={handleAddWeek}
                      className="text-sm bg-indigo-100 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-200"
                    >
                      + 주차 추가
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {course.weeks?.map((week) => (
                      <div
                        key={week.id}
                        onClick={() => setSelectedWeek(week)}
                        className={`p-3 border rounded cursor-pointer transition-colors ${
                          selectedWeek?.id === week.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-sm font-medium">
                              {week.week_number === 0 ? '0주차 (소개)' : `${week.week_number}주차`}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {week.title || '제목 없음'}
                            </div>
                            {week.duration_minutes && week.duration_minutes > 0 && (
                              <div className="text-xs text-green-600 mt-1">
                                ⏱️ {week.duration_minutes}분
                              </div>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWeek(week.id);
                            }}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 메인 콘텐츠 영역 */}
            <div className="lg:col-span-3">
              {selectedWeek ? (
                /* 주차별 편집 화면 */
                <WeekEditor
                  week={selectedWeek}
                  onChange={handleWeekChange}
                  onVideoUpload={handleVideoUpload}
                  uploading={uploading}
                  uploadProgress={uploadProgress}
                  onBackToIntro={() => setSelectedWeek(null)}
                />
              ) : (
                /* 강의 소개 편집 화면 */
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-6">강의 소개 및 내용</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        강의 소개 (공개 페이지 표시용)
                      </label>
                      <textarea
                        value={course.introduction}
                        onChange={(e) => setCourse(prev => ({ ...prev, introduction: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={8}
                        placeholder="누구나 볼 수 있는 강의 소개 내용을 입력하세요"
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-blue-800 mb-2">💡 도움말</h3>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• 왼쪽 사이드바에서 <strong>"+ 주차 추가"</strong>를 클릭하여 강의를 시작하세요</li>
                        <li>• <strong>0주차</strong>는 강의 소개용, <strong>1주차</strong>부터 본격적인 강의 내용을 작성하세요</li>
                        <li>• 각 주차별로 동영상과 자료를 업로드할 수 있습니다</li>
                        <li>• 강의 소개는 모든 사용자가 볼 수 있으니 신중하게 작성해주세요</li>
                      </ul>
                    </div>

                    {/* 주차 편집으로 이동하는 가이드 */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-green-800 mb-3">🎯 다음 단계</h3>
                      <p className="text-green-700 mb-4">
                        강의 소개를 작성한 후, 왼쪽 사이드바에서 <strong>0주차 (강의 소개)</strong>를 클릭하여 강의 콘텐츠를 추가하세요.
                      </p>
                      <div className="flex space-x-3">
                        {course.weeks && course.weeks.length > 0 && (
                          <button
                            onClick={() => setSelectedWeek(course.weeks![0])}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                          >
                            🎯 0주차 편집하기
                          </button>
                        )}
                        <button
                          onClick={handleAddWeek}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          + 새 주차 추가
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// 주차별 편집 컴포넌트
interface WeekEditorProps {
  week: CourseWeek;
  onChange: (week: CourseWeek) => void;
  onVideoUpload: (file: File, weekId: string) => Promise<void>;
  uploading: boolean;
  uploadProgress: number;
  onBackToIntro: () => void;
}

const WeekEditor: React.FC<WeekEditorProps> = ({
  week,
  onChange,
  onVideoUpload,
  uploading,
  uploadProgress,
  onBackToIntro
}) => {
  const [editableWeek, setEditableWeek] = useState(week);

  useEffect(() => {
    setEditableWeek(week);
  }, [week]);

  const handleChange = (field: keyof CourseWeek, value: any) => {
    const updated = { ...editableWeek, [field]: value };
    setEditableWeek(updated);
    onChange(updated);
  };

  const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 검증 (500MB 제한)
      if (file.size > 500 * 1024 * 1024) {
        alert('파일 크기는 500MB를 초과할 수 없습니다.');
        return;
      }

      // 파일 형식 검증
      const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
      if (!allowedTypes.includes(file.type)) {
        alert('MP4, WebM, OGG 형식의 동영상만 업로드 가능합니다.');
        return;
      }

      await onVideoUpload(file, week.id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBackToIntro}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            ← 강의 소개로 돌아가기
          </button>
          <h2 className="text-xl font-semibold">
            {week.week_number === 0 ? '0주차 (강의 소개) 편집' : `${week.week_number}주차 편집`}
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`published-${week.id}`}
            checked={editableWeek.is_published}
            onChange={(e) => handleChange('is_published', e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor={`published-${week.id}`} className="text-sm text-gray-700">
            공개
          </label>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            주차 제목 *
          </label>
          <input
            type="text"
            value={editableWeek.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder={week.week_number === 0 ? "예: 강의 소개 및 개요" : "예: 프로그래밍 기초"}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            주차 설명
          </label>
          <textarea
            value={editableWeek.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={3}
            placeholder={week.week_number === 0 ? "강의 전체 개요와 목표를 설명해주세요" : "이번 주차에서 학습할 내용을 설명해주세요"}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            동영상 업로드
          </label>
          
          {editableWeek.video_url ? (
            <div className="space-y-4">
              {/* 현재 동영상 미리보기 */}
              <div className="bg-black rounded-lg overflow-hidden">
                <video 
                  controls 
                  className="w-full h-64"
                  src={editableWeek.video_url}
                >
                  브라우저에서 비디오를 지원하지 않습니다.
                </video>
              </div>
              
              {/* 동영상 정보 */}
              {editableWeek.duration_minutes && editableWeek.duration_minutes > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-blue-800">
                      재생시간: <strong>{editableWeek.duration_minutes}분</strong>
                    </span>
                  </div>
                </div>
              )}
              
              {/* 새 동영상 업로드 */}
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileSelect}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <button
                  onClick={() => handleChange('video_url', '')}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  동영상 제거
                </button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="mt-4">
                  <label htmlFor={`video-upload-${week.id}`} className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      동영상을 업로드하세요
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      MP4, WebM, OGG 파일 (최대 500MB)
                    </span>
                  </label>
                  <input
                    id={`video-upload-${week.id}`}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileSelect}
                    disabled={uploading}
                    className="sr-only"
                  />
                </div>
              </div>
            </div>
          )}

          {uploading && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>업로드 중...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            강의 자료 링크 (JSON 형식)
          </label>
          <textarea
            value={editableWeek.materials}
            onChange={(e) => handleChange('materials', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={4}
            placeholder='{"PDF": "https://example.com/material.pdf", "슬라이드": "https://example.com/slides.pptx"}'
          />
          <p className="text-xs text-gray-500 mt-1">
            JSON 형식으로 자료명과 링크를 입력하세요
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            수업 시간 (분)
          </label>
          <input
            type="number"
            value={editableWeek.duration_minutes}
            onChange={(e) => handleChange('duration_minutes', parseInt(e.target.value) || 0)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            min="0"
            placeholder="예: 60"
          />
        </div>
      </div>
    </div>
  );
};

export default CourseCreator;