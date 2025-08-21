import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, email, name } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('🔧 테스트 프로필 생성 시작:', { userId, email, name })

    // 프로필 생성
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email || 'test@example.com',
        name: name || '테스트 사용자',
        credits: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('❌ 테스트 프로필 생성 오류:', error)
      return NextResponse.json(
        { error: '테스트 프로필 생성에 실패했습니다.', details: error },
        { status: 500 }
      )
    }

    console.log('✅ 테스트 프로필 생성 성공:', data)

    return NextResponse.json({
      success: true,
      message: '테스트 프로필이 성공적으로 생성되었습니다.',
      profile: data
    })

  } catch (error) {
    console.error('❌ 테스트 프로필 생성 중 예외 발생:', error)
    return NextResponse.json(
      { error: '테스트 프로필 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
