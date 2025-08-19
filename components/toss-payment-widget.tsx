"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk"

interface TossPaymentWidgetProps {
  clientKey: string
  orderId: string
  orderName: string
  amount: number
  customerName: string
  customerEmail: string
  disabled?: boolean
}

export function TossPaymentWidget({
  clientKey,
  orderId,
  orderName,
  amount,
  customerName,
  customerEmail,
  disabled = false
}: TossPaymentWidgetProps) {
  const [ready, setReady] = useState(false)
  const [widgets, setWidgets] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function fetchPaymentWidgets() {
      try {
        // ------ 결제위젯 초기화 ------
        const tossPayments = await loadTossPayments(clientKey)
        
        // 비회원 결제 (ANONYMOUS 사용)
        const widgets = tossPayments.widgets({
          customerKey: ANONYMOUS,
        })

        setWidgets(widgets)
        console.log('TossPayments v2 widgets initialized successfully')
      } catch (error) {
        console.error('Failed to initialize TossPayments v2:', error)
        // onFail('INIT_ERROR', '토스페이먼츠 v2 초기화에 실패했습니다.', orderId)
      }
    }

    fetchPaymentWidgets()
  }, [clientKey, orderId])

  useEffect(() => {
    async function renderPaymentWidgets() {
      if (widgets == null) {
        return
      }

      try {
        // ------ 주문의 결제 금액 설정 ------
        await widgets.setAmount({
          currency: "KRW",
          value: amount,
        })

        await Promise.all([
          // ------ 결제 UI 렌더링 ------
          widgets.renderPaymentMethods({
            selector: "#payment-method",
            variantKey: "DEFAULT",
          }),
          // ------ 이용약관 UI 렌더링 ------
          widgets.renderAgreement({
            selector: "#agreement",
            variantKey: "AGREEMENT",
          }),
        ])

        setReady(true)
        console.log('Payment widgets rendered successfully')
      } catch (error) {
        console.error('Failed to render payment widgets:', error)
        // onFail('RENDER_ERROR', '결제 위젯 렌더링에 실패했습니다.', orderId)
      }
    }

    renderPaymentWidgets()
  }, [widgets, amount])

  useEffect(() => {
    if (widgets == null) {
      return
    }

    // 금액이 변경될 때마다 위젯 업데이트
    widgets.setAmount({
      currency: "KRW",
      value: amount,
    })
  }, [widgets, amount])

  const handlePayment = async () => {
    if (!widgets || !ready || disabled) {
      console.error('Payment widgets not ready or disabled')
      // onFail('WIDGET_NOT_READY', '결제 위젯이 준비되지 않았습니다.', orderId)
      return
    }

    setIsLoading(true)

    try {
      // 결제 요청 파라미터 검증
      if (!amount || amount <= 0 || isNaN(amount) || !Number.isInteger(amount)) {
        console.error('Invalid amount:', amount)
        // onFail('INVALID_AMOUNT', '잘못된 결제 금액입니다. 정수 값이어야 합니다.', orderId)
        setIsLoading(false)
        return
      }

      if (!orderId || !orderName || orderName.trim().length === 0) {
        console.error('Missing required parameters:', { orderId, orderName })
        // onFail('MISSING_PARAMS', '필수 파라미터가 누락되었습니다.', orderId)
        setIsLoading(false)
        return
      }

      // 토스페이먼츠 요구사항: 주문 ID는 영문, 숫자, 하이픈(-), 언더스코어(_)만 허용
      const orderIdRegex = /^[a-zA-Z0-9_-]+$/
      if (!orderIdRegex.test(orderId)) {
        console.error('Invalid orderId format:', orderId)
        // onFail('INVALID_ORDER_ID', '주문 ID 형식이 올바르지 않습니다.', orderId)
        setIsLoading(false)
        return
      }

      // 토스페이먼츠 요구사항: 주문명은 1-100자
      if (orderName.length < 1 || orderName.length > 100) {
        console.error('Invalid orderName length:', orderName.length)
        // onFail('INVALID_ORDER_NAME', '주문명은 1-100자 사이여야 합니다.', orderId)
        setIsLoading(false)
        return
      }

      // 토스페이먼츠 요구사항: 고객명은 1-100자
      if (!customerName || customerName.trim().length === 0 || customerName.length > 100) {
        console.error('Invalid customerName:', customerName)
        // onFail('INVALID_CUSTOMER_NAME', '고객명이 올바르지 않습니다.', orderId)
        setIsLoading(false)
        return
      }

      // 토스페이먼츠 요구사항: 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!customerEmail || !emailRegex.test(customerEmail)) {
        console.error('Invalid customerEmail:', customerEmail)
        // onFail('INVALID_CUSTOMER_EMAIL', '이메일 형식이 올바르지 않습니다.', orderId)
        setIsLoading(false)
        return
      }

      // 추가 디버깅 정보
      console.log('Environment check:', {
        NODE_ENV: process.env.NODE_ENV,
        clientKey: clientKey,
        isTestKey: clientKey.includes('test_'),
        currentOrigin: window.location.origin,
        currentHref: window.location.href
      })

      // 토스페이먼츠 v2 결제 요청
      const paymentParams = {
        orderId,
        orderName,
        customerEmail: customerEmail || 'test@example.com',
        customerName: customerName || '테스트고객',
        successUrl: `${window.location.origin}/payment/success?orderId=${orderId}&amount=${amount}`,
        failUrl: `${window.location.origin}/payment/failed?orderId=${orderId}&amount=${amount}`,
      }

      // 토스페이먼츠 v2는 절대 URL을 요구하므로 항상 전체 URL 사용
      // 테스트 환경에서도 localhost:3000 전체 URL 사용
      console.log('Payment request params:', paymentParams)
      console.log('TossPayments v2 widgets:', widgets)

      // ------ '결제하기' 버튼 누르면 결제창 띄우기 ------
      const result = await widgets.requestPayment(paymentParams)
      console.log('Payment request successful:', result)

      // 결제 성공 시 콜백 호출
      if (result.paymentKey) {
        // onSuccess(result.paymentKey, orderId, amount)
        console.log('Payment initiated successfully, redirecting to payment window...')
      }
    } catch (error: any) {
      console.error('Payment request error details:', error)

      let errorCode = 'PAYMENT_REQUEST_ERROR'
      let errorMessage = '결제 요청에 실패했습니다.'

      // 토스페이먼츠 에러 코드 추출
      if (error.code) {
        errorCode = error.code
      }

      if (error.message) {
        errorMessage = error.message
      } else if (error.errorMessage) {
        errorMessage = error.errorMessage
      }

      // 사용자에게 오류 메시지 표시
      console.error(`Payment failed: ${errorCode} - ${errorMessage}`)
      
      // 오류 발생 시 버튼 상태만 리셋
      // onFail(errorCode, errorMessage, orderId)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 결제 UI */}
      <div id="payment-method" />
      
      {/* 이용약관 UI */}
      <div id="agreement" />
      
      {/* 결제하기 버튼 */}
      <Button
        onClick={handlePayment}
        disabled={disabled || isLoading || !ready}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            결제 처리 중...
          </>
        ) : !ready ? (
          '위젯 초기화 중...'
        ) : (
          `${amount.toLocaleString()}원 결제하기`
        )}
      </Button>
    </div>
  )
}
