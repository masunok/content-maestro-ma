import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 환경 변수가 설정되지 않은 경우 fallback
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
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
