"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/header"
import { ContentGenerator } from "@/components/content-generator"
import { ContentHistory } from "@/components/content-history"
import { DashboardStats } from "@/components/dashboard-stats"
import { EnvSetupNotice } from "@/components/env-setup-notice"

export default function DashboardPage() {
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
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">대시보드</h1>
          <p className="text-muted-foreground">안녕하세요, {user.name}님! AI로 블로그 콘텐츠를 생성해보세요.</p>
        </div>

        <EnvSetupNotice />

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <ContentGenerator />
            <ContentHistory />
          </div>
          <div>
            <DashboardStats />
          </div>
        </div>
      </main>
    </div>
  )
}
