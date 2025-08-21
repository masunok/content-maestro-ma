"use client"

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2, Zap, RefreshCw } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const creditPackages = {
  basic: { name: "베이직", credits: 50, price: 9900 },
  pro: { name: "프로", credits: 150, price: 24900 },
  enterprise: { name: "엔터프라이즈", credits: 500, price: 79900 },
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const [isConfirming, setIsConfirming] = useState(false)
  const [confirmResult, setConfirmResult] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const orderId = searchParams.get('orderId')
  const amount = searchParams.get('amount')
  const paymentKey = searchParams.get('paymentKey')
  const packageId = searchParams.get('package') as keyof typeof creditPackages

  const selectedPackage = packageId ? creditPackages[packageId] : null

  useEffect(() => {
    if (!orderId || !amount || !paymentKey) {
      console.error('Missing required parameters for payment confirmation')
      return
    }

    // 사용자 정보가 로드될 때까지 대기
    if (!user) {
      console.log('Waiting for user data to load...')
      return
    }

    // 결제 승인 요청
    confirmPayment()
  }, [orderId, amount, paymentKey, user])

  const confirmPayment = async () => {
    if (!user) {
      console.error('User not authenticated')
      return
    }

    setIsConfirming(true)

    try {
      const requestData = {
        orderId,
        amount: parseInt(amount!),
        paymentKey,
        userId: user.id,
        userEmail: user.email,
        userName: user.name
      }

      console.log('Confirming payment with data:', requestData)

      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      console.log('Payment confirmation response status:', response.status)
      console.log('Payment confirmation response headers:', response.headers)

      const json = await response.json()
      console.log('Payment confirmation response body:', json)

      if (!response.ok) {
        console.error('Payment confirmation failed:', {
          status: response.status,
          statusText: response.statusText,
          response: json
        })
        
        // 더 자세한 에러 정보 제공
        let errorMessage = '결제 승인에 실패했습니다.'
        if (json.message) {
          errorMessage = json.message
        } else if (json.error) {
          errorMessage = json.error
        } else if (json.code) {
          errorMessage = `오류 코드: ${json.code}`
        }
        
        setConfirmResult({ 
          success: false, 
          error: { 
            message: errorMessage,
            details: json,
            status: response.status
          } 
        })
        return
      }

      console.log('Payment confirmed successfully:', json)
      setConfirmResult({ success: true, data: json })
    } catch (error) {
      console.error('Payment confirmation error:', error)
      
      let errorMessage = '결제 승인 중 오류가 발생했습니다.'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      setConfirmResult({ 
        success: false, 
        error: { 
          message: errorMessage,
          details: error
        } 
      })
    } finally {
      setIsConfirming(false)
    }
  }

  const handleGoToDashboard = async () => {
    setIsRefreshing(true)
    
    try {
      // 잠시 대기 후 대시보드로 이동
      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    } catch (error) {
      console.error('Failed to navigate to dashboard:', error)
      router.push('/dashboard')
    } finally {
      setIsRefreshing(false)
    }
  }

  if (!orderId || !amount || !paymentKey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">잘못된 접근</CardTitle>
          </CardHeader>
          <CardContent>
            <p>결제 정보가 올바르지 않습니다.</p>
            <Button onClick={handleGoToDashboard} className="w-full mt-4">
              대시보드로 이동
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {isConfirming ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : confirmResult?.success ? (
            <div className="flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          )}
          
          <CardTitle className="text-xl">
            {isConfirming 
              ? '결제 승인 중...' 
              : confirmResult?.success 
                ? '결제 성공!' 
                : '결제 완료'
            }
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isConfirming ? (
            <div className="text-center text-gray-600">
              <p>결제를 승인하고 있습니다...</p>
            </div>
          ) : (
            <>
              {selectedPackage && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Zap className="h-4 w-4" />
                    <span className="font-semibold">{selectedPackage.name} 패키지</span>
                  </div>
                  <p className="text-blue-700 text-sm mt-1">
                    {selectedPackage.credits}개 크레딧이 충전됩니다
                  </p>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">주문번호:</span>
                  <span className="font-mono">{orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">결제 금액:</span>
                  <span className="font-semibold">{parseInt(amount).toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Key:</span>
                  <span className="font-mono text-xs break-all">{paymentKey}</span>
                </div>
              </div>

              {confirmResult?.success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 text-sm font-semibold">
                    결제가 성공적으로 승인되었습니다!
                  </p>
                  {confirmResult.data?.creditsAdded && (
                    <div className="mt-2 space-y-1">
                      <p className="text-green-700 text-sm">
                        🎉 <span className="font-semibold">{confirmResult.data.creditsAdded}개</span> 크레딧이 추가되었습니다!
                      </p>
                      {confirmResult.data.newTotalCredits && (
                        <p className="text-green-600 text-xs">
                          현재 총 보유 크레딧: <span className="font-semibold">{confirmResult.data.newTotalCredits}개</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {confirmResult?.error && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-800 text-sm font-semibold">
                    결제는 완료되었지만 승인에 실패했습니다.
                  </p>
                  <p className="text-yellow-700 text-xs mt-1">
                    {confirmResult.error.message}
                  </p>
                  {confirmResult.error.status && (
                    <p className="text-yellow-600 text-xs mt-1">
                      HTTP 상태: {confirmResult.error.status}
                    </p>
                  )}
                  {confirmResult.error.details && (
                    <details className="mt-2">
                      <summary className="text-yellow-600 text-xs cursor-pointer">
                        상세 오류 정보 보기
                      </summary>
                      <pre className="text-yellow-600 text-xs mt-1 bg-yellow-100 p-2 rounded overflow-auto">
                        {JSON.stringify(confirmResult.error.details, null, 2)}
                      </pre>
                    </details>
                  )}
                  <div className="mt-3">
                    <Button 
                      onClick={confirmPayment} 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                    >
                      다시 시도
                    </Button>
                  </div>
                </div>
              )}

              <Button onClick={handleGoToDashboard} className="w-full" disabled={isRefreshing}>
                {isRefreshing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    대시보드로 이동 중...
                  </>
                ) : (
                  '대시보드로 이동'
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
