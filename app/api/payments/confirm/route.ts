import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // 클라이언트에서 받은 JSON 요청 바디입니다.
    const { paymentKey, orderId, amount } = await request.json()

    // 필수 파라미터 검증
    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { 
          code: 'MISSING_PARAMETERS',
          message: '필수 파라미터가 누락되었습니다.' 
        },
        { status: 400 }
      )
    }

    console.log('Payment confirmation request:', { paymentKey, orderId, amount })

    // 토스페이먼츠 API는 시크릿 키를 사용자 ID로 사용하고, 비밀번호는 사용하지 않습니다.
    // 비밀번호가 없다는 것을 알리기 위해 시크릿 키 뒤에 콜론을 추가합니다.
    const widgetSecretKey = process.env.TOSS_PAYMENTS_SECRET_KEY || 'test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6'
    const encryptedSecretKey = 'Basic ' + Buffer.from(widgetSecretKey + ':').toString('base64')

    console.log('Using secret key:', widgetSecretKey.includes('test_') ? 'TEST_KEY' : 'PRODUCTION_KEY')

    // 결제를 승인하면 결제수단에서 금액이 차감돼요.
    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: encryptedSecretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: orderId,
        amount: amount,
        paymentKey: paymentKey,
      }),
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('TossPayments API error:', responseData)
      return NextResponse.json(
        responseData,
        { status: response.status }
      )
    }

    // 결제 성공 비즈니스 로직을 구현하세요.
    console.log('Payment confirmed successfully:', responseData)
    
    // 1. 주문 ID에서 패키지 정보 추출
    const packageInfo = extractPackageFromOrderId(orderId, amount)
    if (!packageInfo) {
      console.error('Failed to extract package info from orderId:', orderId)
      return NextResponse.json(
        { 
          code: 'INVALID_ORDER_ID',
          message: '주문 ID에서 패키지 정보를 추출할 수 없습니다.' 
        },
        { status: 400 }
      )
    }

    // 2. 실제 사용자 정보 가져오기 (임시로 하드코딩, 실제로는 JWT 토큰에서 추출)
    // TODO: 실제 프로덕션에서는 JWT 토큰을 확인하여 사용자 ID를 가져와야 함
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email, credits')
      .eq('email', 'masunok0830@gmail.com') // 임시로 하드코딩, 실제로는 인증된 사용자 정보 사용
      .single()

    if (userError || !user) {
      console.error('User not found:', userError)
      return NextResponse.json(
        { 
          code: 'USER_NOT_FOUND',
          message: '사용자를 찾을 수 없습니다.' 
        },
        { status: 404 }
      )
    }

    // 3. 크레딧 추가
    const newCredits = (user.credits || 0) + packageInfo.credits
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to update user credits:', updateError)
      return NextResponse.json(
        { 
          code: 'CREDIT_UPDATE_FAILED',
          message: '크레딧 업데이트에 실패했습니다.' 
        },
        { status: 500 }
      )
    }

    // 4. 결제 내역 저장
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        type: 'purchase',
        amount: packageInfo.credits,
        description: `${packageInfo.name} 패키지 구매`,
        metadata: {
          orderId,
          paymentKey,
          packageName: packageInfo.name,
          packageCredits: packageInfo.credits,
          paymentAmount: amount,
          confirmedAt: new Date().toISOString(),
          paymentDetails: responseData
        }
      })

    if (transactionError) {
      console.error('Failed to save transaction:', transactionError)
      // 크레딧은 이미 추가되었으므로 로그만 남김
    }

    console.log(`Successfully added ${packageInfo.credits} credits to user ${user.id}`)
    console.log(`User credits updated from ${user.credits} to ${newCredits}`)

    return NextResponse.json({
      ...responseData,
      creditsAdded: packageInfo.credits,
      newTotalCredits: newCredits,
      packageName: packageInfo.name
    })

  } catch (error) {
    console.error('Payment confirmation error:', error)
    
    return NextResponse.json(
      { 
        code: 'INTERNAL_ERROR',
        message: '결제 승인 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    )
  }
}

// 주문 ID에서 패키지 정보를 추출하는 함수
function extractPackageFromOrderId(orderId: string, amount: number) {
  // 패키지별 정보
  const packages = {
    9900: { name: '베이직', credits: 50 },
    24900: { name: '프로', credits: 150 },
    79900: { name: '엔터프라이즈', credits: 500 }
  }

  const packageInfo = packages[amount as keyof typeof packages]
  if (!packageInfo) {
    console.error('Unknown package amount:', amount)
    return null
  }

  return packageInfo
}
