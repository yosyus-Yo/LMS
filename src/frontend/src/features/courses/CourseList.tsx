import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import apiClient from '../../api/apiClient';
import { useAppSelector } from '../../app/store';
import courseImages from '../../data/courseImages';
import { supabase } from '../../lib/supabase';
import { getPublicCourses } from '../../utils/supabasePublic';

interface Course {
  id: string; // Supabase UUID
  title: string;
  instructor: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  rating: number;
  ratingCount: number;
  imageUrl: string;
  imageAlt: string;
  categories: string[];
  price: number;
  is_free: boolean;
  status: string;
}

const CourseList: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 CourseList: Starting to fetch courses...');
        
        // 핵심 정보만 로깅
        console.log('👤 User role:', user?.role, '| Admin:', isAdmin, '| Include All:', isAdmin);
        
        // 인증 상태 확인
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔐 Session:', session ? `✅ ${session.user?.email}` : '❌ Anonymous');
        
        // 강의 데이터 조회 - 관리자는 모든 강의, 일반 사용자와 비회원은 published 강의만
        console.log('🔍 Fetching courses...');
        console.log('User:', isAuthenticated ? user?.email : 'Anonymous', 'Role:', user?.role, 'isAdmin:', isAdmin);
        
        let coursesData: any[] = [];
        
        try {
          if (isAdmin) {
            // 관리자는 모든 강의 조회
            console.log('👑 Admin user - fetching all courses...');
            
            try {
              const response = await apiClient.courses.getAll({ includeAll: true });
              
              if (response && typeof response === 'object') {
                if ('error' in response && (response as any).error) {
                  console.error('❌ Admin API Error:', (response as any).error);
                  throw (response as any).error;
                }
                
                const responseData = (response as any).data;
                coursesData = Array.isArray(responseData) ? responseData : [];
                console.log(`👑 Admin API successful, got ${coursesData.length} courses`);
              }
            } catch (adminError) {
              console.error('❌ Admin API failed, trying direct query...', adminError);
              
              // 관리자도 직접 쿼리로 fallback
              const { data: adminDirectData, error: adminDirectError } = await supabase
                .from('courses')
                .select('*')
                .order('created_at', { ascending: false });
              
              if (adminDirectError) {
                console.error('❌ Admin direct query failed:', adminDirectError);
                throw adminDirectError;
              }
              
              coursesData = adminDirectData || [];
              console.log(`👑 Admin direct query successful, got ${coursesData.length} courses`);
            }
          } else {
            // 일반 사용자와 비회원은 공개 강의만 조회
            console.log('🌍 Fetching public courses for user/guest...');
            
            // 강제로 모든 강의 조회 (RLS 비활성화 후)
            console.log('🔄 Attempting to fetch all courses...');
            
            try {
              // 가장 간단한 방법: includeAll true로 시도
              const response = await apiClient.courses.getAll({ includeAll: true });
              coursesData = (response as any).data || [];
              console.log(`✅ API call successful, got ${coursesData.length} courses`);
            } catch (apiError) {
              console.error('❌ API failed, trying direct supabase query...', apiError);
              
              // 직접 supabase 쿼리
              const { data: directData, error: directError } = await supabase
                .from('courses')
                .select('*')
                .order('created_at', { ascending: false });
              
              if (directError) {
                console.error('❌ Direct query also failed:', directError);
                throw directError;
              }
              
              coursesData = directData || [];
              console.log(`✅ Direct query successful, got ${coursesData.length} courses`);
            }
          }
        } catch (error) {
          console.error('❌ Failed to fetch courses:', error);
          
          // 최후의 수단: 공개 강의 조회
          if (!isAdmin) {
            console.log('🔄 Trying fallback public courses query...');
            try {
              coursesData = await getPublicCourses();
            } catch (fallbackError) {
              console.error('❌ Fallback also failed:', fallbackError);
              coursesData = [];
            }
          } else {
            coursesData = [];
          }
        }
        console.log(`📚 Retrieved ${coursesData.length} courses`);
        
        if (coursesData.length > 0) {
          coursesData.forEach((course: any, index: number) => {
            console.log(`  ${index + 1}. "${course.title}" - Status: ${course.status}`);
          });
        } else {
          console.log('⚠️ No courses found for current user');
          console.log('  - User role:', user?.role);
          console.log('  - Using includeAll:', isAdmin);
        }
        
        // Supabase 데이터를 프론트엔드 형식으로 변환
        const transformedCourses: Course[] = coursesData.map((course: any) => ({
          id: course.id,
          title: course.title || '제목 없음',
          instructor: course.instructor ? 
            `${course.instructor.first_name || ''} ${course.instructor.last_name || ''}`.trim() || course.instructor.email :
            course.instructor_id || '알 수 없음', // 간단한 쿼리의 경우 instructor_id만 있을 수 있음
          description: course.short_description || course.description || '설명 없음',
          level: course.level || 'beginner',
          duration: course.duration_minutes ? `${Math.floor(course.duration_minutes / 60)}시간` : '미정',
          rating: parseFloat(course.rating) || 0,
          ratingCount: course.rating_count || 0,
          imageUrl: course.thumbnail_url || courseImages.python.placeholder,
          imageAlt: course.title || '강의 이미지',
          categories: course.category ? [course.category.name] : (course.category_id ? ['카테고리'] : ['기타']),
          price: parseFloat(course.price) || 0,
          is_free: course.is_free || course.price === 0 || false,
          status: course.status || 'draft',
        }));
        
        console.log('✅ CourseList: Transformed courses from Supabase:', transformedCourses.length, 'courses');
        setCourses(transformedCourses);
      } catch (error) {
        console.error('❌ CourseList: Error fetching courses from Supabase:', error);
        setCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [isAdmin]);

  // 필터 및 검색 적용
  useEffect(() => {
    let filtered = courses;

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 카테고리 필터
    if (selectedCategory) {
      filtered = filtered.filter(course =>
        course.categories.includes(selectedCategory)
      );
    }

    // 레벨 필터
    if (selectedLevel) {
      filtered = filtered.filter(course =>
        course.level === selectedLevel
      );
    }

    setFilteredCourses(filtered);
  }, [courses, searchTerm, selectedCategory, selectedLevel]);

  // 카테고리 옵션 추출
  const allCategories = Array.from(
    new Set(courses.flatMap(course => course.categories))
  );

  // 레벨 옵션
  const levelOptions = [
    { value: 'beginner', label: '초급' },
    { value: 'intermediate', label: '중급' },
    { value: 'advanced', label: '고급' },
  ];

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              rating >= star
                ? 'text-yellow-400'
                : rating >= star - 0.5
                ? 'text-yellow-300'
                : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const getLevelBadge = (level: string) => {
    const levelColors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    } as const;

    const levelNames = {
      beginner: '초급',
      intermediate: '중급',
      advanced: '고급'
    } as const;

    return (
      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${levelColors[level as keyof typeof levelColors] || 'bg-gray-100 text-gray-800'}`}>
        {levelNames[level as keyof typeof levelNames] || level}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-orange-100 text-orange-800',
      archived: 'bg-gray-100 text-gray-800'
    } as const;

    const statusNames = {
      published: '게시됨',
      draft: '초안',
      archived: '보관됨'
    } as const;

    return (
      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {statusNames[status as keyof typeof statusNames] || status}
      </span>
    );
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
      <div>
        <h1 className="text-2xl font-bold mb-6">강의 목록</h1>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                id="search"
                name="search"
                type="text"
                label="강의 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="강의명, 강사명, 내용으로 검색"
                fullWidth
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                카테고리
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">전체 카테고리</option>
                {allCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                레벨
              </label>
              <select
                id="level"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">전체 레벨</option>
                {levelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 강의 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <img
                  src={course.imageUrl}
                  alt={course.imageAlt}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {course.title}
                    </h2>
                    <div className="flex flex-col gap-1">
                      {getLevelBadge(course.level)}
                      {isAdmin && getStatusBadge(course.status)}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-2">{course.instructor}</p>
                  <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                    {course.description}
                  </p>
                  
                  <div className="flex items-center mb-4">
                    {renderStars(course.rating)}
                    <span className="ml-2 text-sm text-gray-600">
                      {course.rating.toFixed(1)} ({course.ratingCount})
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {course.categories.map((category) => (
                      <span
                        key={category}
                        className="inline-block bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{course.duration}</span>
                    <Link to={`/courses/${course.id}`}>
                      <Button variant="primary" size="sm">
                        자세히 보기
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              {courses.length === 0 ? (
                <div>
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">강의가 없습니다</h3>
                  <p className="text-gray-500 mb-4">
                    Supabase 데이터베이스에 강의 데이터가 없습니다.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
                    <p className="text-sm text-blue-800 mb-3">
                      💡 <strong>강의 데이터 추가 방법:</strong>
                    </p>
                    <div className="text-left text-sm text-blue-700 space-y-2">
                      <div>1. Supabase 프로젝트 대시보드에 로그인</div>
                      <div>2. SQL Editor 또는 Table Editor 사용</div>
                      <div>3. 다음 테이블에 데이터 추가:</div>
                      <ul className="ml-4 space-y-1">
                        <li>• <code>categories</code> - 강의 카테고리</li>
                        <li>• <code>user_profiles</code> - 강사 정보</li>
                        <li>• <code>courses</code> - 강의 정보</li>
                      </ul>
                      <div className="mt-2">
                        <strong>참고:</strong> 강의 상태는 'published'로 설정해야 표시됩니다.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
                  <p className="text-gray-500">다른 검색 조건을 시도해보세요.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CourseList;