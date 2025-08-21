import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contentId = params.id

    if (!contentId) {
      return NextResponse.json(
        { error: '콘텐츠 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 콘텐츠 삭제
    const { error } = await supabase
      .from('content_history')
      .delete()
      .eq('id', contentId)

    if (error) {
      console.error('콘텐츠 삭제 오류:', error)
      return NextResponse.json(
        { error: '콘텐츠 삭제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '콘텐츠가 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('콘텐츠 삭제 중 오류:', error)
    return NextResponse.json(
      { error: '콘텐츠 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
