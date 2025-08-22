"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/header"
import { ContentGenerator, ContentGeneratorRef } from "@/components/content-generator"
import { ContentHistory, ContentHistoryRef } from "@/components/content-history"
import { DashboardStats } from "@/components/dashboard-stats"
import { EnvSetupNotice } from "@/components/env-setup-notice"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const contentHistoryRef = useRef<ContentHistoryRef>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    // 10초 후에도 로딩이 계속되면 타임아웃 상태로 설정
    const timer = setTimeout(() => {
      if (isLoading) {
        setLoadingTimeout(true)
      }
    }, 10000)

    return () => clearTimeout(timer)
  }, [isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold mb-2">대시보드 로딩 중</h2>
          <p className="text-gray-600 mb-4">사용자 정보를 불러오는 중입니다...</p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>• 인증 상태 확인</p>
            <p>• 프로필 정보 로드</p>
            <p>• 대시보드 준비</p>
          </div>
          {loadingTimeout && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 mb-2">
                로딩이 오래 걸리고 있습니다. 문제가 지속되면 새로고침해주세요.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                페이지 새로고침
              </button>
            </div>
          )}
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
            <ContentHistory ref={contentHistoryRef} />
          </div>
          <div>
            <DashboardStats />
          </div>
        </div>
      </main>
    </div>
  )
}
