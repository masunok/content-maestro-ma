import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 회원가입 시작')
    
    const { email, password, name } = await request.json()
    
    if (!email || !password || !name) {
      return NextResponse.json({
        success: false,
        error: '이메일, 비밀번호, 이름이 모두 필요합니다.'
      }, { status: 400 })
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: '올바른 이메일 형식을 입력해주세요.'
      }, { status: 400 })
    }

    // 비밀번호 유효성 검증
    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        error: '비밀번호는 최소 6자 이상이어야 합니다.'
      }, { status: 400 })
    }

    // 이름 유효성 검증
    if (name.length < 2) {
      return NextResponse.json({
        success: false,
        error: '이름은 최소 2자 이상이어야 합니다.'
      }, { status: 400 })
    }

    console.log('🔍 회원가입 정보 검증:', { email, name })

    // 1. 이메일과 이름 중복 확인
    let duplicateEmail = false
    let duplicateName = false
    
    // 이메일 중복 확인
    const { data: emailCheck, error: emailError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    
    if (emailError) {
      console.error('❌ 이메일 중복 확인 오류:', emailError)
      return NextResponse.json({
        success: false,
        error: '이메일 중복 확인 중 오류가 발생했습니다.',
        code: 'CHECK_ERROR'
      }, { status: 500 })
    }
    
    if (emailCheck) {
      duplicateEmail = true
    }
    
    // 이름 중복 확인
    const { data: nameCheck, error: nameError } = await supabase
      .from('profiles')
      .select('id')
      .eq('name', name)
      .maybeSingle()
    
    if (nameError) {
      console.error('❌ 이름 중복 확인 오류:', nameError)
      return NextResponse.json({
        success: false,
        error: '이름 중복 확인 중 오류가 발생했습니다.',
        code: 'CHECK_ERROR'
      }, { status: 500 })
    }
    
    if (nameCheck) {
      duplicateName = true
    }
    
    // 중복 결과에 따른 오류 메시지
    if (duplicateEmail && duplicateName) {
      console.log('❌ 이미 등록된 이메일과 이름:', { email, name })
      return NextResponse.json({
        success: false,
        error: '이미 등록된 이메일과 이름입니다. 로그인 페이지에서 로그인해주세요.',
        code: 'BOTH_TAKEN'
      }, { status: 409 })
    } else if (duplicateEmail) {
      console.log('❌ 이미 등록된 이메일:', email)
      return NextResponse.json({
        success: false,
        error: '이미 등록된 이메일입니다. 다른 이메일을 사용해주세요.',
        code: 'EMAIL_TAKEN'
      }, { status: 409 })
    }
    // 이름은 중복되어도 진행 (duplicateName이 true여도 계속 진행)

    // 2. 비밀번호 해시화
    const bcrypt = await import('bcryptjs')
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)
    
    console.log('🔐 비밀번호 해시화 완료')

    // 3. Supabase Auth에 사용자 생성
    let authUserId: string
    
    try {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: { name: name }
      })

      if (authError) {
        console.error('❌ Supabase Auth 사용자 생성 오류:', authError)
        return NextResponse.json({
          success: false,
          error: '인증 시스템 오류가 발생했습니다.',
          code: 'AUTH_CREATE_ERROR',
          details: authError.message
        }, { status: 500 })
      }

      authUserId = authUser.user.id
      console.log('✅ Supabase Auth 사용자 생성 성공:', authUserId)

    } catch (authException) {
      console.error('❌ Supabase Auth 처리 중 예외:', authException)
      return NextResponse.json({
        success: false,
        error: '인증 시스템 오류가 발생했습니다.',
        code: 'AUTH_EXCEPTION'
      }, { status: 500 })
    }

    // 4. 트리거로 생성된 프로필 확인 및 대기
    console.log('⏳ 트리거로 프로필 생성 대기 중...')
    
    // 트리거가 프로필을 생성할 때까지 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 생성된 프로필 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUserId)
      .single()

    if (profileError || !profile) {
      console.error('❌ 프로필 생성 확인 실패:', profileError)
      
      // 프로필 생성 실패 시 Supabase Auth 사용자도 삭제
      try {
        await supabase.auth.admin.deleteUser(authUserId)
        console.log('🔄 Supabase Auth 사용자 삭제 완료')
      } catch (deleteError) {
        console.error('❌ Supabase Auth 사용자 삭제 실패:', deleteError)
      }
      
      return NextResponse.json({
        success: false,
        error: '사용자 프로필 생성에 실패했습니다. 트리거 함수를 확인해주세요.',
        code: 'PROFILE_CREATE_ERROR'
      }, { status: 500 })
    }

    console.log('✅ 프로필 생성 확인 성공:', profile)

    // 5. 비밀번호 해시를 profiles 테이블에 저장
    console.log('🔐 비밀번호 해시를 프로필에 저장 중...')
    const { error: passwordUpdateError } = await supabase
      .from('profiles')
      .update({ password_hash: passwordHash })
      .eq('id', authUserId)

    if (passwordUpdateError) {
      console.error('❌ 비밀번호 해시 저장 오류:', passwordUpdateError)
      // 비밀번호 해시 저장 실패 시에도 회원가입은 성공으로 처리 (사용자는 나중에 비밀번호 재설정 가능)
      console.log('⚠️ 비밀번호 해시 저장 실패했지만 회원가입은 계속 진행')
    } else {
      console.log('✅ 비밀번호 해시 저장 성공')
    }

    // 6. 트리거로 생성된 크레딧 트랜잭션 확인
    try {
      const { data: transaction, error: transactionError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', authUserId)
        .eq('type', 'bonus')
        .eq('description', '회원가입 환영 보너스')
        .maybeSingle()

      if (transactionError) {
        console.error('⚠️ 크레딧 트랜잭션 확인 실패:', transactionError)
      } else if (transaction) {
        console.log('✅ 크레딧 트랜잭션 확인 성공:', transaction)
      } else {
        console.log('⚠️ 크레딧 트랜잭션이 아직 생성되지 않음 (트리거 지연 가능성)')
      }
    } catch (transactionException) {
      console.error('⚠️ 크레딧 트랜잭션 확인 중 예외:', transactionException)
    }

    return NextResponse.json({
      success: true,
      message: '회원가입이 성공적으로 완료되었습니다!',
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        credits: profile.credits
      }
    })

  } catch (error) {
    console.error('❌ 회원가입 중 예외 발생:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      code: 'UNKNOWN_ERROR'
    }, { status: 500 })
  }
}
