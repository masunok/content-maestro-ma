"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { User, LogOut, CreditCard } from "lucide-react"

export function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logout()
      // 로그아웃 성공 메시지
      alert("로그아웃되었습니다.")
      // 로그아웃 후 홈페이지로 리다이렉션
      router.push("/")
      // 페이지 새로고침으로 상태 완전 초기화
      router.refresh()
    } catch (error) {
      console.error("로그아웃 중 오류:", error)
      alert("로그아웃 중 오류가 발생했습니다.")
    }
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-serif font-bold text-lg">콘</span>
            </div>
            <span className="font-serif font-bold text-xl">콘텐츠 마에스트로</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              서비스 소개
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              가격
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4" />
                <span>{user.credits} 크레딧</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">대시보드</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">로그인</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">회원가입</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
