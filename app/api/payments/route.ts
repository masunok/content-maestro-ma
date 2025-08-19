import { NextRequest, NextResponse } from 'next/server'
import { tossPaymentsAPI } from '@/lib/toss-payments'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, packageName, credits, userId, userEmail, userName } = body

    if (!amount || !packageName || !credits || !userId || !userEmail || !userName) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 주문 ID 생성 (고유한 값)
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const orderName = `${packageName} 패키지 (${credits} 크레딧)`

    // 토스페이먼츠 결제 요청 생성
    const paymentRequest = {
      amount,
      orderId,
      orderName,
      customerName: userName,
      customerEmail: userEmail,
      successUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/success?orderId=${orderId}`,
      failUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/failed?orderId=${orderId}`,
    }

    const payment = await tossPaymentsAPI.createPayment(paymentRequest)

    // 결제 정보를 데이터베이스에 저장
    const { error: dbError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        type: 'purchase',
        amount: credits,
        description: `${packageName} 패키지 구매`,
        metadata: {
          paymentKey: payment.paymentKey,
          orderId: payment.orderId,
          amount: amount,
          packageName: packageName,
          status: 'pending'
        }
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: '결제 정보 저장에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      paymentKey: payment.paymentKey,
      orderId: payment.orderId,
      amount: payment.totalAmount,
      orderName: payment.orderName
    })

  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: '결제 요청 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
