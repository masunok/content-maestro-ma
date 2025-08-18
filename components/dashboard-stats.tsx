"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { CreditCard, FileText, TrendingUp, Plus, History } from "lucide-react"

export function DashboardStats() {
  const { user, getCreditHistory } = useAuth()

  if (!user) return null

  const creditHistory = getCreditHistory()
  const thisMonthUsage = creditHistory.filter(
    (transaction) =>
      transaction.type === "usage" && new Date(transaction.createdAt).getMonth() === new Date().getMonth(),
  )
  const contentGenerated = thisMonthUsage.length
  const creditsUsed = thisMonthUsage.reduce((sum, t) => sum + Math.abs(t.amount), 0)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            크레딧 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">{user.credits}</div>
            <p className="text-sm text-muted-foreground mb-4">사용 가능한 크레딧</p>
            <div className="space-y-2">
              <Button className="w-full" asChild>
                <Link href="/credits">
                  <Plus className="h-4 w-4 mr-2" />
                  크레딧 구매
                </Link>
              </Button>
              <Button variant="outline" className="w-full bg-transparent" asChild>
                <Link href="/credits/history">
                  <History className="h-4 w-4 mr-2" />
                  사용 내역
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            이번 달 통계
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm">생성된 콘텐츠</span>
            <span className="font-semibold">{contentGenerated}개</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">사용된 크레딧</span>
            <span className="font-semibold">{creditsUsed}개</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">평균 품질 점수</span>
            <span className="font-semibold">{contentGenerated > 0 ? "4.2/5" : "-"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            사용 팁
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li>• 구체적인 키워드를 입력하면 더 정확한 콘텐츠를 생성할 수 있습니다</li>
            <li>• 톤앤매너를 명확히 설정하면 브랜드에 맞는 글을 작성할 수 있습니다</li>
            <li>• 생성된 콘텐츠는 언제든 수정하고 다운로드할 수 있습니다</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
