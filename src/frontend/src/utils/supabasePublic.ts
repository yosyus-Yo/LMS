// 공개 데이터 조회용 Supabase 클라이언트
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!

// 공개 데이터 조회용 클라이언트 (RLS 우회)
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'public-access'
    }
  }
})

// 공개 강의 데이터 조회 함수
export const getPublicCourses = async () => {
  try {
    console.log('🌍 Fetching public courses...');
    console.log('🔧 Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
    console.log('🔧 Anon Key (first 20 chars):', process.env.REACT_APP_SUPABASE_ANON_KEY?.substring(0, 20));
    
    // 먼저 간단한 쿼리로 테스트
    console.log('🧪 Testing basic connection...');
    const { data: testData, error: testError } = await supabasePublic
      .from('courses')
      .select('id, title, status')
      .limit(1);
    
    console.log('🧪 Test query result:', { data: testData, error: testError });
    
    if (testError) {
      console.error('❌ Basic connection failed:', testError);
      // 모든 상태의 강의 조회 시도
      console.log('🔄 Trying without status filter...');
      const { data: allData, error: allError } = await supabasePublic
        .from('courses')
        .select('id, title, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      console.log('🔄 All courses query:', { data: allData, error: allError });
      
      if (allError) {
        throw allError;
      }
      
      return allData || [];
    }
    
    // 전체 쿼리 실행
    const { data, error } = await supabasePublic
      .from('courses')
      .select(`
        id,
        title,
        description,
        short_description,
        instructor_id,
        category_id,
        thumbnail_url,
        status,
        level,
        price,
        is_free,
        duration_minutes,
        rating,
        rating_count,
        created_at
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Public courses query error:', error);
      
      // status 필터 없이 재시도
      console.log('🔄 Retrying without status filter...');
      const { data: fallbackData, error: fallbackError } = await supabasePublic
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fallbackError) {
        throw fallbackError;
      }
      
      console.log(`✅ Fallback query retrieved ${fallbackData?.length || 0} courses`);
      return fallbackData || [];
    }

    console.log(`✅ Retrieved ${data?.length || 0} public courses`);
    data?.forEach((course, index) => {
      console.log(`  ${index + 1}. "${course.title}" - Status: ${course.status}`);
    });
    
    return data || [];
    
  } catch (error) {
    console.error('❌ Failed to fetch public courses:', error);
    return [];
  }
};