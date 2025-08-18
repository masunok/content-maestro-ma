"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Zap, ArrowRight } from "lucide-react"
import Link from "next/link"

const creditPackages = {
  basic: { name: "베이직", credits: 50, price: 9900 },
  pro: { name: "프로", credits: 150, price: 24900 },
  enterprise: { name: "엔터프라이즈", credits: 500, price: 79900 },
}

export default function PaymentSuccessPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const packageId = searchParams.get("package") as keyof typeof creditPackages

  const selectedPackage = packageId ? creditPackages[packageId] : null

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

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
      <main className="container py-12 max-w-2xl">
        <Card className="text-center">
          <CardHeader className="pb-6">
            <div className="mx-auto mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-serif text-green-600">결제가 완료되었습니다!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold mb-2">구매 내역</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>패키지</span>
                  <span className="font-semibold">{selectedPackage.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>크레딧</span>
                  <span className="font-semibold flex items-center gap-1">
                    <Zap className="h-4 w-4" />
                    {selectedPackage.credits}개
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>결제 금액</span>
                  <span className="font-semibold">{selectedPackage.price.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span>현재 보유 크레딧</span>
                  <span className="font-semibold text-primary">{user.credits}개</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-muted-foreground">
                크레딧이 성공적으로 충전되었습니다. 이제 AI 콘텐츠 생성을 시작해보세요!
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="flex-1">
                  <Link href="/dashboard">
                    대시보드로 이동
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button variant="outline" asChild className="flex-1 bg-transparent">
                  <Link href="/credits/history">결제 내역 보기</Link>
                </Button>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
              <p>결제 영수증은 등록하신 이메일로 발송됩니다.</p>
              <p>문의사항이 있으시면 고객센터로 연락해주세요.</p>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
