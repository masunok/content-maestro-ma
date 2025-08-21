import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 데이터베이스 설정 시작')
    
    const { action } = await request.json()
    
    if (action === 'create_content_history') {
      // content_history 테이블 생성 시도
      try {
        const { error } = await supabase
          .from('content_history')
          .select('id')
          .limit(1)
        
        if (error && error.code === 'PGRST205') {
          // 테이블이 존재하지 않음 - 생성 필요
          console.log('⚠️ content_history 테이블이 존재하지 않습니다.')
          return NextResponse.json({
            success: false,
            error: 'content_history 테이블이 존재하지 않습니다. Supabase 대시보드에서 SQL을 실행해야 합니다.',
            code: 'TABLE_MISSING',
            solution: `
              Supabase 대시보드 → SQL Editor에서 다음 SQL을 실행하세요:
              
              CREATE TABLE IF NOT EXISTS public.content_history (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id UUID NOT NULL,
                title TEXT NOT NULL,
                content_type TEXT NOT NULL,
                content TEXT,
                keywords TEXT[],
                tone TEXT,
                credits_used INTEGER NOT NULL DEFAULT 1,
                status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'draft', 'archived')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
              );
              
              -- 인덱스 생성
              CREATE INDEX IF NOT EXISTS idx_content_history_user_id ON public.content_history(user_id);
              CREATE INDEX IF NOT EXISTS idx_content_history_created_at ON public.content_history(created_at);
              
              -- RLS 활성화
              ALTER TABLE public.content_history ENABLE ROW LEVEL SECURITY;
              
              -- RLS 정책 생성
              CREATE POLICY "사용자는 자신의 콘텐츠만 조회/수정 가능" ON public.content_history
                FOR ALL USING (auth.uid() = user_id);
            `
          })
        } else if (error) {
          // 다른 오류
          return NextResponse.json({
            success: false,
            error: error.message,
            code: error.code
          })
        } else {
          // 테이블이 존재함
          return NextResponse.json({
            success: true,
            message: 'content_history 테이블이 이미 존재합니다.'
          })
        }
      } catch (error) {
        console.error('❌ 테이블 확인 중 오류:', error)
        return NextResponse.json({
          success: false,
          error: '테이블 확인 중 오류가 발생했습니다.',
          details: error
        }, { status: 500 })
      }
    } else if (action === 'create_all_tables') {
      // 모든 필수 테이블 생성 시도
      try {
        const tables = ['content_history', 'credit_transactions']
        const missingTables = []
        
        for (const tableName of tables) {
          const { error } = await supabase
            .from(tableName)
            .select('id')
            .limit(1)
          
          if (error && error.code === 'PGRST205') {
            missingTables.push(tableName)
          }
        }
        
        if (missingTables.length > 0) {
          console.log('⚠️ 누락된 테이블들:', missingTables)
          return NextResponse.json({
            success: false,
            error: '일부 테이블이 존재하지 않습니다. Supabase 대시보드에서 SQL을 실행해야 합니다.',
            code: 'TABLES_MISSING',
            solution: `
              Supabase 대시보드 → SQL Editor에서 다음 SQL을 실행하세요:
              
              -- content_history 테이블 생성
              CREATE TABLE IF NOT EXISTS public.content_history (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id UUID NOT NULL,
                title TEXT NOT NULL,
                content_type TEXT NOT NULL,
                content TEXT,
                keywords TEXT[],
                tone TEXT,
                credits_used INTEGER NOT NULL DEFAULT 1,
                status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'draft', 'archived')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
              );
              
              -- credit_transactions 테이블 생성
              CREATE TABLE IF NOT EXISTS public.credit_transactions (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id UUID NOT NULL,
                type TEXT CHECK (type IN ('purchase', 'usage', 'bonus', 'refund')) NOT NULL,
                amount INTEGER NOT NULL,
                description TEXT NOT NULL,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
              );
              
              -- 인덱스 생성
              CREATE INDEX IF NOT EXISTS idx_content_history_user_id ON public.content_history(user_id);
              CREATE INDEX IF NOT EXISTS idx_content_history_created_at ON public.content_history(created_at);
              CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
              CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at);
              
              -- RLS 활성화
              ALTER TABLE public.content_history ENABLE ROW LEVEL SECURITY;
              ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
              
              -- RLS 정책 생성
              CREATE POLICY "사용자는 자신의 콘텐츠만 조회/수정 가능" ON public.content_history
                FOR ALL USING (auth.uid() = user_id);
              
              CREATE POLICY "사용자는 자신의 트랜잭션만 조회 가능" ON public.credit_transactions
                FOR SELECT USING (auth.uid() = user_id);
              
              CREATE POLICY "사용자는 자신의 트랜잭션만 생성 가능" ON public.credit_transactions
                FOR INSERT WITH CHECK (auth.uid() = user_id);
              
              -- profiles 테이블에 필요한 컬럼 추가
              ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
              ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 10;
            `
          })
        } else {
          // 모든 테이블이 존재함
          return NextResponse.json({
            success: true,
            message: '모든 필수 테이블이 이미 존재합니다.'
          })
        }
      } catch (error) {
        console.error('❌ 테이블 확인 중 오류:', error)
        return NextResponse.json({
          success: false,
          error: '테이블 확인 중 오류가 발생했습니다.',
          details: error
        }, { status: 500 })
      }
    }
    
    return NextResponse.json({
      success: false,
      error: '지원하지 않는 작업입니다.'
    }, { status: 400 })

  } catch (error) {
    console.error('❌ 데이터베이스 설정 중 예외 발생:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      type: 'exception'
    }, { status: 500 })
  }
}
