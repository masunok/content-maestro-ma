import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json(
        { 
          error: 'MISSING_EMAIL',
          message: '이메일이 제공되지 않았습니다.',
          available: false,
          isEmailTaken: true,
          isUserDuplicate: true
        },
        { status: 400 }
      )
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          error: 'INVALID_EMAIL',
          message: '올바른 이메일 형식이 아닙니다.',
          available: false,
          isEmailTaken: true,
          isUserDuplicate: true
        },
        { status: 400 }
      )
    }

    console.log('사용자 중복 확인 요청:', { email, name })

    // Supabase에서 사용자 중복 확인
    let query = supabase
      .from('profiles')
      .select('id, email, name')
      .eq('email', email)
    
    // 이름이 제공된 경우 이름도 체크
    if (name) {
      query = query.or(`name.eq.${name}`)
    }
    
    const { data, error } = await query.limit(10)

    if (error) {
      console.error('사용자 중복 확인 오류:', error)
      return NextResponse.json(
        { 
          error: 'DATABASE_ERROR',
          message: '데이터베이스 조회 중 오류가 발생했습니다.',
          available: false,
          isEmailTaken: true,
          isUserDuplicate: true
        },
        { status: 500 }
      )
    }

    console.log('데이터베이스 조회 결과:', data)

    // 중복 분석
    const exactMatch = data?.find(user => user.email === email && user.name === name)
    const emailMatch = data?.find(user => user.email === email)
    const nameMatch = data?.find(user => user.name === name)

    const isEmailTaken = !!emailMatch
    const isNameTaken = !!nameMatch
    const isUserDuplicate = !!exactMatch
    const available = !isUserDuplicate // 정확히 같은 사용자만 차단

    console.log('중복 분석 결과:', { 
      exactMatch, 
      emailMatch, 
      nameMatch, 
      isEmailTaken, 
      isNameTaken, 
      isUserDuplicate, 
      available 
    })

    // 상세한 메시지 생성
    let message = '사용 가능한 정보입니다.'
    if (isUserDuplicate) {
      message = '이미 등록된 사용자입니다. (이름과 이메일이 모두 일치)'
    } else if (isEmailTaken && isNameTaken) {
      message = '이메일과 이름이 각각 다른 사용자에게 사용되고 있습니다.'
    } else if (isEmailTaken) {
      message = '이미 사용 중인 이메일입니다.'
    } else if (isNameTaken) {
      message = '이미 사용 중인 이름입니다.'
    }

    return NextResponse.json({
      success: true,
      email,
      name,
      available,
      isEmailTaken,
      isNameTaken,
      isUserDuplicate,
      message,
      details: {
        exactMatch: exactMatch ? { id: exactMatch.id, email: exactMatch.email, name: exactMatch.name } : null,
        emailMatch: emailMatch ? { id: emailMatch.id, email: emailMatch.email, name: emailMatch.name } : null,
        nameMatch: nameMatch ? { id: nameMatch.id, email: nameMatch.email, name: nameMatch.name } : null
      }
    })

  } catch (error) {
    console.error('사용자 중복 확인 중 오류:', error)
    
    return NextResponse.json(
      { 
        error: 'INTERNAL_ERROR',
        message: '서버 내부 오류가 발생했습니다.',
        available: false,
        isEmailTaken: true,
        isUserDuplicate: true
      },
      { status: 500 }
    )
  }
}
