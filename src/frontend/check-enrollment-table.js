#!/usr/bin/env node

// enrollments 테이블 상태 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL 또는 키가 환경변수에 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEnrollmentTable() {
  try {
    console.log('🔍 enrollments 테이블 상태 확인 중...\n');
    
    // 1. 테이블 존재 확인 및 데이터 조회
    console.log('📊 enrollments 테이블 데이터 조회:');
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('*')
      .limit(5);
    
    if (enrollError) {
      console.error('❌ enrollments 테이블 조회 오류:', enrollError.message);
      console.log('🔧 이는 RLS 정책 때문일 수 있습니다.');
    } else {
      console.log(`✅ enrollments 테이블에서 ${enrollments?.length || 0}개의 레코드 조회됨`);
      if (enrollments && enrollments.length > 0) {
        console.log('📝 샘플 데이터:', enrollments[0]);
      }
    }
    
    // 2. 사용자 인증 상태 확인
    console.log('\n👤 현재 사용자 인증 상태:');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('❌ 사용자 인증 오류:', userError.message);
      console.log('🔧 익명 사용자로 실행 중 - 이는 정상입니다.');
    } else if (user) {
      console.log('✅ 인증된 사용자:', user.email);
    } else {
      console.log('📝 익명 사용자로 실행 중');
    }
    
    // 3. 다른 테이블들도 확인
    console.log('\n📊 다른 테이블들 상태 확인:');
    
    // courses 테이블 확인
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, status')
      .limit(3);
    
    if (coursesError) {
      console.log('❌ courses 테이블 조회 오류:', coursesError.message);
    } else {
      console.log(`✅ courses 테이블: ${courses?.length || 0}개 강의`);
    }
    
    // payments 테이블 확인
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .limit(3);
    
    if (paymentsError) {
      console.log('❌ payments 테이블 조회 오류:', paymentsError.message);
    } else {
      console.log(`✅ payments 테이블: ${payments?.length || 0}개 결제 기록`);
    }
    
    console.log('\n🎯 문제 진단:');
    if (enrollError && enrollError.message.includes('policy')) {
      console.log('🔧 RLS 정책 문제로 보입니다. setup-rls-for-private-data.sql을 Supabase 대시보드에서 실행하세요.');
    } else if (!enrollments || enrollments.length === 0) {
      console.log('📝 enrollments 테이블이 비어있습니다. 수강신청이 제대로 저장되지 않고 있습니다.');
    } else {
      console.log('✅ enrollments 테이블이 정상적으로 조회됩니다.');
    }
    
  } catch (error) {
    console.error('❌ 테이블 상태 확인 중 오류:', error);
  }
}

// 스크립트 실행
checkEnrollmentTable();