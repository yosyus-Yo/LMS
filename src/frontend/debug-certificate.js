// 수료증 발급 문제 디버깅 스크립트
// 브라우저 콘솔에서 실행하여 수료증 발급 상태를 확인합니다.

async function debugCertificateIssue() {
  try {
    console.log('🔍 수료증 발급 문제 디버깅 시작...');
    
    // 1. 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ 사용자가 로그인되지 않음');
      return;
    }
    console.log('✅ 현재 사용자:', user.id);
    
    // 2. 수강 중인 강의 확인
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', user.id);
    
    if (enrollError) {
      console.error('❌ 수강 등록 조회 실패:', enrollError);
      return;
    }
    
    console.log('📚 수강 중인 강의들:', enrollments);
    
    if (!enrollments || enrollments.length === 0) {
      console.log('⚠️ 수강 중인 강의가 없습니다.');
      return;
    }
    
    // 3. 각 강의별 진도 확인
    for (const enrollment of enrollments) {
      console.log(`\n📖 강의 ID: ${enrollment.course_id}`);
      console.log(`📊 진도율: ${enrollment.progress}%`);
      
      // course_progress 테이블 확인
      const { data: progressData, error: progressError } = await supabase
        .from('course_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', enrollment.course_id);
      
      if (progressError) {
        console.error('❌ course_progress 테이블 조회 실패:', progressError);
        console.log('💡 course_progress 테이블이 존재하지 않을 수 있습니다. certificate-schema.sql을 실행해주세요.');
      } else {
        console.log('📈 course_progress 데이터:', progressData);
      }
      
      // 이미 발급된 수료증 확인
      const { data: existingCert, error: certError } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', enrollment.course_id);
      
      if (certError) {
        console.error('❌ certificates 테이블 조회 실패:', certError);
        console.log('💡 certificates 테이블이 존재하지 않을 수 있습니다. certificate-schema.sql을 실행해주세요.');
      } else if (existingCert && existingCert.length > 0) {
        console.log('🎓 이미 발급된 수료증:', existingCert);
      } else {
        console.log('❌ 발급된 수료증 없음');
        
        // 100% 완료인 경우 수동으로 수료증 발급 시도
        if (enrollment.progress >= 100) {
          console.log('🚀 100% 완료된 강의에 대해 수료증 발급 시도...');
          
          try {
            const { data: certResult, error: certIssueError } = await supabase.rpc('auto_issue_certificate', {
              p_user_id: user.id,
              p_course_id: enrollment.course_id
            });
            
            if (certIssueError) {
              console.error('❌ 수료증 발급 실패:', certIssueError);
              if (certIssueError.code === '42883') {
                console.log('💡 auto_issue_certificate RPC 함수가 존재하지 않습니다. certificate-schema.sql을 실행해주세요.');
              }
            } else {
              console.log('🎉 수료증 발급 성공:', certResult);
            }
          } catch (error) {
            console.error('❌ 수료증 발급 중 오류:', error);
          }
        }
      }
    }
    
    // 4. 데이터베이스 함수 존재 확인
    console.log('\n🔧 데이터베이스 함수 확인...');
    
    try {
      const { data: functions, error: funcError } = await supabase.rpc('auto_issue_certificate', {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_course_id: '00000000-0000-0000-0000-000000000000'
      });
    } catch (error) {
      if (error.code === '42883') {
        console.error('❌ auto_issue_certificate 함수가 존재하지 않습니다.');
        console.log('💡 해결방법: certificate-schema.sql 파일을 데이터베이스에 실행해주세요.');
      } else {
        console.log('✅ auto_issue_certificate 함수가 존재합니다 (다른 오류 발생은 정상)');
      }
    }
    
  } catch (error) {
    console.error('❌ 디버깅 중 오류 발생:', error);
  }
}

// 실행
debugCertificateIssue();