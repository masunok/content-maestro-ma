"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Shield, Zap, CreditCard } from "lucide-react"
import Link from "next/link"
import { TossPaymentWidget } from "@/components/toss-payment-widget"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"

const creditPackages = {
  basic: { name: "베이직", credits: 50, price: 9900 },
  pro: { name: "프로", credits: 150, price: 24900 },
  enterprise: { name: "엔터프라이즈", credits: 500, price: 79900 },
}

// 토스페이먼츠 요구사항에 맞는 안전한 주문 ID 생성
function generateOrderId(): string {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  return `order_${timestamp}_${randomStr}`
}

export default function PaymentPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const packageId = searchParams.get("package") as keyof typeof creditPackages

  const selectedPackage = packageId ? creditPackages[packageId] : null

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
    if (!selectedPackage) {
      router.push("/credits")
    }
  }, [user, isLoading, selectedPackage, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user || !selectedPackage) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 max-w-4xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/credits">
            <ArrowLeft className="h-4 w-4 mr-2" />
            크레딧 구매로 돌아가기
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>주문 요약</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selectedPackage.name} 패키지</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    {selectedPackage.credits}개 크레딧
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{selectedPackage.price.toLocaleString()}원</div>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between font-semibold">
                <span>총 결제 금액</span>
                <span className="text-lg text-primary">{selectedPackage.price.toLocaleString()}원</span>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>안전한 결제가 보장됩니다</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>결제 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">토스페이먼츠로 안전하게 결제</span>
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Shield className="h-4 w-4" />
                    <span>결제 정보는 토스페이먼츠에서 안전하게 처리됩니다</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    신용카드, 계좌이체, 휴대폰 결제 등 다양한 결제 방법을 지원합니다.
                  </p>
                </div>

                <TossPaymentWidget
                  clientKey={process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY || "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm"}
                  orderId={generateOrderId()}
                  orderName={`${selectedPackage.name} 패키지 (${selectedPackage.credits} 크레딧)`}
                  amount={selectedPackage.price}
                  customerName={user?.name || user?.email?.split('@')[0] || '고객'}
                  customerEmail={user?.email || 'customer@example.com'}
                />

                <div className="text-xs text-muted-foreground text-center">
                  결제 진행 시{" "}
                  <Link href="/terms" className="underline">
                    이용약관
                  </Link>{" "}
                  및{" "}
                  <Link href="/privacy" className="underline">
                    개인정보처리방침
                  </Link>
                  에 동의한 것으로 간주됩니다.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
