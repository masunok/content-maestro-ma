"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Eye, Trash2, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

interface ContentItem {
  id: string
  title: string
  content_type: string
  created_at: string
  status: string
  content: string
  keywords: string[]
  tone: string
}

export function ContentHistory() {
  const { user } = useAuth()
  const [contentHistory, setContentHistory] = useState<ContentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null)
  const [showContentModal, setShowContentModal] = useState(false)

  useEffect(() => {
    if (user) {
      fetchContentHistory()
    }
  }, [user])

  const fetchContentHistory = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/content-history?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setContentHistory(data.contentHistory || [])
      }
    } catch (error) {
      console.error('콘텐츠 히스토리 조회 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewContent = (content: ContentItem) => {
    setSelectedContent(content)
    setShowContentModal(true)
  }

  const handleDownload = (content: ContentItem) => {
    const element = document.createElement('a')
    const file = new Blob([content.content], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `${content.title}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleDelete = async (contentId: string) => {
    if (!confirm('정말로 이 콘텐츠를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/content-history/${contentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setContentHistory(prev => prev.filter(item => item.id !== contentId))
        alert('콘텐츠가 삭제되었습니다.')
      } else {
        alert('콘텐츠 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('콘텐츠 삭제 오류:', error)
      alert('콘텐츠 삭제 중 오류가 발생했습니다.')
    }
  }

  const getContentTypeLabel = (type: string) => {
    const typeLabels: { [key: string]: string } = {
      'blog-post': '블로그 포스트',
      'article': '아티클',
      'social-media': '소셜미디어',
      'newsletter': '뉴스레터'
    }
    return typeLabels[type] || type
  }

  const getStatusLabel = (status: string) => {
    const statusLabels: { [key: string]: string } = {
      'completed': '완료',
      'draft': '초안',
      'archived': '보관'
    }
    return statusLabels[status] || status
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            콘텐츠 히스토리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
            <p>로딩 중...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            콘텐츠 히스토리
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contentHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>아직 생성된 콘텐츠가 없습니다.</p>
              <p className="text-sm">위에서 첫 번째 콘텐츠를 생성해보세요!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {contentHistory.map((content) => (
                <div key={content.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{content.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{getContentTypeLabel(content.content_type)}</Badge>
                        <Badge variant="outline">{getStatusLabel(content.status)}</Badge>
                        <span className="text-sm text-muted-foreground">{content.content.length}자</span>
                      </div>
                      {content.keywords && content.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {content.keywords.slice(0, 3).map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                          {content.keywords.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{content.keywords.length - 3}개
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleViewContent(content)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDownload(content)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDelete(content.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    생성일: {format(new Date(content.created_at), 'yyyy년 MM월 dd일', { locale: ko })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 콘텐츠 상세 보기 모달 */}
      {showContentModal && selectedContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">{selectedContent.title}</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowContentModal(false)}
              >
                ✕
              </Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm">{selectedContent.content}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
