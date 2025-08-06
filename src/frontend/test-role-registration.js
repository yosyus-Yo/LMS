#!/usr/bin/env node

// Role 기반 회원가입 테스트 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL 또는 키가 환경변수에 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRoleRegistration() {
  try {
    console.log('🧪 Role 기반 회원가입 테스트 시작...\n');
    
    // 1. user_profiles 테이블 상태 확인
    console.log('📊 user_profiles 테이블 현재 상태:');
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, email, first_name, last_name, role')
      .limit(5);
    
    if (profilesError) {
      console.log('❌ user_profiles 조회 오류:', profilesError.message);
      console.log('🔧 RLS 정책 문제일 수 있습니다.');
    } else {
      console.log(`✅ 현재 ${existingProfiles?.length || 0}명의 사용자가 등록되어 있습니다.`);
      if (existingProfiles && existingProfiles.length > 0) {
        console.log('📝 기존 사용자 예시:');
        existingProfiles.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.first_name} ${user.last_name} (${user.email}) - ${user.role}`);
        });
      }
    }
    
    // 2. 테스트 사용자 데이터 준비
    const timestamp = Date.now();
    const testUsers = [
      {
        email: `student_${timestamp}@test.com`,
        password: 'testpassword123',
        firstName: '학생',
        lastName: '테스트',
        role: 'student',
        phone: '010-1234-5678'
      },
      {
        email: `instructor_${timestamp}@test.com`,
        password: 'testpassword123',
        firstName: '강사',
        lastName: '테스트',
        role: 'instructor',
        phone: '010-9876-5432'
      }
    ];
    
    console.log('\n🔄 테스트 사용자 회원가입 시뮬레이션:');
    
    for (const testUser of testUsers) {
      console.log(`\n👤 ${testUser.role} 계정 생성 중...`);
      console.log(`   이메일: ${testUser.email}`);
      console.log(`   역할: ${testUser.role}`);
      
      try {
        // Supabase Auth 회원가입 시도
        console.log('🔄 Supabase Auth 회원가입 중...');
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: testUser.email,
          password: testUser.password,
          options: {
            data: {
              first_name: testUser.firstName,
              last_name: testUser.lastName,
              role: testUser.role,
            }
          }
        });
        
        if (authError) {
          console.log(`❌ Auth 회원가입 실패: ${authError.message}`);
          
          if (authError.message.includes('User already registered')) {
            console.log('ℹ️  이미 존재하는 사용자입니다. 건너뜁니다.');
            continue;
          } else {
            throw authError;
          }
        }
        
        if (authData.user) {
          console.log('✅ Supabase Auth 회원가입 성공');
          
          // user_profiles 테이블에 프로필 저장 시도
          console.log('🔄 user_profiles 테이블에 프로필 저장 중...');
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: authData.user.id,
              email: testUser.email,
              first_name: testUser.firstName,
              last_name: testUser.lastName,
              role: testUser.role,
              phone_number: testUser.phone,
              is_active: true
            });
          
          if (profileError) {
            console.log(`❌ 프로필 저장 실패: ${profileError.message}`);
            
            if (profileError.message.includes('duplicate key') || profileError.code === '23505') {
              console.log('ℹ️  이미 존재하는 프로필입니다.');
            } else if (profileError.message.includes('policy') || profileError.code === '42501') {
              console.log('🔧 RLS 정책 문제로 프로필 저장에 실패했습니다.');
              console.log('   Supabase 대시보드에서 manual-rls-fix.sql을 실행하세요.');
            } else {
              console.log('🔧 예상치 못한 오류입니다.');
            }
          } else {
            console.log('✅ 프로필 저장 성공');
          }
        }
        
      } catch (error) {
        console.log(`❌ ${testUser.role} 계정 생성 실패:`, error.message);
      }
    }
    
    // 3. 최종 상태 확인
    console.log('\n📊 테스트 후 user_profiles 테이블 상태:');
    const { data: finalProfiles, error: finalError } = await supabase
      .from('user_profiles')
      .select('id, email, first_name, last_name, role, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (finalError) {
      console.log('❌ 최종 상태 조회 오류:', finalError.message);
    } else {
      console.log(`✅ 총 ${finalProfiles?.length || 0}명의 사용자 확인`);
      if (finalProfiles && finalProfiles.length > 0) {
        console.log('\n📝 최근 가입한 사용자들:');
        finalProfiles.forEach((user, index) => {
          const roleEmoji = user.role === 'student' ? '🎓' : user.role === 'instructor' ? '👨‍🏫' : '👨‍💼';
          console.log(`  ${index + 1}. ${roleEmoji} ${user.first_name} ${user.last_name} (${user.email}) - ${user.role}`);
        });
      }
    }
    
    // 4. 역할별 통계
    console.log('\n📈 역할별 사용자 통계:');
    const roles = ['student', 'instructor', 'admin'];
    
    for (const role of roles) {
      const { count, error: countError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', role);
      
      if (countError) {
        console.log(`❌ ${role} 수 조회 오류:`, countError.message);
      } else {
        const roleEmoji = role === 'student' ? '🎓' : role === 'instructor' ? '👨‍🏫' : '👨‍💼';
        console.log(`  ${roleEmoji} ${role}: ${count || 0}명`);
      }
    }
    
    console.log('\n✅ Role 기반 회원가입 테스트 완료!');
    console.log('\n📌 다음 단계:');
    console.log('1. 웹사이트에서 직접 회원가입 테스트');
    console.log('2. 강사 계정으로 로그인하여 강의 생성 권한 확인');
    console.log('3. 학생 계정으로 로그인하여 수강신청 기능 확인');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
  }
}

// 스크립트 실행
testRoleRegistration();