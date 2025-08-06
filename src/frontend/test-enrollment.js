#!/usr/bin/env node

// 수강신청 테스트 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL 또는 키가 환경변수에 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEnrollment() {
  try {
    console.log('🧪 수강신청 기능 테스트 시작...\n');
    
    // 1. 먼저 courses 테이블에서 테스트할 강의 찾기
    console.log('📚 사용 가능한 강의 조회:');
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, status, is_free')
      .limit(5);
    
    if (coursesError) {
      console.error('❌ 강의 조회 실패:', coursesError.message);
      return;
    }
    
    if (!courses || courses.length === 0) {
      console.log('❌ 테스트할 강의가 없습니다.');
      return;
    }
    
    console.log('✅ 사용 가능한 강의들:');
    courses.forEach((course, index) => {
      console.log(`  ${index + 1}. ${course.title} (ID: ${course.id}, 무료: ${course.is_free})`);
    });
    
    const testCourse = courses[0];
    console.log(`\n🎯 테스트 대상 강의: ${testCourse.title}`);
    
    // 2. 테스트용 사용자 ID 생성 (실제로는 auth.uid()를 사용)
    const testUserId = 'test-user-' + Date.now();
    console.log(`👤 테스트 사용자 ID: ${testUserId}`);
    
    // 3. 수강신청 시도 (RLS 때문에 실패할 것으로 예상)
    console.log('\n🔄 수강신청 시도 중...');
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .insert({
        user_id: testUserId,
        course_id: testCourse.id,
        status: 'active'
      })
      .select()
      .single();
    
    if (enrollError) {
      console.error('❌ 수강신청 실패:', enrollError.message);
      console.log('🔧 이는 RLS 정책 때문입니다. manual-rls-fix.sql을 Supabase 대시보드에서 실행하세요.');
      
      // RLS 정책 관련 오류인지 확인
      if (enrollError.message.includes('policy') || enrollError.message.includes('RLS') || enrollError.code === '42501') {
        console.log('\n📋 해결 방법:');
        console.log('1. Supabase 대시보드에 로그인하세요');
        console.log('2. SQL Editor로 이동하세요');
        console.log('3. manual-rls-fix.sql 파일의 내용을 복사하여 실행하세요');
        console.log('4. 또는 다음 명령어들을 하나씩 실행하세요:');
        console.log('   ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;');
        console.log('   CREATE POLICY "Users can manage own enrollments" ON enrollments FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());');
      }
    } else {
      console.log('✅ 수강신청 성공!');
      console.log('📝 수강신청 데이터:', enrollment);
      
      // 수강신청 조회 테스트
      console.log('\n🔍 수강신청 조회 테스트:');
      const { data: enrollments, error: fetchError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', testCourse.id);
      
      if (fetchError) {
        console.error('❌ 수강신청 조회 실패:', fetchError.message);
      } else {
        console.log(`✅ ${enrollments?.length || 0}개의 수강신청 발견`);
      }
    }
    
    // 4. 현재 enrollments 테이블 상태 확인
    console.log('\n📊 현재 enrollments 테이블 전체 상태:');
    const { data: allEnrollments, error: allError } = await supabase
      .from('enrollments')
      .select('*');
    
    if (allError) {
      console.error('❌ 전체 수강신청 조회 실패:', allError.message);
    } else {
      console.log(`📈 총 ${allEnrollments?.length || 0}개의 수강신청 기록이 있습니다.`);
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
  }
}

// 스크립트 실행
testEnrollment();