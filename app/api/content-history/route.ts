import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 사용자의 콘텐츠 히스토리 조회
    const { data, error } = await supabase
      .from('content_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('콘텐츠 히스토리 조회 오류:', error)
      return NextResponse.json(
        { error: '콘텐츠 히스토리 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      contentHistory: data || []
    })

  } catch (error) {
    console.error('콘텐츠 히스토리 조회 중 오류:', error)
    return NextResponse.json(
      { error: '콘텐츠 히스토리 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
