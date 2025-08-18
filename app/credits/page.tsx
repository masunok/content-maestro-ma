"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Check, Zap, Star } from "lucide-react"

const creditPackages = [
  {
    id: "basic",
    name: "베이직",
    credits: 50,
    price: 9900,
    popular: false,
    features: ["50개 콘텐츠 생성", "기본 SEO 최적화", "이메일 지원"],
  },
  {
    id: "pro",
    name: "프로",
    credits: 150,
    price: 24900,
    popular: true,
    features: ["150개 콘텐츠 생성", "고급 SEO 최적화", "우선 지원", "커스텀 톤앤매너"],
  },
  {
    id: "enterprise",
    name: "엔터프라이즈",
    credits: 500,
    price: 79900,
    popular: false,
    features: ["500개 콘텐츠 생성", "프리미엄 SEO 최적화", "전담 지원", "API 액세스", "팀 협업 기능"],
  },
]

export default function CreditsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  const handlePurchase = (packageInfo: (typeof creditPackages)[0]) => {
    router.push(`/payment?package=${packageInfo.id}`)
  }

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
      <main className="container py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold mb-4">크레딧 구매</h1>
          <p className="text-xl text-muted-foreground mb-2">더 많은 AI 콘텐츠를 생성하기 위해 크레딧을 구매하세요</p>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
            <CreditCard className="h-4 w-4" />
            <span className="font-semibold">현재 보유: {user.credits}개 크레딧</span>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {creditPackages.map((pkg) => (
            <Card key={pkg.id} className={`relative ${pkg.popular ? "border-primary shadow-lg" : ""}`}>
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    인기
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-serif">{pkg.name}</CardTitle>
                <div className="text-4xl font-bold text-primary mb-2">{pkg.price.toLocaleString()}원</div>
                <div className="text-lg font-semibold flex items-center justify-center gap-2">
                  <Zap className="h-5 w-5 text-accent" />
                  {pkg.credits}개 크레딧
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={pkg.popular ? "default" : "outline"}
                  onClick={() => handlePurchase(pkg)}
                >
                  구매하기
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-serif font-bold mb-6">자주 묻는 질문</h2>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto text-left">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">크레딧은 언제 만료되나요?</h3>
                <p className="text-sm text-muted-foreground">
                  구매한 크레딧은 만료되지 않습니다. 언제든지 사용하실 수 있습니다.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">환불이 가능한가요?</h3>
                <p className="text-sm text-muted-foreground">
                  구매 후 7일 이내, 크레딧을 사용하지 않은 경우 100% 환불 가능합니다.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
