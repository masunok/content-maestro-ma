"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { Wand2, Loader2, Lightbulb, Target } from "lucide-react"

export function ContentGenerator() {
  const { user, deductCredits } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  const [formData, setFormData] = useState({
    topic: "",
    keywords: "",
    tone: "",
    contentType: "blog-post",
  })
  const [generatedContent, setGeneratedContent] = useState("")
  const [seoTips, setSeoTips] = useState<string[]>([])

  const handleGenerate = async () => {
    setIsGenerating(true)

    if (!formData.topic || !formData.keywords) {
      alert("주제와 키워드를 입력해주세요.")
      setIsGenerating(false)
      return
    }

    if (!user || user.credits < 1) {
      alert("크레딧이 부족합니다. 크레딧을 구매해주세요.")
      setIsGenerating(false)
      return
    }

    const success = deductCredits(1, `${formData.contentType} 생성: ${formData.topic}`)

    await new Promise((resolve) => setTimeout(resolve, 3000))

    const mockContent = `# ${formData.topic}

${formData.keywords
  .split(",")
  .map((keyword) => keyword.trim())
  .join(", ")}에 대한 포괄적인 가이드입니다.

## 소개

${formData.topic}는 현재 많은 사람들이 관심을 가지고 있는 주제입니다. 이 글에서는 ${formData.keywords.split(",")[0]?.trim()}를 중심으로 실용적인 정보를 제공하겠습니다.

## 주요 내용

### 1. 기본 개념 이해
${formData.topic}의 기본적인 개념과 중요성에 대해 알아보겠습니다.

### 2. 실제 적용 방법
구체적인 실행 방법과 단계별 가이드를 제공합니다.

### 3. 주의사항 및 팁
실제 적용 시 주의해야 할 점들과 유용한 팁을 공유합니다.

## 결론

${formData.topic}에 대한 이해를 바탕으로 실제 적용해보시기 바랍니다. 추가 질문이 있으시면 언제든 문의해주세요.

---
*이 콘텐츠는 AI에 의해 생성되었습니다. 사실 확인 후 사용하시기 바랍니다.*`

    if (success) {
      setGeneratedContent(mockContent)
      setSeoTips([
        `제목에 주요 키워드 "${formData.keywords.split(",")[0]?.trim()}" 포함하기`,
        `메타 디스크립션을 150-160자로 작성하고 핵심 키워드 포함`,
        `H1, H2, H3 태그를 활용한 구조화된 콘텐츠 작성`,
        `이미지에 alt 텍스트 추가 및 파일명에 키워드 포함`,
        `내부 링크 3-5개 추가로 사이트 체류시간 증가`,
        `관련 키워드를 자연스럽게 본문에 2-3% 밀도로 배치`,
        `소셜미디어 공유 버튼 추가로 사회적 신호 강화`,
        `모바일 최적화 및 페이지 로딩 속도 개선`,
      ])
    } else {
      alert("크레딧 사용에 실패했습니다.")
    }

    setIsGenerating(false)
  }

  const handleSave = () => {
    alert("콘텐츠가 저장되었습니다!")
    setGeneratedContent("")
    setSeoTips([])
    setFormData({ topic: "", keywords: "", tone: "", contentType: "blog-post" })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          AI 콘텐츠 생성
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="topic">주제</Label>
            <Input
              id="topic"
              placeholder="예: 디지털 마케팅 전략"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contentType">콘텐츠 유형</Label>
            <Select
              value={formData.contentType}
              onValueChange={(value) => setFormData({ ...formData, contentType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blog-post">블로그 포스트</SelectItem>
                <SelectItem value="article">아티클</SelectItem>
                <SelectItem value="social-media">소셜미디어</SelectItem>
                <SelectItem value="newsletter">뉴스레터</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="keywords">키워드 (쉼표로 구분)</Label>
          <Input
            id="keywords"
            placeholder="예: SEO, 콘텐츠 마케팅, 브랜딩"
            value={formData.keywords}
            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tone">톤앤매너</Label>
          <Select value={formData.tone} onValueChange={(value) => setFormData({ ...formData, tone: value })}>
            <SelectTrigger>
              <SelectValue placeholder="톤앤매너를 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">전문적</SelectItem>
              <SelectItem value="friendly">친근한</SelectItem>
              <SelectItem value="casual">캐주얼</SelectItem>
              <SelectItem value="formal">격식있는</SelectItem>
              <SelectItem value="creative">창의적</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleGenerate} disabled={isGenerating || !user || user.credits < 1} className="w-full">
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              콘텐츠 생성 (1 크레딧)
            </>
          )}
        </Button>

        {generatedContent && (
          <div className="space-y-4">
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">생성된 콘텐츠</h3>
              <div className="bg-muted p-4 rounded-lg">
                <Textarea
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  className="min-h-[300px] bg-background"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleSave}>저장</Button>
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(generatedContent)}>
                  복사
                </Button>
                <Button variant="outline" onClick={() => setGeneratedContent("")}>
                  취소
                </Button>
              </div>
            </div>

            {seoTips.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  SEO 최적화 팁
                </h3>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="grid gap-3">
                    {seoTips.map((tip, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {user && user.credits < 1 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
            <p className="text-sm text-destructive mb-2">크레딧이 부족합니다!</p>
            <Button size="sm" variant="outline" asChild>
              <a href="/credits">크레딧 구매하기</a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
