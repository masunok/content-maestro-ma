import { NextRequest, NextResponse } from 'next/server'
import { tossPaymentsAPI } from '@/lib/toss-payments'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentKey, orderId } = body

    // 파라미터 검증
    if (!paymentKey || !orderId) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      )
    }

    console.log('Checking payment status for:', { paymentKey, orderId })

    // 토스페이먼츠 API를 통해 결제 상태 조회
    const paymentInfo = await tossPaymentsAPI.getPayment(paymentKey)

    console.log('Payment info retrieved:', paymentInfo)

    return NextResponse.json({
      success: true,
      status: paymentInfo.status,
      paymentKey: paymentInfo.paymentKey,
      orderId: paymentInfo.orderId,
      amount: paymentInfo.totalAmount,
      method: paymentInfo.method,
      requestedAt: paymentInfo.requestedAt,
      approvedAt: paymentInfo.approvedAt
    })

  } catch (error: any) {
    console.error('Payment status check error:', error)
    
    return NextResponse.json(
      { success: false, error: error.message || '결제 상태 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
