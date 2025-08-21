import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()
    
    if (!email || !name) {
      return NextResponse.json({
        error: '이메일과 이름이 모두 필요합니다.'
      }, { status: 400 })
    }

    console.log('🔍 중복 확인 시작:', { email, name })

    let duplicateEmail = false
    let duplicateName = false
    
    console.log('📧 이메일 중복 확인 시작:', email)
    
    // 이메일 중복 확인
    const { data: emailCheck, error: emailError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    
    if (emailError) {
      console.error('❌ 이메일 중복 확인 오류:', emailError)
      return NextResponse.json({
        error: '이메일 중복 확인 중 오류가 발생했습니다.',
        message: emailError.message
      }, { status: 500 })
    }
    
    if (emailCheck) {
      duplicateEmail = true
      console.log('❌ 이메일 중복 발견:', email)
    } else {
      console.log('✅ 이메일 사용 가능:', email)
    }
    
    console.log('👤 이름 중복 확인 시작:', name)
    
    // 이름 중복 확인
    const { data: nameCheck, error: nameError } = await supabase
      .from('profiles')
      .select('id')
      .eq('name', name)
      .maybeSingle()
    
    if (nameError) {
      console.error('❌ 이름 중복 확인 오류:', nameError)
      return NextResponse.json({
        error: '이름 중복 확인 중 오류가 발생했습니다.',
        message: nameError.message
      }, { status: 500 })
    }
    
    if (nameCheck) {
      duplicateName = true
      console.log('❌ 이름 중복 발견:', name)
    } else {
      console.log('✅ 이름 사용 가능:', name)
    }
    
    // 중복 결과에 따른 응답
    // 이름은 중복되어도 상관없고, 이메일만 중복되지 않으면 사용 가능
    const available = !duplicateEmail
    console.log('🎯 최종 결과:', { available, duplicateEmail, duplicateName })
    const details = {
      emailTaken: duplicateEmail,
      nameTaken: duplicateName,
      bothTaken: duplicateEmail && duplicateName
    }
    
    console.log('✅ 중복 확인 완료:', { available, details })
    
    return NextResponse.json({
      available,
      details,
      message: available 
        ? '사용 가능한 이메일입니다.' 
        : '이미 사용 중인 이메일입니다.'
    })

  } catch (error) {
    console.error('❌ 중복 확인 중 예외 발생:', error)
    return NextResponse.json({
      error: '중복 확인 중 오류가 발생했습니다.',
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
}
