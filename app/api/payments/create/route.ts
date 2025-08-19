import { NextRequest, NextResponse } from 'next/server'
import { tossPaymentsAPI } from '@/lib/toss-payments'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      orderId,
      orderName,
      customerName,
      customerEmail,
      amount,
      successUrl,
      failUrl
    } = body

    // 파라미터 검증
    if (!orderId || !orderName || !customerName || !customerEmail || !amount || !successUrl || !failUrl) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 금액 검증
    if (amount <= 0 || !Number.isInteger(amount)) {
      return NextResponse.json(
        { success: false, error: '잘못된 결제 금액입니다.' },
        { status: 400 }
      )
    }

    // 테스트 환경에서는 URL 형식 조정
    let adjustedSuccessUrl = successUrl
    let adjustedFailUrl = failUrl
    
    if (process.env.NODE_ENV === 'development') {
      // localhost에서 테스트할 때는 상대 경로 사용
      adjustedSuccessUrl = successUrl.replace('http://localhost:3000', '')
      adjustedFailUrl = failUrl.replace('http://localhost:3000', '')
    }

    console.log('Creating payment with params:', {
      orderId,
      orderName,
      customerName,
      customerEmail,
      amount,
      successUrl: adjustedSuccessUrl,
      failUrl: adjustedFailUrl
    })

    // 기존 TossPaymentsAPI 클래스 사용
    const result = await tossPaymentsAPI.createPayment({
      orderId,
      orderName,
      customerName,
      customerEmail,
      amount,
      successUrl: adjustedSuccessUrl,
      failUrl: adjustedFailUrl
    })

    console.log('Payment created successfully:', result)

    // 토스페이먼츠 공식 결제창 URL 생성
    // pay.toss.im이 아닌 pay.tosspayments.com 사용
    const paymentUrl = `https://pay.tosspayments.com/?paymentKey=${result.paymentKey}`

    return NextResponse.json({
      success: true,
      paymentUrl,
      paymentKey: result.paymentKey,
      orderId: result.orderId
    })

  } catch (error: any) {
    console.error('Payment creation error:', error)
    
    // 토스페이먼츠 API 에러 처리
    if (error.message && error.message.includes('결제 요청 생성에 실패했습니다')) {
      return NextResponse.json(
        { success: false, error: '토스페이먼츠 API 호출에 실패했습니다. 환경 변수를 확인해주세요.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || '결제 요청 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
