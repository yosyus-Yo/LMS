#!/usr/bin/env node

// user_profiles 테이블 스키마 및 상태 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL 또는 키가 환경변수에 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserProfilesSchema() {
  try {
    console.log('🔍 user_profiles 테이블 스키마 및 상태 확인...\n');
    
    // 1. 테이블 존재 및 기본 데이터 확인
    console.log('📊 user_profiles 테이블 데이터 샘플:');
    const { data: sampleData, error: sampleError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(3);
    
    if (sampleError) {
      console.error('❌ 샘플 데이터 조회 실패:', sampleError);
    } else {
      console.log(`✅ ${sampleData?.length || 0}개의 레코드 조회됨`);
      if (sampleData && sampleData.length > 0) {
        console.log('📝 샘플 데이터 구조:', Object.keys(sampleData[0]));
        console.log('📝 첫 번째 레코드:', sampleData[0]);
      }
    }
    
    // 2. 테스트 데이터 삽입 시도
    console.log('\n🧪 테스트 프로필 삽입 시도...');
    const testProfile = {
      id: 'test-user-' + Date.now(),
      email: `test${Date.now()}@example.com`,
      first_name: '테스트',
      last_name: '사용자',
      role: 'student',
      phone_number: '010-1234-5678',
      is_active: true
    };
    
    console.log('📋 테스트 데이터:', testProfile);
    
    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .insert(testProfile)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ 테스트 삽입 실패:', insertError);
      console.error('❌ 오류 상세:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
      
      // 400 오류 분석
      if (insertError.code === '42501') {
        console.log('🔧 권한 문제: RLS 정책을 확인하세요.');
      } else if (insertError.code === '23505') {
        console.log('🔧 중복 키 오류: 이미 존재하는 데이터입니다.');
      } else if (insertError.code === '23502') {
        console.log('🔧 NOT NULL 제약조건 위반: 필수 필드가 누락되었습니다.');
      } else {
        console.log('🔧 기타 오류: 테이블 구조나 제약조건을 확인하세요.');
      }
    } else {
      console.log('✅ 테스트 삽입 성공:', insertData);
      
      // 테스트 데이터 삭제
      const { error: deleteError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testProfile.id);
      
      if (deleteError) {
        console.warn('⚠️ 테스트 데이터 삭제 실패:', deleteError.message);
      } else {
        console.log('🗑️ 테스트 데이터 삭제 완료');
      }
    }
    
    // 3. RLS 상태 확인
    console.log('\n🔒 RLS 상태 확인...');
    console.log('emergency-rls-fix.sql에서 user_profiles RLS를 비활성화했으므로 RLS는 꺼져있어야 합니다.');
    
    // 4. 최근 가입한 실제 사용자 확인
    console.log('\n👥 최근 가입한 사용자들:');
    const { data: recentUsers, error: recentError } = await supabase
      .from('user_profiles')
      .select('id, email, first_name, last_name, role, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentError) {
      console.error('❌ 최근 사용자 조회 실패:', recentError);
    } else {
      console.log(`✅ ${recentUsers?.length || 0}명의 최근 사용자`);
      recentUsers?.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.first_name} ${user.last_name} (${user.email}) - ${user.role}`);
      });
    }
    
    console.log('\n📋 진단 요약:');
    console.log('1. user_profiles 테이블 접근 가능 여부');
    console.log('2. 테스트 데이터 삽입 성공/실패');
    console.log('3. 오류 코드 및 메시지 분석');
    console.log('4. RLS 상태 확인');
    
  } catch (error) {
    console.error('❌ 테이블 스키마 확인 중 오류:', error);
  }
}

// 스크립트 실행
checkUserProfilesSchema();