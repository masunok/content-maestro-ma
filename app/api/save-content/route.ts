import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { title, content, contentType, keywords, tone, userId } = await request.json()

    if (!title || !content || !userId) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 콘텐츠 히스토리에 저장
    const { data, error } = await supabase
      .from('content_history')
      .insert({
        user_id: userId,
        title: title,
        content_type: contentType || 'blog-post',
        content: content,
        keywords: keywords ? keywords.split(',').map(k => k.trim()) : [],
        tone: tone || 'friendly',
        credits_used: 1,
        status: 'completed'
      })
      .select()
      .single()

    if (error) {
      console.error('콘텐츠 저장 오류:', error)
      return NextResponse.json(
        { error: '콘텐츠 저장에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      contentId: data.id,
      message: '콘텐츠가 성공적으로 저장되었습니다.'
    })

  } catch (error) {
    console.error('콘텐츠 저장 중 오류:', error)
    return NextResponse.json(
      { error: '콘텐츠 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
