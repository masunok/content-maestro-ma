import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Zap, Target } from "lucide-react"

export function HeroSection() {
  return (
    <section className="py-20 px-4">
      <div className="container max-w-6xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent-foreground border border-accent/20">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">AI 기반 콘텐츠 생성</span>
          </div>
        </div>

        <h1 className="font-serif font-bold text-4xl md:text-6xl lg:text-7xl mb-6 leading-tight">
          AI가 만드는
          <br />
          <span className="text-primary">완벽한 블로그</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
          주제만 입력하면 AI가 자동으로 고품질 블로그 콘텐츠와 SEO 최적화 팁을 생성합니다. 콘텐츠 마에스트로와 함께
          블로그 운영을 혁신하세요.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button size="lg" className="text-lg px-8 py-6" asChild>
            <a href="/dashboard">
              대시보드로 이동
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
          <Button variant="outline" size="lg" className="text-lg px-8 py-6 bg-transparent">
            데모 보기
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-serif font-semibold text-lg">빠른 생성</h3>
            <p className="text-muted-foreground text-center">몇 초 만에 완성되는 고품질 블로그 콘텐츠</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-serif font-semibold text-lg">SEO 최적화</h3>
            <p className="text-muted-foreground text-center">검색 엔진 최적화된 콘텐츠로 트래픽 증가</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-serif font-semibold text-lg">AI 품질</h3>
            <p className="text-muted-foreground text-center">GPT-4o 기반의 전문적인 콘텐츠 생성</p>
          </div>
        </div>
      </div>
    </section>
  )
}
