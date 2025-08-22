"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, loginWithGoogle, isLoading } = useAuth()
  const router = useRouter()

  // 로그인 페이지에서는 auth-context의 isLoading을 무시하고 로컬 상태만 사용
  const isPageLoading = isSubmitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.")
      setIsSubmitting(false)
      return
    }

    try {
      // 새로운 인증 API 호출
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        console.log('✅ 로그인 성공:', data.user)
        
        // Supabase Auth 세션 설정
        const success = await login(email, password)
        if (success) {
          // 로그인 성공 시 대시보드로 이동
          console.log('🚀 대시보드로 이동합니다...')
          router.push("/dashboard")
        } else {
          setError("인증은 성공했지만 세션 설정에 실패했습니다.")
        }
      } else {
        // 오류 코드에 따른 메시지 처리
        switch (data.code) {
          case 'USER_NOT_FOUND':
            setError("등록되지 않은 이메일입니다. 회원가입을 먼저 진행해주세요.")
            break
          case 'NO_PASSWORD_SET':
            setError("비밀번호가 설정되지 않았습니다. 소셜 로그인을 사용해주세요.")
            break
          case 'INVALID_PASSWORD':
            setError("이메일 또는 비밀번호가 올바르지 않습니다.")
            break
          case 'PASSWORD_UPDATE_ERROR':
            setError("비밀번호 설정 중 오류가 발생했습니다. 다시 시도해주세요.")
            break
          case 'USER_ERROR':
            setError("사용자 정보 조회 중 오류가 발생했습니다.")
            break
          case 'AUTH_ERROR':
            setError("인증 시스템 오류가 발생했습니다.")
            break
          default:
            setError(data.error || "로그인에 실패했습니다.")
        }
      }
    } catch (err: any) {
      console.error("로그인 오류:", err)
      setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setError("")
      setIsSubmitting(true)
      console.log('🔐 구글 로그인 시작...')
      
      const success = await loginWithGoogle()
      if (success) {
        console.log('✅ 구글 로그인 요청 성공, 리다이렉트 대기 중...')
        // 구글 로그인은 OAuth 리다이렉트를 사용하므로 
        // 여기서는 성공 메시지만 표시하고 리다이렉트를 기다림
        setError("구글 로그인 페이지로 이동 중... 잠시만 기다려주세요.")
        // OAuth 리다이렉트가 시작되면 로딩 상태 유지
        // 페이지가 리다이렉트되므로 setIsSubmitting(false)를 호출하지 않음
      } else {
        setError("구글 로그인에 실패했습니다.")
        setIsSubmitting(false)
      }
    } catch (err: any) {
      console.error("구글 로그인 오류:", err)
      if (err.message) {
        setError(`구글 로그인 중 오류가 발생했습니다: ${err.message}`)
      } else {
        setError("구글 로그인 중 오류가 발생했습니다.")
      }
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-serif">로그인</CardTitle>
            <CardDescription>콘텐츠 마에스트로에 오신 것을 환영합니다</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  {error}
                  {error.includes("등록되지 않은 이메일") && (
                    <div className="mt-2">
                      <Link href="/signup" className="text-primary hover:underline text-sm">
                        회원가입 페이지로 이동 →
                      </Link>
                    </div>
                  )}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isPageLoading}>
                {isPageLoading ? "로그인 중..." : "로그인"}
              </Button>
            </form>

            <div className="mt-6">
              <Separator className="my-4" />
              <div className="text-center text-sm text-muted-foreground mb-4">또는</div>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={handleGoogleLogin}
                disabled={isPageLoading}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    구글 로그인 중...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    구글로 로그인
                  </>
                )}
              </Button>
            </div>

            <div className="mt-6 text-center text-sm">
              계정이 없으신가요?{" "}
              <Link href="/signup" className="text-primary hover:underline">
                회원가입
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
