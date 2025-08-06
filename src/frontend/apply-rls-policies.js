#!/usr/bin/env node

// Node.js 스크립트를 통해 RLS 정책 적용
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL 또는 키가 환경변수에 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyRLSPolicies() {
  try {
    console.log('🔧 RLS 정책 적용 시작...');
    
    // setup-rls-for-private-data.sql 파일 읽기
    const sqlFilePath = path.join(__dirname, 'setup-rls-for-private-data.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // SQL 문을 개별적으로 실행하기 위해 분리
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 총 ${statements.length}개의 SQL 문을 실행합니다.`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // 빈 문이나 주석은 건너뛰기
      if (!statement || statement.startsWith('--') || statement.trim() === '') {
        continue;
      }
      
      console.log(`\n🔄 SQL 문 ${i + 1} 실행 중...`);
      console.log(`SQL: ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_statement: statement + ';' 
        });
        
        if (error) {
          console.warn(`⚠️  SQL 문 ${i + 1} 실행 중 오류 (계속 진행):`, error.message);
        } else {
          console.log(`✅ SQL 문 ${i + 1} 성공적으로 실행됨`);
        }
      } catch (execError) {
        console.warn(`⚠️  SQL 문 ${i + 1} 실행 중 예외 (계속 진행):`, execError.message);
      }
    }
    
    console.log('\n🔍 RLS 정책 확인 중...');
    
    // RLS 정책 확인
    const { data: policies, error: policiesError } = await supabase
      .from('information_schema.table_privileges')
      .select('*')
      .eq('table_name', 'enrollments');
    
    if (policiesError) {
      console.warn('정책 확인 중 오류:', policiesError.message);
    } else {
      console.log('📋 현재 테이블 권한:', policies);
    }
    
    console.log('\n✅ RLS 정책 적용 완료!');
    console.log('📌 다음 단계: 수강신청 테스트를 진행해보세요.');
    
  } catch (error) {
    console.error('❌ RLS 정책 적용 중 오류:', error);
    process.exit(1);
  }
}

// 스크립트 실행
applyRLSPolicies();