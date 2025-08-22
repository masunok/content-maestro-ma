import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 환경 변수 체크 및 경고
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!')
  console.error('📁 .env.local 파일을 생성하고 다음 내용을 추가해주세요:')
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key')
  console.error('🔗 ENV_SETUP.md 파일을 참고하세요.')
}

// 개발 환경에서만 더 자세한 정보 제공
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Supabase 설정 정보:')
  console.log('URL:', supabaseUrl ? '✅ 설정됨' : '❌ 설정되지 않음')
  console.log('Anon Key:', supabaseAnonKey ? '✅ 설정됨' : '❌ 설정되지 않음')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }
  }
)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          credits: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          credits?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          credits?: number
          created_at?: string
          updated_at?: string
        }
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          type: 'purchase' | 'usage' | 'bonus'
          amount: number
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'purchase' | 'usage' | 'bonus'
          amount: number
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'purchase' | 'usage' | 'bonus'
          amount?: number
          description?: string
          created_at?: string
        }
      }
    }
  }
}
