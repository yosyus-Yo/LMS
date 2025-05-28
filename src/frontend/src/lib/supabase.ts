import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// 데이터베이스 타입 정의
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'instructor' | 'student'
          first_name?: string
          last_name?: string
          profile_image_url?: string
          bio?: string
          phone_number?: string
          address?: string
          organization?: string
          job_title?: string
          skills: string[]
          preferences: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'admin' | 'instructor' | 'student'
          first_name?: string
          last_name?: string
          profile_image_url?: string
          bio?: string
          phone_number?: string
          address?: string
          organization?: string
          job_title?: string
          skills?: string[]
          preferences?: Record<string, any>
        }
        Update: {
          email?: string
          role?: 'admin' | 'instructor' | 'student'
          first_name?: string
          last_name?: string
          profile_image_url?: string
          bio?: string
          phone_number?: string
          address?: string
          organization?: string
          job_title?: string
          skills?: string[]
          preferences?: Record<string, any>
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description?: string
          parent_id?: string
          icon?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          description?: string
          parent_id?: string
          icon?: string
        }
        Update: {
          name?: string
          description?: string
          parent_id?: string
          icon?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          slug: string
          description: string
          short_description?: string
          instructor_id: string
          category_id?: string
          thumbnail_url?: string
          status: 'draft' | 'published' | 'archived'
          level: 'beginner' | 'intermediate' | 'advanced'
          price: number
          is_free: boolean
          prerequisites?: string
          learning_outcomes: string[]
          tags: string[]
          language: string
          duration_minutes: number
          rating: number
          rating_count: number
          enrollment_count: number
          completion_percentage: number
          created_at: string
          updated_at: string
          published_at?: string
        }
        Insert: {
          title: string
          slug: string
          description: string
          short_description?: string
          instructor_id: string
          category_id?: string
          thumbnail_url?: string
          status?: 'draft' | 'published' | 'archived'
          level?: 'beginner' | 'intermediate' | 'advanced'
          price?: number
          is_free?: boolean
          prerequisites?: string
          learning_outcomes?: string[]
          tags?: string[]
          language?: string
          duration_minutes?: number
          published_at?: string
        }
        Update: {
          title?: string
          slug?: string
          description?: string
          short_description?: string
          category_id?: string
          thumbnail_url?: string
          status?: 'draft' | 'published' | 'archived'
          level?: 'beginner' | 'intermediate' | 'advanced'
          price?: number
          is_free?: boolean
          prerequisites?: string
          learning_outcomes?: string[]
          tags?: string[]
          language?: string
          duration_minutes?: number
          rating?: number
          rating_count?: number
          enrollment_count?: number
          completion_percentage?: number
          updated_at?: string
          published_at?: string
        }
      }
      modules: {
        Row: {
          id: string
          course_id: string
          title: string
          description?: string
          order_index: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          course_id: string
          title: string
          description?: string
          order_index?: number
          is_published?: boolean
        }
        Update: {
          title?: string
          description?: string
          order_index?: number
          is_published?: boolean
          updated_at?: string
        }
      }
      chapters: {
        Row: {
          id: string
          module_id: string
          title: string
          description?: string
          content_type: 'video' | 'text' | 'pdf' | 'quiz' | 'assignment'
          content?: string
          file_url?: string
          video_url?: string
          duration_minutes: number
          order_index: number
          is_published: boolean
          is_free_preview: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          module_id: string
          title: string
          description?: string
          content_type?: 'video' | 'text' | 'pdf' | 'quiz' | 'assignment'
          content?: string
          file_url?: string
          video_url?: string
          duration_minutes?: number
          order_index?: number
          is_published?: boolean
          is_free_preview?: boolean
        }
        Update: {
          title?: string
          description?: string
          content_type?: 'video' | 'text' | 'pdf' | 'quiz' | 'assignment'
          content?: string
          file_url?: string
          video_url?: string
          duration_minutes?: number
          order_index?: number
          is_published?: boolean
          is_free_preview?: boolean
          updated_at?: string
        }
      }
      enrollments: {
        Row: {
          id: string
          user_id: string
          course_id: string
          status: 'active' | 'completed' | 'dropped'
          progress: number
          completed_chapters: string[]
          last_accessed_chapter_id?: string
          enrollment_date: string
          completion_date?: string
        }
        Insert: {
          user_id: string
          course_id: string
          status?: 'active' | 'completed' | 'dropped'
          progress?: number
          completed_chapters?: string[]
          last_accessed_chapter_id?: string
        }
        Update: {
          status?: 'active' | 'completed' | 'dropped'
          progress?: number
          completed_chapters?: string[]
          last_accessed_chapter_id?: string
          completion_date?: string
        }
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          plan_type: 'free' | 'basic' | 'premium' | 'enterprise'
          description: string
          price: number
          duration_days: number
          max_courses?: number
          features: string[]
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          plan_type: 'free' | 'basic' | 'premium' | 'enterprise'
          description: string
          price: number
          duration_days?: number
          max_courses?: number
          features?: string[]
          is_active?: boolean
          sort_order?: number
        }
        Update: {
          name?: string
          plan_type?: 'free' | 'basic' | 'premium' | 'enterprise'
          description?: string
          price?: number
          duration_days?: number
          max_courses?: number
          features?: string[]
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Course = Database['public']['Tables']['courses']['Row']
export type Module = Database['public']['Tables']['modules']['Row']
export type Chapter = Database['public']['Tables']['chapters']['Row']
export type Enrollment = Database['public']['Tables']['enrollments']['Row']
export type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row']
export type Category = Database['public']['Tables']['categories']['Row']