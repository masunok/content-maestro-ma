import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 로그인 인증 시작')
    
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: '이메일과 비밀번호가 필요합니다.'
      }, { status: 400 })
    }

    console.log('🔍 사용자 인증 시도:', email)

    // 1. profiles 테이블에서 사용자 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, password_hash, name, credits')
      .eq('email', email)
      .single()

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        // 사용자를 찾을 수 없음
        console.log('❌ 등록되지 않은 이메일:', email)
        return NextResponse.json({
          success: false,
          error: '등록되지 않은 이메일입니다. 회원가입을 먼저 진행해주세요.',
          code: 'USER_NOT_FOUND'
        }, { status: 401 })
      }
      
      console.error('❌ 프로필 조회 오류:', profileError)
      return NextResponse.json({
        success: false,
        error: '사용자 정보 조회 중 오류가 발생했습니다.',
        code: 'PROFILE_ERROR'
      }, { status: 500 })
    }

    if (!profile) {
      console.log('❌ 프로필이 존재하지 않음:', email)
      return NextResponse.json({
        success: false,
        error: '등록되지 않은 이메일입니다. 회원가입을 먼저 진행해주세요.',
        code: 'USER_NOT_FOUND'
      }, { status: 401 })
    }

    // 2. 비밀번호 해시 확인
    if (!profile.password_hash) {
      console.log('❌ 비밀번호 해시가 없음:', email)
      return NextResponse.json({
        success: false,
        error: '비밀번호가 설정되지 않았습니다. 소셜 로그인을 사용해주세요.',
        code: 'NO_PASSWORD_SET'
      }, { status: 401 })
    }

    const bcrypt = await import('bcryptjs')
    const isPasswordValid = await bcrypt.compare(password, profile.password_hash)
    
    if (!isPasswordValid) {
      console.log('❌ 비밀번호 불일치:', email)
      return NextResponse.json({
        success: false,
        error: '이메일 또는 비밀번호가 올바르지 않습니다.',
        code: 'INVALID_PASSWORD'
      }, { status: 401 })
    }

    console.log('✅ 사용자 인증 성공:', email)

    // 3. Supabase Auth를 통한 로그인 (JWT 토큰 생성)
    try {
      // 기존 Supabase Auth 로그인 시도
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      })

      if (authError) {
        // Supabase Auth에 사용자가 없는 경우, 새로 생성
        console.log('⚠️ Supabase Auth에 사용자가 없음, 새로 생성:', email)
        
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true
        })

        if (createError) {
          console.error('❌ Supabase Auth 사용자 생성 오류:', createError)
          return NextResponse.json({
            success: false,
            error: '인증 시스템 오류가 발생했습니다.',
            code: 'AUTH_CREATE_ERROR'
          }, { status: 500 })
        }

        // 새로 생성된 사용자로 로그인
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        })

        if (signInError) {
          console.error('❌ 새 사용자 로그인 오류:', signInError)
          return NextResponse.json({
            success: false,
            error: '로그인 중 오류가 발생했습니다.',
            code: 'SIGNIN_ERROR'
          }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: '로그인에 성공했습니다.',
          user: {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            credits: profile.credits
          },
          session: signInData.session
        })
      }

      // 기존 사용자 로그인 성공
      return NextResponse.json({
        success: true,
        message: '로그인에 성공했습니다.',
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          credits: profile.credits
        },
        session: authData.session
      })

    } catch (authException) {
      console.error('❌ Supabase Auth 처리 중 오류:', authException)
      return NextResponse.json({
        success: false,
        error: '인증 시스템 오류가 발생했습니다.',
        code: 'AUTH_ERROR'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ 로그인 인증 중 예외 발생:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      code: 'UNKNOWN_ERROR'
    }, { status: 500 })
  }
}
