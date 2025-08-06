import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Button from '../common/Button';

interface DebugState {
  isLoading: boolean;
  courses: any[];
  error: string | null;
  connectionStatus: 'disconnected' | 'connected' | 'failed';
  userInfo: any;
  statusCounts?: Record<string, number>;
  totalCourses?: number;
}

const CourseDebug: React.FC = () => {
  const [debug, setDebug] = useState<DebugState>({
    isLoading: false,
    courses: [],
    error: null,
    connectionStatus: 'disconnected',
    userInfo: null,
  });

  const testSupabaseConnection = async () => {
    setDebug(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      console.log('🔍 Testing Supabase connection...');
      
      // 1. 연결 테스트
      const { data: connectionTest, error: connectionError } = await supabase
        .from('courses')
        .select('count')
        .limit(1);
      
      if (connectionError) {
        throw new Error(`Connection failed: ${connectionError.message}`);
      }
      
      // 2. 사용자 정보 확인
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      const userInfo = user ? {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'unknown'
      } : null;
      
      // 3. 전체 강의 조회 (모든 status 포함, 외래키 없이)
      const { data: allCourses, error: coursesError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          status,
          is_published,
          created_at,
          instructor_id
        `)
        .order('created_at', { ascending: false });
      
      if (coursesError) {
        throw new Error(`Courses query failed: ${coursesError.message}`);
      }
      
      // 4. 상태별 통계
      const statusCounts = allCourses?.reduce((acc: any, course: any) => {
        acc[course.status] = (acc[course.status] || 0) + 1;
        return acc;
      }, {}) || {};
      
      setDebug({
        isLoading: false,
        courses: allCourses || [],
        error: null,
        connectionStatus: 'connected',
        userInfo,
        statusCounts,
        totalCourses: allCourses?.length || 0
      });
      
      console.log('✅ Supabase connection successful');
      console.log('📊 Status counts:', statusCounts);
      console.log('📚 Total courses:', allCourses?.length || 0);
      
    } catch (error: any) {
      console.error('❌ Supabase connection failed:', error);
      setDebug(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
        connectionStatus: 'failed'
      }));
    }
  };

  const publishAllCourses = async () => {
    if (!window.confirm('모든 강의를 published 상태로 변경하시겠습니까?')) {
      return;
    }
    
    try {
      setDebug(prev => ({ ...prev, isLoading: true }));
      
      const { data, error } = await supabase
        .from('courses')
        .update({ status: 'published', is_published: true })
        .neq('status', 'published');
      
      if (error) {
        throw new Error(error.message);
      }
      
      alert('모든 강의가 published 상태로 변경되었습니다!');
      testSupabaseConnection(); // 다시 데이터 로드
      
    } catch (error: any) {
      alert('오류 발생: ' + error.message);
      setDebug(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    testSupabaseConnection();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6">📊 Supabase 강의 데이터 디버그</h2>
      
      {/* 연결 상태 */}
      <div className="mb-6 p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-2">연결 상태</h3>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            debug.connectionStatus === 'connected' ? 'bg-green-500' :
            debug.connectionStatus === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
          }`}></div>
          <span className="capitalize">{debug.connectionStatus}</span>
        </div>
      </div>

      {/* 사용자 정보 */}
      {debug.userInfo && (
        <div className="mb-6 p-4 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">사용자 정보</h3>
          <p><strong>ID:</strong> {debug.userInfo.id}</p>
          <p><strong>Email:</strong> {debug.userInfo.email}</p>
          <p><strong>Role:</strong> {debug.userInfo.role}</p>
        </div>
      )}

      {/* 통계 */}
      {debug.statusCounts && (
        <div className="mb-6 p-4 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">강의 상태별 통계</h3>
          <p><strong>전체 강의:</strong> {debug.totalCourses}개</p>
          {Object.entries(debug.statusCounts).map(([status, count]) => (
            <p key={status}>
              <strong>{status}:</strong> {count as number}개
            </p>
          ))}
        </div>
      )}

      {/* 에러 */}
      {debug.error && (
        <div className="mb-6 p-4 rounded-lg border border-red-300 bg-red-50">
          <h3 className="text-lg font-semibold mb-2 text-red-800">오류</h3>
          <p className="text-red-700">{debug.error}</p>
        </div>
      )}

      {/* 강의 목록 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">강의 목록 (최근 10개)</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2">제목</th>
                <th className="border border-gray-300 px-4 py-2">상태</th>
                <th className="border border-gray-300 px-4 py-2">강사</th>
                <th className="border border-gray-300 px-4 py-2">생성일</th>
              </tr>
            </thead>
            <tbody>
              {debug.courses.slice(0, 10).map((course: any) => (
                <tr key={course.id}>
                  <td className="border border-gray-300 px-4 py-2">{course.title}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      course.status === 'published' ? 'bg-green-100 text-green-800' :
                      course.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {course.status}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {course.instructor ? 
                      `${course.instructor.first_name || ''} ${course.instructor.last_name || ''}`.trim() ||
                      course.instructor.email : '없음'}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {new Date(course.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-4">
        <Button
          onClick={testSupabaseConnection}
          isLoading={debug.isLoading}
          variant="primary"
        >
          🔄 다시 테스트
        </Button>
        
        <Button
          onClick={publishAllCourses}
          isLoading={debug.isLoading}
          variant="secondary"
          disabled={debug.totalCourses === 0}
        >
          📝 모든 강의 Published로 변경
        </Button>
      </div>
    </div>
  );
};

export default CourseDebug;