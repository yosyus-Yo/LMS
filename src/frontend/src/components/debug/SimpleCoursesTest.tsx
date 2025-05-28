import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import Button from '../common/Button';

const SimpleCoursesTest: React.FC = () => {
  const [result, setResult] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async () => {
    setIsLoading(true);
    setResult({});
    
    try {
      console.log('🧪 Running simple courses test...');
      
      // 1. 환경 변수 확인
      const envCheck = {
        supabaseUrl: !!process.env.REACT_APP_SUPABASE_URL,
        supabaseKey: !!process.env.REACT_APP_SUPABASE_ANON_KEY,
        urlValue: process.env.REACT_APP_SUPABASE_URL,
        keyPrefix: process.env.REACT_APP_SUPABASE_ANON_KEY?.substring(0, 20)
      };
      
      // 2. 기본 연결 테스트
      const { data: pingData, error: pingError } = await supabase
        .from('courses')
        .select('count')
        .limit(0);
      
      // 3. 모든 강의 조회 (status 필터 없음)
      const { data: allCourses, error: allError, count } = await supabase
        .from('courses')
        .select('*', { count: 'exact' });
      
      // 4. published 강의만 조회
      const { data: publishedCourses, error: publishedError } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'published');
      
      // 5. 테이블 존재 확인
      let tableCheck = null;
      let tableError = null;
      try {
        const result = await supabase.rpc('check_table_exists', { table_name: 'courses' });
        tableCheck = result.data;
        tableError = result.error?.message;
      } catch (error) {
        tableError = 'RPC not available';
      }
      
      setResult({
        envCheck,
        ping: { data: pingData, error: pingError?.message },
        allCourses: { 
          count: allCourses?.length || 0, 
          error: allError?.message,
          totalCount: count,
          sample: allCourses?.slice(0, 3).map(c => ({ id: c.id, title: c.title, status: c.status }))
        },
        publishedCourses: { 
          count: publishedCourses?.length || 0, 
          error: publishedError?.message,
          sample: publishedCourses?.slice(0, 3).map(c => ({ id: c.id, title: c.title, status: c.status }))
        },
        tableCheck: { data: tableCheck, error: tableError }
      });
      
    } catch (error: any) {
      console.error('❌ Test failed:', error);
      setResult({ globalError: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6">🧪 간단 강의 테스트</h2>
      
      <Button
        onClick={runTest}
        isLoading={isLoading}
        variant="primary"
        className="mb-6"
      >
        테스트 실행
      </Button>
      
      {Object.keys(result).length > 0 && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">테스트 결과</h3>
          <pre className="text-sm overflow-auto bg-white p-4 rounded border">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default SimpleCoursesTest;