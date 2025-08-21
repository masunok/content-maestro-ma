import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 인증 상태 확인 시작')
    
    // 현재 세션 확인
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ 인증 상태 확인 오류:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        hasSession: false
      }, { status: 500 })
    }
    
    if (!session) {
      console.log('⚠️ 유효한 인증 세션이 없습니다.')
      return NextResponse.json({
        success: true,
        hasSession: false,
        message: '유효한 인증 세션이 없습니다.'
      })
    }
    
    // 세션 만료 시간 체크
    const now = Math.floor(Date.now() / 1000)
    const isExpired = session.expires_at && session.expires_at < now
    
    console.log('✅ 인증 세션 발견:', {
      userId: session.user.id,
      email: session.user.email,
      isExpired,
      expiresAt: session.expires_at
    })
    
    return NextResponse.json({
      success: true,
      hasSession: true,
      session: {
        userId: session.user.id,
        email: session.user.email,
        isExpired,
        expiresAt: session.expires_at,
        expiresAtFormatted: session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : null
      }
    })
    
  } catch (error) {
    console.error('❌ 인증 상태 확인 중 예외 발생:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      hasSession: false
    }, { status: 500 })
  }
}
