"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function PaymentFailedPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

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

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12 max-w-2xl">
        <Card className="text-center">
          <CardHeader className="pb-6">
            <div className="mx-auto mb-4">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-2xl font-serif text-red-600">결제에 실패했습니다</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="font-semibold mb-2 text-red-800">결제 실패 사유</h3>
              <ul className="text-sm text-red-700 space-y-1 text-left">
                <li>• 카드 정보가 올바르지 않습니다</li>
                <li>• 결제 한도를 초과했습니다</li>
                <li>• 네트워크 오류가 발생했습니다</li>
                <li>• 카드사에서 결제를 거부했습니다</li>
              </ul>
            </div>

            <div className="space-y-4">
              <p className="text-muted-foreground">
                결제 정보를 다시 확인하시고 재시도해주세요. 문제가 지속되면 고객센터로 문의해주세요.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="flex-1">
                  <Link href="/credits">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    다시 시도
                  </Link>
                </Button>
                <Button variant="outline" asChild className="flex-1 bg-transparent">
                  <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    대시보드로 이동
                  </Link>
                </Button>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
              <p>고객센터: 1588-1234 (평일 09:00-18:00)</p>
              <p>이메일: support@contentmaestro.com</p>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
