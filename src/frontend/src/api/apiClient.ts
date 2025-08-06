// Supabase 기반 API 클라이언트
import { supabase } from '../lib/supabase'
import type { UserProfile, Course, Category, Enrollment, SubscriptionPlan } from '../lib/supabase'

// API 클라이언트
const apiClient = {
  // 인증 관련 API
  auth: {
    async login(email: string, password: string) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        throw new Error(error.message)
      }
      
      if (data.user) {
        // 사용자 프로필 정보 가져오기
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
        
        if (profileError) {
          console.error('프로필 조회 실패:', profileError)
        }
        
        const userWithProfile = {
          id: data.user.id,
          email: data.user.email || '',
          first_name: profile?.first_name,
          last_name: profile?.last_name,
          role: profile?.role || 'student',
          ...profile
        }
        
        return {
          data: {
            user: userWithProfile,
            token: data.session?.access_token || ''
          }
        }
      }
      
      throw new Error('로그인에 실패했습니다.')
    },

    async register(email: string, password: string, firstName?: string, lastName?: string, role?: 'student' | 'instructor' | 'admin', additionalInfo?: {
      phone_number?: string;
      address?: string;
      organization?: string;
      job_title?: string;
      bio?: string;
    }) {
      // 먼저 이메일 중복 확인
      const { data: existingProfiles } = await supabase
        .from('user_profiles')
        .select('id, email')
        .eq('email', email)
        .limit(1)
      
      if (existingProfiles && existingProfiles.length > 0) {
        throw new Error('이미 사용 중인 이메일입니다.')
      }
      
      // Supabase Auth에 회원가입
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: role || 'student',
          }
        }
      })
      
      if (error) {
        throw new Error(error.message)
      }
      
      // 회원가입 성공 후 user_profiles 테이블에 프로필 데이터 삽입
      if (data.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: email,
            first_name: firstName,
            last_name: lastName,
            role: role || 'student',
            phone_number: additionalInfo?.phone_number,
            address: additionalInfo?.address,
            organization: additionalInfo?.organization,
            job_title: additionalInfo?.job_title,
            bio: additionalInfo?.bio,
            is_active: true
          })
        
        if (profileError) {
          console.error('프로필 생성 실패:', profileError)
          // 인증 사용자는 생성되었지만 프로필 생성에 실패한 경우
          // 나중에 로그인 시 프로필이 자동 생성되도록 처리할 수 있음
        } else {
          console.log('✅ 사용자 프로필 생성 성공')
        }
      }
      
      return {
        data: {
          user: data.user
        }
      }
    },

    async logout() {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw new Error(error.message)
      }
      return { data: {} }
    },

    async getCurrentUser() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          console.error('인증 확인 오류:', authError);
          throw new Error('인증 확인에 실패했습니다.')
        }
        
        if (!user) {
          throw new Error('인증되지 않은 사용자입니다.')
        }
        
        console.log('🔍 사용자 ID로 프로필 조회 시도:', user.id);
        
        // user_profiles 테이블의 실제 컬럼명으로 조회 (id 컬럼 사용)
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('❌ 프로필 조회 실패:', profileError);
          // 프로필이 없는 경우 기본 사용자 정보 반환
          return {
            data: {
              id: user.id,
              email: user.email || '',
              first_name: user.user_metadata?.first_name || '',
              last_name: user.user_metadata?.last_name || '',
              role: 'student'
            }
          };
        }
        
        console.log('✅ 프로필 조회 성공');
        
        return {
          data: {
            id: user.id,
            email: user.email || '',
            ...profile
          }
        };
      } catch (error: any) {
        console.error('getCurrentUser 전체 오류:', error);
        throw error;
      }
    }
  },

  // 사용자 관리 API (관리자용)
  users: {
    async getAll() {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        throw new Error(error.message)
      }
      
      return { data }
    },

    async updateRole(userId: string, role: 'student' | 'instructor' | 'admin') {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ role })
        .eq('id', userId)
        .select()
        .single()
      
      if (error) {
        throw new Error(error.message)
      }
      
      return { data }
    },

    async delete(userId: string) {
      console.log('🗑️ 사용자 삭제 시작:', userId);
      
      try {
        // 1. 현재 사용자 확인 (자기 자신 삭제 방지)
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser && currentUser.id === userId) {
          throw new Error('자기 자신은 삭제할 수 없습니다.');
        }

        // 2. 삭제 대상 사용자 정보 확인
        const { data: targetUser, error: fetchError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (fetchError) {
          throw new Error('삭제할 사용자를 찾을 수 없습니다.');
        }

        console.log(`📝 삭제 대상: ${targetUser.email} (${targetUser.first_name} ${targetUser.last_name})`);

        // 3. 관련 데이터 확인 및 삭제
        console.log('🔍 관련 데이터 확인 중...');
        
        // enrollments 확인 및 삭제
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', userId);
        
        if (enrollments && enrollments.length > 0) {
          console.log(`📚 ${enrollments.length}개의 수강신청 삭제 중...`);
          const { error: enrollError } = await supabase
            .from('enrollments')
            .delete()
            .eq('user_id', userId);
          
          if (enrollError) {
            console.warn('⚠️ enrollments 삭제 실패:', enrollError.message);
          } else {
            console.log('✅ enrollments 삭제 완료');
          }
        }

        // payments 확인 및 삭제
        const { data: payments } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', userId);
        
        if (payments && payments.length > 0) {
          console.log(`💳 ${payments.length}개의 결제 기록 삭제 중...`);
          const { error: paymentError } = await supabase
            .from('payments')
            .delete()
            .eq('user_id', userId);
          
          if (paymentError) {
            console.warn('⚠️ payments 삭제 실패:', paymentError.message);
          } else {
            console.log('✅ payments 삭제 완료');
          }
        }

        // community_posts 확인 및 삭제 (커뮤니티 게시글)
        const { data: posts } = await supabase
          .from('community_posts')
          .select('*')
          .eq('author_id', userId);
        
        if (posts && posts.length > 0) {
          console.log(`📝 ${posts.length}개의 커뮤니티 게시글 삭제 중...`);
          const { error: postsError } = await supabase
            .from('community_posts')
            .delete()
            .eq('author_id', userId);
          
          if (postsError) {
            console.warn('⚠️ community_posts 삭제 실패:', postsError.message);
          } else {
            console.log('✅ community_posts 삭제 완료');
          }
        }

        // community_comments 확인 및 삭제 (커뮤니티 댓글)
        const { data: comments } = await supabase
          .from('community_comments')
          .select('*')
          .eq('author_id', userId);
        
        if (comments && comments.length > 0) {
          console.log(`💬 ${comments.length}개의 커뮤니티 댓글 삭제 중...`);
          const { error: commentsError } = await supabase
            .from('community_comments')
            .delete()
            .eq('author_id', userId);
          
          if (commentsError) {
            console.warn('⚠️ community_comments 삭제 실패:', commentsError.message);
          } else {
            console.log('✅ community_comments 삭제 완료');
          }
        }

        // 4. user_profiles 테이블에서 삭제
        console.log('🗑️ user_profiles에서 삭제 중...');
        const { error: profileError } = await supabase
          .from('user_profiles')
          .delete()
          .eq('id', userId);
        
        if (profileError) {
          console.error('❌ user_profiles 삭제 실패:', profileError);
          throw new Error(`프로필 삭제 실패: ${profileError.message}`);
        }
        console.log('✅ user_profiles 삭제 완료');

        // 5. 삭제 확인
        console.log('🔍 삭제 확인 중...');
        const { data: deletedCheck, error: checkError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (checkError && checkError.code === 'PGRST116') {
          // PGRST116은 "not found" 에러 - 정상적으로 삭제됨
          console.log('✅ 사용자가 성공적으로 삭제되었습니다.');
        } else if (deletedCheck) {
          console.warn('⚠️ 사용자가 완전히 삭제되지 않았습니다.');
          throw new Error('사용자 삭제가 완료되지 않았습니다.');
        }

        // 6. Supabase Auth에서 사용자 삭제 관련 안내
        console.log('ℹ️ Supabase Auth 사용자는 클라이언트에서 직접 삭제할 수 없습니다.');
        console.log('ℹ️ 관리자 대시보드에서 수동으로 비활성화하거나 Supabase 콘솔에서 삭제하세요.');

        console.log('🎯 데이터베이스에서 사용자 삭제 완료');
        return { 
          success: true, 
          message: `사용자 ${targetUser.email}의 모든 데이터가 삭제되었습니다. Supabase Auth 계정은 수동으로 관리하세요.`,
          deletedUser: {
            email: targetUser.email,
            name: `${targetUser.first_name} ${targetUser.last_name}`
          }
        };
        
      } catch (error: any) {
        console.error('❌ 사용자 삭제 실패:', error);
        throw new Error(error.message || '사용자 삭제 중 오류가 발생했습니다.');
      }
    }
  },

  // 코스 관련 API
  courses: {
    async getAll(filters?: any) {
      console.log('🔍 Courses API - filters received:', filters);
      
      // 현재 사용자 정보 확인
      const { data: { user } } = await supabase.auth.getUser()
      console.log('👤 Current user:', user?.email, 'Role:', user?.user_metadata?.role);
      
      try {
        // 먼저 기본 쿼리로 시도 (외래키 없이)
        let query = supabase
          .from('courses')
          .select(`
            *
          `)

        // 관리자나 includeAll 옵션이 있으면 모든 상태의 강의를 조회
        if (!filters?.includeAll) {
          query = query.eq('status', 'published')
          console.log('📚 Filtering by status: published');
        } else {
          console.log('📚 Including all courses (includeAll: true)');
        }

        if (filters?.category) {
          query = query.eq('category_id', filters.category)
          console.log('🏷️ Filtering by category:', filters.category);
        }
        
        if (filters?.level) {
          query = query.eq('level', filters.level)
          console.log('📊 Filtering by level:', filters.level);
        }
        
        if (filters?.search) {
          query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
          console.log('🔍 Searching for:', filters.search);
        }

        const { data, error } = await query.order('created_at', { ascending: false })
        
        if (error) {
          console.error('❌ Primary query failed:', error);
          
          // RLS 오류인 경우 더 간단한 쿼리로 재시도
          if (error.message.includes('policy') || error.message.includes('permission') || error.code === 'PGRST116') {
            console.log('🔄 Retrying with simplified query due to RLS issue...');
            
            const simpleQuery = supabase
              .from('courses')
              .select('*')
              .eq('status', 'published')
              .order('created_at', { ascending: false });
            
            const { data: simpleData, error: simpleError } = await simpleQuery;
            
            if (simpleError) {
              console.error('❌ Simple query also failed:', simpleError);
              throw new Error(simpleError.message);
            }
            
            console.log(`✅ Simple query retrieved ${simpleData?.length || 0} courses`);
            return { data: simpleData };
          }
          
          throw new Error(error.message);
        }
        
        console.log(`✅ Retrieved ${data?.length || 0} courses from database`);
        
        // 강사 정보를 별도로 조회해서 매핑
        if (data && data.length > 0) {
          const instructorIds = Array.from(new Set(data.map(course => course.instructor_id).filter(Boolean)));
          
          if (instructorIds.length > 0) {
            try {
              const { data: instructors } = await supabase
                .from('user_profiles')
                .select('id, first_name, last_name, email')
                .in('id', instructorIds);
              
              if (instructors) {
                const instructorMap = new Map(instructors.map(inst => [inst.id, inst]));
                
                const coursesWithInstructors = data.map(course => ({
                  ...course,
                  instructor: instructorMap.get(course.instructor_id) || {
                    id: course.instructor_id,
                    first_name: '알수없음',
                    last_name: '',
                    email: ''
                  }
                }));
                
                return { data: coursesWithInstructors };
              }
            } catch (instructorError) {
              console.warn('⚠️ 강사 정보 조회 실패, 기본 정보로 처리:', instructorError);
            }
          }
        }
        
        return { data };
        
      } catch (error: any) {
        console.error('❌ Courses query error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:user_profiles!courses_instructor_id_fkey(first_name, last_name, email, bio),
          category:categories(name),
          modules(
            *,
            chapters(*)
          )
        `)
        .eq('id', id)
        .single()
      
      if (error) {
        throw new Error(error.message)
      }
      
      return { data }
    },

    async create(courseData: any) {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.')
      }
      
      const { data, error } = await supabase
        .from('courses')
        .insert({
          ...courseData,
          instructor_id: user.id,
          slug: courseData.title.toLowerCase().replace(/\s+/g, '-')
        })
        .select()
        .single()
      
      if (error) {
        throw new Error(error.message)
      }
      
      return { data }
    },

    async update(id: string, courseData: any) {
      const { data, error } = await supabase
        .from('courses')
        .update(courseData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        throw new Error(error.message)
      }
      
      return { data }
    },

    async delete(id: string) {
      const { data, error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        throw new Error(error.message)
      }
      
      return { data }
    }
  },

  // 주차/모듈 관련 API (Supabase 사용)
  modules: {
    async saveWeeks(courseId: string, weeks: any[]) {
      try {
        console.log('🔄 주차 데이터를 Supabase에 저장 시작:', weeks);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('인증되지 않은 사용자입니다.');
        }

        // 기존 모듈들 삭제 (업데이트를 위해)
        const { error: deleteError } = await supabase
          .from('modules')
          .delete()
          .eq('course_id', courseId);

        if (deleteError) {
          console.warn('기존 모듈 삭제 중 오류:', deleteError);
        }

        // 새로운 모듈들 저장 (description 필드에 JSON 저장)
        const modulesToInsert = weeks.map((week, index) => ({
          course_id: courseId,
          title: week.title || `${week.week_number}주차`,
          description: JSON.stringify({
            description: week.description || '',
            week_number: week.week_number,
            video_url: week.video_url,
            materials: week.materials,
            duration_minutes: week.duration_minutes
          }),
          order_index: week.order_index || index,
          is_published: week.is_published || false
        }));

        if (modulesToInsert.length > 0) {
          const { data, error } = await supabase
            .from('modules')
            .insert(modulesToInsert)
            .select();

          if (error) {
            throw new Error(error.message);
          }

          console.log('✅ 주차 데이터 Supabase 저장 성공:', data);
          return { data: weeks };
        }

        return { data: [] };
      } catch (error) {
        console.error('❌ 주차 저장 실패:', error);
        throw error;
      }
    },

    async getWeeks(courseId: string) {
      try {
        console.log('🔄 주차 데이터를 Supabase에서 조회:', courseId);
        
        const { data: modules, error } = await supabase
          .from('modules')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });

        if (error) {
          throw new Error(error.message);
        }

        // Supabase 모듈 데이터를 주차 형식으로 변환
        const weeks = modules?.map((module: any) => {
          let additionalData: any = {};
          try {
            // description 필드에서 JSON 데이터 파싱
            additionalData = module.description ? JSON.parse(module.description) : {};
          } catch (e) {
            console.warn('모듈 description 파싱 오류:', e);
            // 파싱 실패 시 description을 텍스트로 처리
            additionalData = { description: module.description || '' };
          }

          return {
            id: module.id,
            week_number: additionalData.week_number || (module.order_index + 1),
            title: module.title,
            description: additionalData.description || '',
            video_url: additionalData.video_url,
            materials: additionalData.materials,
            duration_minutes: additionalData.duration_minutes,
            is_published: module.is_published,
            order_index: module.order_index,
            created_at: module.created_at,
            updated_at: module.updated_at
          };
        }) || [];

        console.log('✅ 주차 데이터 Supabase 조회 성공:', weeks);
        return { data: weeks };
      } catch (error) {
        console.error('❌ 주차 데이터 불러오기 실패:', error);
        
        // 백업으로 localStorage 확인
        try {
          const weeksKey = `course_weeks_${courseId}`;
          const storedWeeks = localStorage.getItem(weeksKey);
          if (storedWeeks) {
            const weeks = JSON.parse(storedWeeks);
            console.log('📦 localStorage에서 백업 데이터 사용:', weeks);
            return { data: weeks };
          }
        } catch (localError) {
          console.error('localStorage 백업 조회 실패:', localError);
        }
        
        return { data: [] };
      }
    },

    // localStorage에서 Supabase로 데이터 마이그레이션
    async migrateFromLocalStorage(courseId: string) {
      try {
        const weeksKey = `course_weeks_${courseId}`;
        const storedWeeks = localStorage.getItem(weeksKey);
        
        if (!storedWeeks) {
          console.log('마이그레이션할 localStorage 데이터가 없습니다.');
          return { success: false, message: '마이그레이션할 데이터가 없습니다.' };
        }

        const weeks = JSON.parse(storedWeeks);
        console.log('📦 localStorage에서 마이그레이션할 데이터:', weeks);

        // Supabase에 저장
        await this.saveWeeks(courseId, weeks);
        
        console.log('✅ localStorage → Supabase 마이그레이션 완료');
        return { success: true, message: `${weeks.length}개의 주차 데이터를 성공적으로 마이그레이션했습니다.` };
      } catch (error) {
        console.error('❌ 마이그레이션 실패:', error);
        return { success: false, message: '마이그레이션 중 오류가 발생했습니다.' };
      }
    }
  },

  // 수강등록 관련 API
  enrollments: {
    async getUserEnrollments(userId?: string) {
      const { data: { user } } = await supabase.auth.getUser()
      const targetUserId = userId || user?.id
      
      if (!targetUserId) {
        throw new Error('사용자 인증이 필요합니다.')
      }
      
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(
            *,
            instructor:user_profiles!courses_instructor_id_fkey(first_name, last_name)
          )
        `)
        .eq('user_id', targetUserId)
        .order('enrollment_date', { ascending: false })
      
      if (error) {
        throw new Error(error.message)
      }
      
      return { data }
    },

    async enrollCourse(courseId: string) {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.')
      }
      
      // 이미 등록되어 있는지 확인
      const { data: existing } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single()
      
      if (existing) {
        throw new Error('이미 등록된 강의입니다.')
      }
      
      const { data, error } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          status: 'active'
        })
        .select()
        .single()
      
      if (error) {
        throw new Error(error.message)
      }
      
      return { data }
    },

    // 진도율 업데이트
    async updateProgress(courseId: string, chapterIds: string[], progress: number) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('인증되지 않은 사용자입니다.');
        }

        // 수강등록 정보 조회
        const { data: enrollment, error: enrollmentError } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .single();

        if (enrollmentError) {
          throw new Error('수강 등록 정보를 찾을 수 없습니다.');
        }

        // 진도율 업데이트
        const { data, error } = await supabase
          .from('enrollments')
          .update({
            progress: Math.min(100, Math.max(0, progress)),
            completed_chapters: chapterIds,
            completion_date: progress >= 100 ? new Date().toISOString() : null
          })
          .eq('id', enrollment.id)
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }

        console.log('✅ 진도율 업데이트 성공:', { progress, completedChapters: chapterIds.length });
        return { data };
      } catch (error) {
        console.error('❌ 진도율 업데이트 실패:', error);
        throw error;
      }
    },

    // 수강생의 현재 진도율 조회
    async getProgress(courseId: string) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return { data: { progress: 0, completed_chapters: [] } };
        }

        const { data: enrollment, error } = await supabase
          .from('enrollments')
          .select('progress, completed_chapters')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .single();

        if (error) {
          // 수강등록하지 않은 경우
          return { data: { progress: 0, completed_chapters: [] } };
        }

        return { 
          data: { 
            progress: enrollment.progress || 0, 
            completed_chapters: enrollment.completed_chapters || [] 
          } 
        };
      } catch (error) {
        console.error('❌ 진도율 조회 실패:', error);
        return { data: { progress: 0, completed_chapters: [] } };
      }
    },

    async getCourseStudents(courseId: string) {
      try {
        // 현재 로그인한 사용자 확인
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error('로그인이 필요합니다.');
        }

        // 해당 강의의 강사인지 확인
        const { data: course, error: courseError } = await supabase
          .from('courses')
          .select('instructor_id, title')
          .eq('id', courseId)
          .single();

        if (courseError) {
          throw new Error('강의를 찾을 수 없습니다.');
        }

        if (!course) {
          throw new Error('존재하지 않는 강의입니다.');
        }

        // 강사 권한 확인
        if (course.instructor_id !== user.id) {
          // 관리자는 모든 강의의 수강생을 볼 수 있음
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (userProfile?.role !== 'admin') {
            throw new Error('해당 강의의 수강생 정보를 조회할 권한이 없습니다.');
          }
        }

        console.log(`✅ 강사 권한 확인 완료: 강의 "${course.title}"의 수강생 조회`);

        // 수강생 목록 조회
        const { data, error } = await supabase
          .from('enrollments')
          .select(`
            id,
            enrollment_date,
            completion_date,
            status,
            progress,
            completed_chapters,
            user:user_profiles!enrollments_user_id_fkey(
              id,
              email,
              first_name,
              last_name
            )
          `)
          .eq('course_id', courseId)
          .order('enrollment_date', { ascending: false });

        if (error) {
          throw new Error(error.message);
        }

        // 데이터 변환
        const students = data?.map((enrollment: any) => ({
          id: enrollment.user?.id || '',
          email: enrollment.user?.email || '',
          first_name: enrollment.user?.first_name || '',
          last_name: enrollment.user?.last_name || '',
          enrollment_date: enrollment.enrollment_date,
          progress: enrollment.progress || 0,
          last_activity: enrollment.completion_date || enrollment.enrollment_date,
          completed_chapters: enrollment.completed_chapters || []
        })) || [];

        console.log(`✅ 수강생 ${students.length}명 조회 성공`);
        return { data: students };
      } catch (error) {
        console.error('❌ 수강생 목록 조회 실패:', error);
        throw error;
      }
    }
  },

  // 카테고리 관련 API
  categories: {
    async getAll() {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      
      if (error) {
        throw new Error(error.message)
      }
      
      return { data }
    }
  },

  // 구독 관련 API
  subscriptions: {
    async getPlans() {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      
      if (error) {
        throw new Error(error.message)
      }
      
      return { data }
    },

    async getUserSubscription() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.')
      }
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', user.id)
        .single()
      
      if (error && error.code !== 'PGRST116') { // PGRST116은 "not found" 에러
        throw new Error(error.message)
      }
      
      return { data }
    }
  },

  // 커뮤니티 관련 API
  community: {
    // 게시글 목록 조회
    async getPosts(filters?: { category?: string; search?: string; page?: number; limit?: number }) {
      let query = supabase
        .from('community_posts')
        .select(`
          *,
          author:user_profiles!community_posts_author_id_fkey(id, first_name, last_name, email),
          category:community_categories(id, name)
        `)
        .order('created_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('category_id', filters.category);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }

      if (filters?.page && filters?.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      // 각 게시글의 댓글 수를 별도로 조회
      if (data && data.length > 0) {
        const postsWithCommentCount = await Promise.all(
          data.map(async (post: any) => {
            const { count } = await supabase
              .from('community_comments')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);
            
            return {
              ...post,
              comment_count: count || 0
            };
          })
        );
        
        return { data: postsWithCommentCount };
      }

      return { data };
    },

    // 게시글 상세 조회
    async getPostById(id: string) {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          author:user_profiles!community_posts_author_id_fkey(id, first_name, last_name, email),
          category:community_categories(id, name),
          comments:community_comments(
            *,
            author:user_profiles!community_comments_author_id_fkey(id, first_name, last_name, email)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // 조회수 증가
      await supabase
        .from('community_posts')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', id);

      return { data: { ...data, view_count: (data.view_count || 0) + 1 } };
    },

    // 게시글 작성
    async createPost(postData: {
      title: string;
      content: string;
      category_id?: string;
      images?: string[];
    }) {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          title: postData.title,
          content: postData.content,
          author_id: user.id,
          category_id: postData.category_id,
          images: postData.images || []
        })
        .select(`
          *,
          author:user_profiles!community_posts_author_id_fkey(id, first_name, last_name, email),
          category:community_categories(id, name)
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { data };
    },

    // 게시글 수정
    async updatePost(id: string, postData: {
      title?: string;
      content?: string;
      category_id?: string;
      images?: string[];
    }) {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      const { data, error } = await supabase
        .from('community_posts')
        .update({
          ...postData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('author_id', user.id) // 본인 글만 수정 가능
        .select(`
          *,
          author:user_profiles!community_posts_author_id_fkey(id, first_name, last_name, email),
          category:community_categories(id, name)
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { data };
    },

    // 게시글 삭제 (모든 관련 데이터 삭제 포함)
    async deletePost(id: string) {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      // 먼저 게시글 정보를 가져와서 이미지 URL들을 확인
      const { data: post, error: fetchError } = await supabase
        .from('community_posts')
        .select('images, author_id')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw new Error('게시글을 찾을 수 없습니다.');
      }

      if (!post || post.author_id !== user.id) {
        throw new Error('삭제 권한이 없습니다.');
      }

      // Storage에서 이미지 파일들 삭제
      if (post.images && Array.isArray(post.images) && post.images.length > 0) {
        try {
          const imagePaths = post.images.map((imageUrl: string) => {
            // URL에서 파일 경로 추출
            const urlParts = imageUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];
            return `${user.id}/${fileName}`;
          });
          
          const { error: storageError } = await supabase.storage
            .from('community-images')
            .remove(imagePaths);

          if (storageError) {
            console.warn('이미지 파일 삭제 중 오류:', storageError);
            // 이미지 삭제 실패해도 게시글은 삭제 진행
          }
        } catch (imageError) {
          console.warn('이미지 삭제 처리 중 오류:', imageError);
        }
      }

      // 게시글 삭제 (CASCADE로 댓글들도 자동 삭제됨)
      const { error: deleteError } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', id)
        .eq('author_id', user.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      return { success: true };
    },

    // 댓글 작성
    async createComment(commentData: {
      post_id: string;
      content: string;
      parent_id?: string;
    }) {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      const { data, error } = await supabase
        .from('community_comments')
        .insert({
          post_id: commentData.post_id,
          content: commentData.content,
          author_id: user.id,
          parent_id: commentData.parent_id
        })
        .select(`
          *,
          author:user_profiles!community_comments_author_id_fkey(id, first_name, last_name, email)
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { data };
    },

    // 댓글 수정
    async updateComment(id: string, content: string) {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      const { data, error } = await supabase
        .from('community_comments')
        .update({
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('author_id', user.id) // 본인 댓글만 수정 가능
        .select(`
          *,
          author:user_profiles!community_comments_author_id_fkey(id, first_name, last_name, email)
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { data };
    },

    // 댓글 삭제
    async deleteComment(id: string) {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      const { error } = await supabase
        .from('community_comments')
        .delete()
        .eq('id', id)
        .eq('author_id', user.id); // 본인 댓글만 삭제 가능

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    },

    // 카테고리 목록 조회
    async getCategories() {
      const { data, error } = await supabase
        .from('community_categories')
        .select('*')
        .order('name');

      if (error) {
        throw new Error(error.message);
      }

      return { data };
    },

    // 이미지 업로드
    async uploadImage(file: File) {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      // 파일 확장자 확인
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('지원하지 않는 이미지 형식입니다. (JPG, PNG, GIF, WebP만 가능)');
      }

      // 파일 크기 확인 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('이미지 크기는 5MB 이하여야 합니다.');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('community-images')
        .upload(fileName, file);

      if (error) {
        throw new Error(error.message);
      }

      // 공개 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('community-images')
        .getPublicUrl(fileName);

      return { data: { url: publicUrl, path: fileName } };
    }
  },

  // 강의 Q&A 관련 API
  courseQnA: {
    // Q&A 목록 조회 (특정 강의)
    async getQnAList(courseId: string, filters?: { 
      status?: string; 
      isPrivate?: boolean; 
      search?: string; 
      page?: number; 
      limit?: number 
    }) {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      let query = supabase
        .from('course_qna')
        .select(`
          *,
          author:user_profiles!course_qna_author_id_fkey(id, first_name, last_name, email, role),
          answers:course_qna!parent_id(
            *,
            author:user_profiles!course_qna_author_id_fkey(id, first_name, last_name, email, role)
          )
        `)
        .eq('course_id', courseId)
        .eq('is_question', true)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.isPrivate !== undefined) {
        query = query.eq('is_private', filters.isPrivate);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }

      if (filters?.page && filters?.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { data };
    },

    // Q&A 상세 조회
    async getQnAById(qnaId: string) {
      const { data, error } = await supabase
        .from('course_qna')
        .select(`
          *,
          author:user_profiles!course_qna_author_id_fkey(id, first_name, last_name, email, role),
          answers:course_qna!parent_id(
            *,
            author:user_profiles!course_qna_author_id_fkey(id, first_name, last_name, email, role)
          )
        `)
        .eq('id', qnaId)
        .eq('is_question', true)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // 조회수 증가
      await supabase
        .from('course_qna')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', qnaId);

      return { data: { ...data, view_count: (data.view_count || 0) + 1 } };
    },

    // 질문 작성
    async createQuestion(questionData: {
      course_id: string;
      title: string;
      content: string;
      is_private?: boolean;
    }) {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      // 수강신청 확인
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', questionData.course_id)
        .single();

      if (!enrollment) {
        throw new Error('수강신청한 강의에서만 질문을 작성할 수 있습니다.');
      }

      const { data, error } = await supabase
        .from('course_qna')
        .insert({
          course_id: questionData.course_id,
          author_id: user.id,
          title: questionData.title,
          content: questionData.content,
          is_question: true,
          is_private: questionData.is_private || false,
          status: 'pending'
        })
        .select(`
          *,
          author:user_profiles!course_qna_author_id_fkey(id, first_name, last_name, email, role)
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { data };
    },

    // 답변 작성 (강사만)
    async createAnswer(answerData: {
      course_id: string;
      parent_id: string; // 질문 ID
      content: string;
    }) {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      // 강사 권한 확인
      const { data: course } = await supabase
        .from('courses')
        .select('instructor_id, title')
        .eq('id', answerData.course_id)
        .single();

      if (!course) {
        throw new Error('강의를 찾을 수 없습니다.');
      }

      // 강사 또는 관리자만 답변 가능
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (course.instructor_id !== user.id && userProfile?.role !== 'admin') {
        throw new Error('강사만 답변을 작성할 수 있습니다.');
      }

      const { data, error } = await supabase
        .from('course_qna')
        .insert({
          course_id: answerData.course_id,
          author_id: user.id,
          parent_id: answerData.parent_id,
          content: answerData.content,
          is_question: false
        })
        .select(`
          *,
          author:user_profiles!course_qna_author_id_fkey(id, first_name, last_name, email, role)
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { data };
    },

    // Q&A 수정
    async updateQnA(qnaId: string, updateData: {
      title?: string;
      content?: string;
      is_private?: boolean;
      status?: string;
    }) {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      const { data, error } = await supabase
        .from('course_qna')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', qnaId)
        .eq('author_id', user.id) // 본인 글만 수정 가능
        .select(`
          *,
          author:user_profiles!course_qna_author_id_fkey(id, first_name, last_name, email, role)
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { data };
    },

    // Q&A 삭제
    async deleteQnA(qnaId: string) {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      const { error } = await supabase
        .from('course_qna')
        .delete()
        .eq('id', qnaId)
        .eq('author_id', user.id); // 본인 글만 삭제 가능

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    },

    // 좋아요 토글
    async toggleLike(qnaId: string) {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      // 기존 좋아요 확인
      const { data: existingLike } = await supabase
        .from('course_qna_likes')
        .select('*')
        .eq('qna_id', qnaId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // 좋아요 취소
        const { error: deleteError } = await supabase
          .from('course_qna_likes')
          .delete()
          .eq('qna_id', qnaId)
          .eq('user_id', user.id);

        if (deleteError) {
          throw new Error(deleteError.message);
        }

        // 좋아요 수 감소
        const { error: updateError } = await supabase.rpc('decrement_qna_like_count', {
          qna_id: qnaId
        });

        if (updateError) {
          console.warn('좋아요 수 업데이트 실패:', updateError);
        }

        return { data: { liked: false } };
      } else {
        // 좋아요 추가
        const { error: insertError } = await supabase
          .from('course_qna_likes')
          .insert({
            qna_id: qnaId,
            user_id: user.id
          });

        if (insertError) {
          throw new Error(insertError.message);
        }

        // 좋아요 수 증가
        const { error: updateError } = await supabase.rpc('increment_qna_like_count', {
          qna_id: qnaId
        });

        if (updateError) {
          console.warn('좋아요 수 업데이트 실패:', updateError);
        }

        return { data: { liked: true } };
      }
    },

    // 강의별 Q&A 통계
    async getQnAStats(courseId: string) {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      // 전체 질문 수
      const { count: totalQuestions } = await supabase
        .from('course_qna')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId)
        .eq('is_question', true);

      // 답변 완료된 질문 수
      const { count: answeredQuestions } = await supabase
        .from('course_qna')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId)
        .eq('is_question', true)
        .eq('status', 'answered');

      // 내가 작성한 질문 수
      const { count: myQuestions } = await supabase
        .from('course_qna')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId)
        .eq('is_question', true)
        .eq('author_id', user.id);

      return {
        data: {
          totalQuestions: totalQuestions || 0,
          answeredQuestions: answeredQuestions || 0,
          pendingQuestions: (totalQuestions || 0) - (answeredQuestions || 0),
          myQuestions: myQuestions || 0,
          answerRate: totalQuestions ? Math.round((answeredQuestions || 0) / totalQuestions * 100) : 0
        }
      };
    }
  },

  // 수료증 관련 API
  certificates: {
    // 사용자의 수료증 목록 조회
    async getUserCertificates() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      const { data, error } = await supabase
        .from('certificates')
        .select(`
          id,
          certificate_number,
          issued_at,
          completion_date,
          final_score,
          total_study_hours,
          course_id,
          courses(
            title,
            description,
            instructor_id
          )
        `)
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        return { data: [] };
      }

      // 강사 정보 별도 조회
      const instructorIds = Array.from(new Set(data.map((cert: any) => cert.courses?.instructor_id).filter(Boolean)));
      let instructorMap = new Map();
      
      if (instructorIds.length > 0) {
        const { data: instructors } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name, email')
          .in('id', instructorIds);
        
        if (instructors) {
          instructorMap = new Map(instructors.map(inst => [inst.id, inst]));
        }
      }

      // 데이터 구조 변환
      const transformedData = data.map((cert: any) => {
        const instructor = instructorMap.get(cert.courses?.instructor_id);
        return {
          id: cert.id,
          certificate_number: cert.certificate_number,
          issued_at: cert.issued_at,
          completion_date: cert.completion_date,
          final_score: cert.final_score,
          total_study_hours: cert.total_study_hours,
          course_title: cert.courses?.title || '알 수 없는 강의',
          course_description: cert.courses?.description || '',
          instructor_first_name: instructor?.first_name || '',
          instructor_last_name: instructor?.last_name || ''
        };
      });

      return { data: transformedData };
    },

    // 특정 강의의 수료증 조회
    async getCertificateByCourse(courseId: string) {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      const { data, error } = await supabase
        .from('certificates')
        .select(`
          id,
          certificate_number,
          issued_at,
          completion_date,
          final_score,
          total_study_hours,
          course_id,
          courses(
            title,
            description,
            instructor_id
          )
        `)
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: no rows returned
        throw new Error(error.message);
      }

      if (!data) {
        return { data: null };
      }

      // 강사 정보 별도 조회
      const courseData = Array.isArray(data.courses) ? data.courses[0] : data.courses;
      
      if (courseData?.instructor_id) {
        const { data: instructor } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name, email')
          .eq('id', courseData.instructor_id)
          .single();

        // 데이터 구조 변환
        const transformedData = {
          id: data.id,
          certificate_number: data.certificate_number,
          issued_at: data.issued_at,
          completion_date: data.completion_date,
          final_score: data.final_score,
          total_study_hours: data.total_study_hours,
          course_title: courseData?.title || '알 수 없는 강의',
          course_description: courseData?.description || '',
          instructor_first_name: instructor?.first_name || '',
          instructor_last_name: instructor?.last_name || ''
        };

        return { data: transformedData };
      }

      // 강사 정보가 없는 경우에도 기본 변환
      const transformedData = {
        id: data.id,
        certificate_number: data.certificate_number,
        issued_at: data.issued_at,
        completion_date: data.completion_date,
        final_score: data.final_score,
        total_study_hours: data.total_study_hours,
        course_title: courseData?.title || '알 수 없는 강의',
        course_description: courseData?.description || '',
        instructor_first_name: '',
        instructor_last_name: ''
      };

      return { data: transformedData };
    },

    // 수료증 번호로 조회 (공개 조회)
    async getCertificateByNumber(certificateNumber: string) {
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          id,
          certificate_number,
          issued_at,
          completion_date,
          final_score,
          total_study_hours,
          course_id,
          courses(
            title,
            description,
            instructor_id
          )
        `)
        .eq('certificate_number', certificateNumber)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        return { data: null };
      }

      // 강사 정보 별도 조회
      const courseData = Array.isArray(data.courses) ? data.courses[0] : data.courses;
      
      if (courseData?.instructor_id) {
        const { data: instructor } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name, email')
          .eq('id', courseData.instructor_id)
          .single();

        // 데이터 구조 변환
        const transformedData = {
          id: data.id,
          certificate_number: data.certificate_number,
          issued_at: data.issued_at,
          completion_date: data.completion_date,
          final_score: data.final_score,
          total_study_hours: data.total_study_hours,
          course_title: courseData?.title || '알 수 없는 강의',
          course_description: courseData?.description || '',
          instructor_first_name: instructor?.first_name || '',
          instructor_last_name: instructor?.last_name || ''
        };

        return { data: transformedData };
      }

      // 강사 정보가 없는 경우에도 기본 변환
      const transformedData = {
        id: data.id,
        certificate_number: data.certificate_number,
        issued_at: data.issued_at,
        completion_date: data.completion_date,
        final_score: data.final_score,
        total_study_hours: data.total_study_hours,
        course_title: courseData?.title || '알 수 없는 강의',
        course_description: courseData?.description || '',
        instructor_first_name: '',
        instructor_last_name: ''
      };

      return { data: transformedData };
    },

    // 수강 진도율 확인
    async getCompletionRate(courseId: string) {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      const { data, error } = await supabase.rpc('calculate_course_completion_rate', {
        p_user_id: user.id,
        p_course_id: courseId
      });

      if (error) {
        throw new Error(error.message);
      }

      return { data: { completionRate: data } };
    },

    // 수료증 수동 발급 요청
    async requestCertificate(courseId: string) {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      try {
        const { data, error } = await supabase.rpc('auto_issue_certificate', {
          p_user_id: user.id,
          p_course_id: courseId
        });

        if (error) {
          // RPC 함수가 존재하지 않는 경우
          if (error.code === '42883') {
            console.warn('⚠️ auto_issue_certificate RPC 함수가 존재하지 않습니다. 수동 수료증 발급이 필요합니다.');
            throw new Error('수료증 발급 기능이 설정되지 않았습니다. 관리자에게 문의하세요.');
          }
          
          // 기타 오류
          throw new Error(error.message);
        }

        return { data };
      } catch (error: any) {
        // RPC 관련 오류는 좀 더 자세한 정보 제공
        if (error.code === '42883') {
          throw new Error('수료증 발급 기능이 설정되지 않았습니다. 관리자에게 문의하세요.');
        }
        
        throw error;
      }
    },

    // 진도 업데이트
    async updateProgress(courseId: string, weekNumber: number, videoId?: string, watchDuration?: number) {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      try {
        // 기존 진도 확인
        const { data: existingProgress, error: selectError } = await supabase
          .from('course_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .eq('week_number', weekNumber)
          .eq('video_id', videoId || '')
          .single();

        // 테이블이 존재하지 않는 경우 처리
        if (selectError && selectError.code === '42P01') {
          console.warn('⚠️ course_progress 테이블이 존재하지 않습니다. 스키마를 확인해주세요.');
          // 테이블이 없어도 성공으로 처리 (기존 enrollments API가 동작하므로)
          return { data: { success: true, message: 'course_progress 테이블 없음. enrollments API로 대체 처리됨.' } };
        }

        if (existingProgress) {
          // 기존 진도 업데이트
          const { data, error } = await supabase
            .from('course_progress')
            .update({
              is_completed: true,
              watch_duration: Math.max(existingProgress.watch_duration || 0, watchDuration || 0),
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingProgress.id)
            .select()
            .single();

          if (error) {
            throw new Error(error.message);
          }

          return { data };
        } else {
          // 새 진도 생성
          const { data, error } = await supabase
            .from('course_progress')
            .insert({
              user_id: user.id,
              course_id: courseId,
              week_number: weekNumber,
              video_id: videoId || '',
              is_completed: true,
              watch_duration: watchDuration || 0,
              completed_at: new Date().toISOString()
            })
            .select()
            .single();

          if (error) {
            throw new Error(error.message);
          }

          return { data };
        }
      } catch (error: any) {
        // 테이블 관련 오류는 경고로 처리하고 계속 진행
        if (error.code === '42P01' || error.message?.includes('course_progress')) {
          console.warn('⚠️ course_progress 관련 오류 (무시됨):', error.message);
          return { data: { success: true, message: 'course_progress 오류 무시됨' } };
        }
        throw error;
      }
    },

    // 퀴즈 결과 저장
    async saveQuizResult(courseId: string, weekNumber: number, quizData: any, score: number, totalQuestions: number, correctAnswers: number) {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      const { data, error } = await supabase
        .from('quiz_results')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          week_number: weekNumber,
          quiz_data: quizData,
          score: score,
          total_questions: totalQuestions,
          correct_answers: correctAnswers
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { data };
    },

    // 강의별 수료증 발급 현황 (강사용)
    async getCourseCertificates(courseId: string) {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.');
      }

      const { data, error } = await supabase
        .from('certificate_details')
        .select('*')
        .eq('course_id', courseId)
        .order('issued_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return { data };
    }
  }
};

export default apiClient;