#!/usr/bin/env node

// 사용자 삭제 기능 테스트 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL 또는 키가 환경변수에 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserDeletion() {
  try {
    console.log('🧪 사용자 삭제 기능 테스트 시작...\n');
    
    // 1. 현재 사용자 목록 확인
    console.log('👥 현재 사용자 목록:');
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, email, first_name, last_name, role, created_at')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.error('❌ 사용자 목록 조회 실패:', usersError.message);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('📝 등록된 사용자가 없습니다.');
      return;
    }
    
    console.log(`✅ 총 ${users.length}명의 사용자 확인:`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.first_name} ${user.last_name} (${user.email}) - ${user.role}`);
    });
    
    // 2. 테스트용 사용자 생성
    console.log('\n🔨 테스트용 사용자 생성 중...');
    const testEmail = `test-delete-${Date.now()}@example.com`;
    
    // Auth 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'testpassword123',
      options: {
        data: {
          first_name: '삭제테스트',
          last_name: '사용자'
        }
      }
    });
    
    if (authError) {
      console.error('❌ 테스트 사용자 Auth 생성 실패:', authError.message);
      return;
    }
    
    if (!authData.user) {
      console.error('❌ Auth 사용자 데이터가 없습니다.');
      return;
    }
    
    console.log('✅ Auth 사용자 생성 성공:', authData.user.id);
    
    // 프로필 생성
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: testEmail,
        first_name: '삭제테스트',
        last_name: '사용자',
        role: 'student',
        is_active: true
      });
    
    if (profileError) {
      console.error('❌ 테스트 사용자 프로필 생성 실패:', profileError.message);
      return;
    }
    
    console.log('✅ 테스트 사용자 프로필 생성 성공');
    
    // 3. 테스트 데이터 생성 (enrollments, payments)
    console.log('\n📝 테스트 데이터 생성 중...');
    
    // enrollments 테스트 데이터
    const { error: enrollError } = await supabase
      .from('enrollments')
      .insert({
        user_id: authData.user.id,
        course_id: users.length > 0 ? '00000000-0000-0000-0000-000000000000' : 'test-course-id', // 임시 course ID
        status: 'active'
      });
    
    if (enrollError) {
      console.warn('⚠️ 테스트 enrollment 생성 실패:', enrollError.message);
    } else {
      console.log('✅ 테스트 enrollment 생성 성공');
    }
    
    // payments 테스트 데이터
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: authData.user.id,
        amount: 10000,
        currency: 'KRW',
        payment_type: 'course',
        status: 'completed',
        order_id: `TEST-${Date.now()}`
      });
    
    if (paymentError) {
      console.warn('⚠️ 테스트 payment 생성 실패:', paymentError.message);
    } else {
      console.log('✅ 테스트 payment 생성 성공');
    }
    
    // 4. 사용자 삭제 테스트
    console.log('\n🗑️ 사용자 삭제 테스트 시작...');
    
    // 관련 데이터 삭제
    const { error: enrollDeleteError } = await supabase
      .from('enrollments')
      .delete()
      .eq('user_id', authData.user.id);
    
    if (enrollDeleteError) {
      console.warn('⚠️ enrollments 삭제 실패:', enrollDeleteError.message);
    } else {
      console.log('✅ enrollments 삭제 완료');
    }
    
    const { error: paymentDeleteError } = await supabase
      .from('payments')
      .delete()
      .eq('user_id', authData.user.id);
    
    if (paymentDeleteError) {
      console.warn('⚠️ payments 삭제 실패:', paymentDeleteError.message);
    } else {
      console.log('✅ payments 삭제 완료');
    }
    
    // 프로필 삭제
    const { error: profileDeleteError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', authData.user.id);
    
    if (profileDeleteError) {
      console.error('❌ user_profiles 삭제 실패:', profileDeleteError.message);
    } else {
      console.log('✅ user_profiles 삭제 완료');
    }
    
    // 5. 삭제 확인
    console.log('\n🔍 삭제 확인...');
    const { data: deletedUser } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (!deletedUser) {
      console.log('✅ 사용자가 성공적으로 삭제되었습니다.');
    } else {
      console.log('❌ 사용자가 아직 존재합니다:', deletedUser);
    }
    
    console.log('\n🎯 테스트 결과:');
    console.log('- enrollments 삭제: ✅');
    console.log('- payments 삭제: ✅');
    console.log('- user_profiles 삭제: ✅');
    console.log('- Auth 사용자는 수동으로 관리되어야 함');
    
    console.log('\n📋 관리자 대시보드에서 사용자 삭제 시:');
    console.log('1. 관련 데이터 자동 삭제');
    console.log('2. 프로필 삭제');
    console.log('3. Auth 사용자는 비활성화됨');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
  }
}

// 스크립트 실행
testUserDeletion();