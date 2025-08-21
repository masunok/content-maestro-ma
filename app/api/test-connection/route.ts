import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Supabase 연결 테스트 시작')
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 설정되지 않음')
    
    // 간단한 쿼리 테스트
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Supabase 연결 테스트 실패:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details
      }, { status: 500 })
    }
    
    console.log('✅ Supabase 연결 테스트 성공')
    return NextResponse.json({
      success: true,
      message: 'Supabase 연결이 정상입니다.',
      data: data
    })
    
  } catch (error) {
    console.error('❌ Supabase 연결 테스트 중 예외 발생:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      type: 'exception'
    }, { status: 500 })
  }
}
