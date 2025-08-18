"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CreditCard, Plus, Minus, Gift } from "lucide-react"
import Link from "next/link"

export default function CreditHistoryPage() {
  const { user, isLoading, getCreditHistory } = useAuth()
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

  const creditHistory = getCreditHistory()

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return <Plus className="h-4 w-4 text-green-600" />
      case "usage":
        return <Minus className="h-4 w-4 text-red-600" />
      case "bonus":
        return <Gift className="h-4 w-4 text-blue-600" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "purchase":
        return "text-green-600"
      case "usage":
        return "text-red-600"
      case "bonus":
        return "text-blue-600"
      default:
        return "text-foreground"
    }
  }

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "purchase":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            구매
          </Badge>
        )
      case "usage":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            사용
          </Badge>
        )
      case "bonus":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            보너스
          </Badge>
        )
      default:
        return <Badge variant="secondary">기타</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              대시보드로 돌아가기
            </Link>
          </Button>
          <h1 className="text-3xl font-serif font-bold mb-2">크레딧 사용 내역</h1>
          <p className="text-muted-foreground">크레딧 구매 및 사용 내역을 확인하세요</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>거래 내역</CardTitle>
              </CardHeader>
              <CardContent>
                {creditHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>아직 거래 내역이 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {creditHistory.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(transaction.type)}
                          <div>
                            <div className="font-medium">{transaction.description}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(transaction.createdAt).toLocaleDateString("ko-KR", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getTransactionBadge(transaction.type)}
                          <div className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                            {transaction.amount > 0 ? "+" : ""}
                            {transaction.amount}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>현재 잔액</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">{user.credits}</div>
                  <p className="text-sm text-muted-foreground mb-4">사용 가능한 크레딧</p>
                  <Button className="w-full" asChild>
                    <Link href="/credits">
                      <Plus className="h-4 w-4 mr-2" />
                      크레딧 구매
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>월간 요약</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">이번 달 구매</span>
                  <span className="font-semibold text-green-600">
                    +
                    {creditHistory
                      .filter(
                        (t) => t.type === "purchase" && new Date(t.createdAt).getMonth() === new Date().getMonth(),
                      )
                      .reduce((sum, t) => sum + t.amount, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">이번 달 사용</span>
                  <span className="font-semibold text-red-600">
                    {creditHistory
                      .filter((t) => t.type === "usage" && new Date(t.createdAt).getMonth() === new Date().getMonth())
                      .reduce((sum, t) => sum + t.amount, 0)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
