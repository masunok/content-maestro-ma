"use client"

import { useState, forwardRef, useImperativeHandle } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { Wand2, Loader2, Lightbulb, Target } from "lucide-react"

export interface ContentGeneratorRef {
  refreshHistory: () => Promise<void>
}

export const ContentGenerator = forwardRef<ContentGeneratorRef>((props, ref) => {
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

  // 외부에서 호출할 수 있는 새로고침 함수
  useImperativeHandle(ref, () => ({
    refreshHistory: async () => {
      // 콘텐츠 히스토리 새로고침을 위한 이벤트 발생
      window.dispatchEvent(new CustomEvent('refreshContentHistory'))
    }
  }))

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

    try {
      const success = await deductCredits(1, `${formData.contentType} 생성: ${formData.topic}`)

      if (!success) {
        alert("크레딧 사용에 실패했습니다.")
        setIsGenerating(false)
        return
      }

      // OpenAI API 호출
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: formData.topic,
          keywords: formData.keywords,
          tone: formData.tone,
          contentType: formData.contentType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '콘텐츠 생성에 실패했습니다.')
      }

      const data = await response.json()
      
      if (data.success) {
        setGeneratedContent(data.content)
        setSeoTips(data.seoTips)
      } else {
        throw new Error('콘텐츠 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error("콘텐츠 생성 중 오류:", error)
      alert(error instanceof Error ? error.message : "콘텐츠 생성 중 오류가 발생했습니다.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedContent || !user) return

    try {
      const response = await fetch('/api/save-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.topic,
          content: generatedContent,
          contentType: formData.contentType,
          keywords: formData.keywords,
          tone: formData.tone,
          userId: user.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '콘텐츠 저장에 실패했습니다.')
      }

      const data = await response.json()
      
      if (data.success) {
        alert("콘텐츠가 성공적으로 저장되었습니다!")
        
        // 콘텐츠 히스토리 새로고침 이벤트 발생
        window.dispatchEvent(new CustomEvent('refreshContentHistory'))
        
        // 폼 초기화
        setGeneratedContent("")
        setSeoTips([])
        setFormData({ topic: "", keywords: "", tone: "", contentType: "blog-post" })
      } else {
        throw new Error('콘텐츠 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error("콘텐츠 저장 중 오류:", error)
      alert(error instanceof Error ? error.message : "콘텐츠 저장 중 오류가 발생했습니다.")
    }
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
})
