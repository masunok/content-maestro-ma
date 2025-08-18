import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Star } from "lucide-react"

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-4 bg-muted/30">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-serif font-bold text-3xl md:text-4xl mb-4">간단하고 투명한 가격</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            크레딧 기반 시스템으로 필요한 만큼만 사용하세요. 무료 체험으로 시작해보세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* 무료 체험 */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="font-serif text-xl">무료 체험</CardTitle>
              <CardDescription>서비스를 체험해보세요</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">무료</span>
                <span className="text-muted-foreground ml-2">10 크레딧</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">10회 콘텐츠 생성</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">SEO 최적화 팁</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">기본 지원</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full">무료로 시작하기</Button>
            </CardFooter>
          </Card>

          {/* 스타터 */}
          <Card className="relative border-primary">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <Star className="h-3 w-3" />
                인기
              </div>
            </div>
            <CardHeader>
              <CardTitle className="font-serif text-xl">스타터</CardTitle>
              <CardDescription>개인 블로거에게 적합</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">5,000원</span>
                <span className="text-muted-foreground ml-2">10 크레딧</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">10회 콘텐츠 생성</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">SEO 최적화 팁</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">우선 지원</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">콘텐츠 히스토리</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full">구매하기</Button>
            </CardFooter>
          </Card>

          {/* 프로 */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl">프로</CardTitle>
              <CardDescription>전문 마케터를 위한</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">40,000원</span>
                <span className="text-muted-foreground ml-2">100 크레딧</span>
                <div className="text-sm text-accent font-medium">20% 할인</div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">100회 콘텐츠 생성</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">고급 SEO 분석</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">24/7 지원</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">API 접근</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full bg-transparent">
                구매하기
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            더 많은 크레딧이 필요하신가요?
            <Button variant="link" className="p-0 ml-1 h-auto">
              엔터프라이즈 플랜 문의하기
            </Button>
          </p>
        </div>
      </div>
    </section>
  )
}
