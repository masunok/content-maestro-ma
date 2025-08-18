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

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signup, loginWithGoogle, isLoading } = useAuth()
  const router = useRouter()

  const validatePassword = (password: string) => {
    const minLength = 10
    const hasLetter = /[a-zA-Z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    if (password.length < minLength) {
      return "비밀번호는 10자 이상이어야 합니다."
    }
    if (!hasLetter) {
      return "비밀번호에 영문자가 포함되어야 합니다."
    }
    if (!hasNumber) {
      return "비밀번호에 숫자가 포함되어야 합니다."
    }
    if (!hasSpecialChar) {
      return "비밀번호에 특수기호가 포함되어야 합니다."
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    if (!name || !email || !password || !confirmPassword) {
      setError("모든 필드를 입력해주세요.")
      setIsSubmitting(false)
      return
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.")
      setIsSubmitting(false)
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      setIsSubmitting(false)
      return
    }

    try {
      const success = await signup(email, password, name)
      if (success) {
        router.push("/dashboard")
      } else {
        setError("회원가입에 실패했습니다. 다시 시도해주세요.")
      }
    } catch (err: any) {
      console.error("회원가입 오류:", err)
      
      // Supabase 오류 메시지 처리
      if (err.message) {
        if (err.message.includes("User already registered")) {
          setError("이미 등록된 이메일입니다. 로그인 페이지에서 로그인해주세요.")
        } else if (err.message.includes("Password should be at least 6 characters")) {
          setError("비밀번호는 최소 6자 이상이어야 합니다.")
        } else if (err.message.includes("Invalid email")) {
          setError("올바른 이메일 형식을 입력해주세요.")
        } else if (err.message.includes("Unable to validate email")) {
          setError("이메일 인증에 실패했습니다. 다시 시도해주세요.")
        } else {
          setError(`회원가입 중 오류가 발생했습니다: ${err.message}`)
        }
      } else {
        setError("회원가입 중 오류가 발생했습니다. 다시 시도해주세요.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignup = async () => {
    try {
      setError("")
      setIsSubmitting(true)
      const success = await loginWithGoogle()
      if (!success) {
        setError("구글 회원가입에 실패했습니다.")
      }
    } catch (err: any) {
      console.error("구글 회원가입 오류:", err)
      if (err.message) {
        setError(`구글 회원가입 중 오류가 발생했습니다: ${err.message}`)
      } else {
        setError("구글 회원가입 중 오류가 발생했습니다.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-serif">회원가입</CardTitle>
            <CardDescription>AI 블로그 콘텐츠 생성을 시작해보세요</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
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
                  placeholder="영문자, 숫자, 특수기호 포함 10자 이상"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
                <div className="text-xs text-muted-foreground">영문자, 숫자, 특수기호를 포함한 10자 이상</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="비밀번호 재입력"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  {error}
                  {error.includes("이미 등록된 이메일") && (
                    <div className="mt-2">
                      <Link href="/login" className="text-primary hover:underline text-sm">
                        로그인 페이지로 이동 →
                      </Link>
                    </div>
                  )}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting || isLoading}>
                {isSubmitting ? "가입 중..." : "회원가입"}
              </Button>
            </form>

            <div className="mt-6">
              <Separator className="my-4" />
              <div className="text-center text-sm text-muted-foreground mb-4">또는</div>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={handleGoogleSignup}
                disabled={isSubmitting || isLoading}
              >
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
                구글로 회원가입
              </Button>
            </div>

            <div className="mt-6 text-center text-sm">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="text-primary hover:underline">
                로그인
              </Link>
            </div>
            <div className="mt-4 text-xs text-muted-foreground text-center">
              회원가입 시 무료 크레딧 10개를 드립니다!
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
