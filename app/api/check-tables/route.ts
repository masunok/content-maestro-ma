import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 데이터베이스 테이블 확인 시작')
    
    // 모든 테이블 목록 조회
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public')
      .order('table_name')

    if (tablesError) {
      console.error('❌ 테이블 목록 조회 오류:', tablesError)
      return NextResponse.json({
        success: false,
        error: tablesError.message,
        code: tablesError.code
      }, { status: 500 })
    }

    console.log('✅ 테이블 목록 조회 성공:', tables)

    // 주요 테이블들의 존재 여부 확인
    const requiredTables = ['profiles', 'credit_transactions', 'content_history']
    const tableStatus = requiredTables.map(tableName => {
      const exists = tables?.some(t => t.table_name === tableName) || false
      return { tableName, exists }
    })

    return NextResponse.json({
      success: true,
      allTables: tables || [],
      requiredTables: tableStatus,
      message: '데이터베이스 테이블 확인 완료'
    })

  } catch (error) {
    console.error('❌ 테이블 확인 중 예외 발생:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      type: 'exception'
    }, { status: 500 })
  }
}
