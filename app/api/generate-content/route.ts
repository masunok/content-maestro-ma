import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { topic, keywords, tone, contentType } = await request.json()

    if (!topic || !keywords) {
      return NextResponse.json(
        { error: '주제와 키워드는 필수입니다.' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 콘텐츠 유형에 따른 프롬프트 생성
    const contentTypePrompts = {
      'blog-post': '블로그 포스트',
      'article': '아티클',
      'social-media': '소셜미디어 게시물',
      'newsletter': '뉴스레터'
    }

    const tonePrompts = {
      'professional': '전문적이고 신뢰할 수 있는',
      'friendly': '친근하고 이해하기 쉬운',
      'casual': '편안하고 자연스러운',
      'formal': '격식있고 정중한',
      'creative': '창의적이고 독창적인'
    }

    const selectedTone = tonePrompts[tone as keyof typeof tonePrompts] || '친근하고 이해하기 쉬운'
    const selectedContentType = contentTypePrompts[contentType as keyof typeof contentTypePrompts] || '블로그 포스트'

    // OpenAI API 호출
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `당신은 전문적인 콘텐츠 작성자입니다. ${selectedTone} 톤으로 ${selectedContentType}를 작성해주세요. 
          
          다음 요구사항을 반드시 준수해주세요:
          1. 제목은 H1 태그(#)로 시작
          2. 소제목은 H2 태그(##)로 시작
          3. 하위 소제목은 H3 태그(###)로 시작
          4. 마크다운 형식으로 작성
          5. 한국어로 작성
          6. 실제적이고 유용한 정보 제공
          7. SEO 최적화를 위한 키워드 자연스럽게 포함
          8. 읽기 쉽고 구조화된 콘텐츠
          9. 결론 부분 포함
          10. 마지막에 "이 콘텐츠는 AI에 의해 생성되었습니다. 사실 확인 후 사용하시기 바랍니다." 문구 추가`
        },
        {
          role: "user",
          content: `주제: ${topic}
          키워드: ${keywords}
          톤앤매너: ${selectedTone}
          콘텐츠 유형: ${selectedContentType}
          
          위 정보를 바탕으로 고품질의 콘텐츠를 작성해주세요.`
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    })

    const generatedContent = completion.choices[0]?.message?.content || ''

    // SEO 최적화 팁 생성
    const seoCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `당신은 SEO 전문가입니다. 주어진 콘텐츠에 대한 구체적이고 실용적인 SEO 최적화 팁을 제공해주세요. 
          
          팁은 다음 형식으로 작성해주세요:
          - 제목에 주요 키워드 포함하기
          - 메타 디스크립션 최적화
          - 헤딩 태그 활용
          - 이미지 최적화
          - 내부 링크 전략
          - 키워드 밀도 관리
          - 소셜미디어 최적화
          - 모바일 최적화
          
          각 팁은 구체적이고 실행 가능해야 합니다.`
        },
        {
          role: "user",
          content: `다음 콘텐츠에 대한 SEO 최적화 팁을 제공해주세요:
          
          ${generatedContent}
          
          키워드: ${keywords}`
        }
      ],
      max_tokens: 1000,
      temperature: 0.5,
    })

    const seoTips = seoCompletion.choices[0]?.message?.content || ''
    
    // SEO 팁을 배열로 변환
    const seoTipsArray = seoTips
      .split('\n')
      .filter(tip => tip.trim() && tip.includes('-'))
      .map(tip => tip.replace('-', '').trim())
      .slice(0, 8) // 최대 8개 팁으로 제한

    return NextResponse.json({
      content: generatedContent,
      seoTips: seoTipsArray,
      success: true
    })

  } catch (error) {
    console.error('콘텐츠 생성 오류:', error)
    return NextResponse.json(
      { error: '콘텐츠 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
