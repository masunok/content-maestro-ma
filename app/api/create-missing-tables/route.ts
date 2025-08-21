import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 누락된 테이블 생성 시작')
    
    const { tableName } = await request.json()
    
    if (!tableName) {
      return NextResponse.json({
        error: '테이블 이름이 필요합니다.'
      }, { status: 400 })
    }

    let createResult: any = null
    let error: any = null

    switch (tableName) {
      case 'content_history':
        // content_history 테이블 생성
        const { data: contentHistoryResult, error: contentHistoryError } = await supabase
          .rpc('exec_sql', {
            sql: `
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
              DROP POLICY IF EXISTS "사용자는 자신의 콘텐츠만 조회/수정 가능" ON public.content_history;
              CREATE POLICY "사용자는 자신의 콘텐츠만 조회/수정 가능" ON public.content_history
                FOR ALL USING (auth.uid() = user_id);
            `
          })
        
        createResult = contentHistoryResult
        error = contentHistoryError
        break

      case 'credit_transactions':
        // credit_transactions 테이블 생성
        const { data: creditTransactionsResult, error: creditTransactionsError } = await supabase
          .rpc('exec_sql', {
            sql: `
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
              CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
              CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at);
              
              -- RLS 활성화
              ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
              
              -- RLS 정책 생성
              DROP POLICY IF EXISTS "사용자는 자신의 트랜잭션만 조회 가능" ON public.credit_transactions;
              CREATE POLICY "사용자는 자신의 트랜잭션만 조회 가능" ON public.credit_transactions
                FOR SELECT USING (auth.uid() = user_id);
              
              DROP POLICY IF EXISTS "사용자는 자신의 트랜잭션만 생성 가능" ON public.credit_transactions;
              CREATE POLICY "사용자는 자신의 트랜잭션만 생성 가능" ON public.credit_transactions
                FOR INSERT WITH CHECK (auth.uid() = user_id);
            `
          })
        
        createResult = creditTransactionsResult
        error = creditTransactionsError
        break

      default:
        return NextResponse.json({
          error: `지원하지 않는 테이블: ${tableName}`
        }, { status: 400 })
    }

    if (error) {
      console.error(`❌ ${tableName} 테이블 생성 오류:`, error)
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code
      }, { status: 500 })
    }

    console.log(`✅ ${tableName} 테이블 생성 성공`)
    
    return NextResponse.json({
      success: true,
      message: `${tableName} 테이블이 성공적으로 생성되었습니다.`,
      result: createResult
    })

  } catch (error) {
    console.error('❌ 테이블 생성 중 예외 발생:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      type: 'exception'
    }, { status: 500 })
  }
}
