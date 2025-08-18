"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Eye, Trash2 } from "lucide-react"

// Mock data for content history
const mockHistory = [
  {
    id: 1,
    title: "디지털 마케팅 전략 가이드",
    type: "블로그 포스트",
    createdAt: "2024-01-15",
    status: "완료",
    wordCount: 1250,
  },
  {
    id: 2,
    title: "소셜미디어 마케팅 팁",
    type: "아티클",
    createdAt: "2024-01-14",
    status: "완료",
    wordCount: 800,
  },
]

export function ContentHistory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          콘텐츠 히스토리
        </CardTitle>
      </CardHeader>
      <CardContent>
        {mockHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>아직 생성된 콘텐츠가 없습니다.</p>
            <p className="text-sm">위에서 첫 번째 콘텐츠를 생성해보세요!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {mockHistory.map((content) => (
              <div key={content.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">{content.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{content.type}</Badge>
                      <span className="text-sm text-muted-foreground">{content.wordCount}자</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">생성일: {content.createdAt}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
