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
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: role || 'student',
            phone_number: additionalInfo?.phone_number,
            address: additionalInfo?.address,
            organization: additionalInfo?.organization,
            job_title: additionalInfo?.job_title,
            bio: additionalInfo?.bio,
          }
        }
      })
      
      if (error) {
        throw new Error(error.message)
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
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('인증되지 않은 사용자입니다.')
      }
      
      // 사용자 프로필 정보 가져오기
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        throw new Error('사용자 정보를 찾을 수 없습니다.')
      }
      
      return {
        data: {
          id: user.id,
          email: user.email || '',
          ...profile
        }
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
        // 먼저 기본 쿼리로 시도
        let query = supabase
          .from('courses')
          .select(`
            *,
            instructor:user_profiles!courses_instructor_id_fkey(first_name, last_name, email),
            category:categories(name)
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
  }
};

export default apiClient;