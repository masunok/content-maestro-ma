"use client"

import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, ArrowLeft } from 'lucide-react'

export default function PaymentFailedPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const orderId = searchParams.get('orderId')
  const amount = searchParams.get('amount')
  const code = searchParams.get('code')
  const message = searchParams.get('message')

  const handleGoBack = () => {
    router.back()
  }

  const handleGoToDashboard = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
          <CardTitle className="text-xl text-red-600">결제 실패</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            {orderId && (
              <div className="flex justify-between">
                <span className="text-gray-600">주문번호:</span>
                <span className="font-mono">{orderId}</span>
              </div>
            )}
            
            {amount && (
              <div className="flex justify-between">
                <span className="text-gray-600">결제 금액:</span>
                <span className="font-semibold">{parseInt(amount).toLocaleString()}원</span>
              </div>
            )}
            
            {code && (
              <div className="flex justify-between">
                <span className="text-gray-600">에러 코드:</span>
                <span className="font-mono text-red-600">{code}</span>
              </div>
            )}
            
            {message && (
              <div className="flex justify-between">
                <span className="text-gray-600">실패 사유:</span>
                <span className="text-red-600 max-w-[200px] text-right">{message}</span>
              </div>
            )}
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">
              결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={handleGoBack} variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              이전 페이지로 돌아가기
            </Button>
            
            <Button onClick={handleGoToDashboard} className="w-full">
              대시보드로 이동
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>문제가 지속되면 고객센터로 문의해주세요.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
