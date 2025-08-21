"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, FileText, ExternalLink } from "lucide-react"

export function EnvSetupNotice() {
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 개발 모드에서는 환경 변수가 없어도 경고를 표시하지 않음
  if (process.env.NODE_ENV === 'development' && (!hasSupabaseUrl || !hasSupabaseKey)) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            개발 모드 - Mock 데이터 사용 중
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3">
                <p className="text-amber-800">
                  환경 변수가 설정되지 않아 Mock 데이터로 실행됩니다. 
                  실제 기능을 사용하려면 환경 변수를 설정해주세요.
                </p>
                
                <div className="flex gap-2">
                  <a 
                    href="/ENV_SETUP.md" 
                    target="_blank" 
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    설정 가이드
                  </a>
                  
                  <a 
                    href="https://supabase.com" 
                    target="_blank" 
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Supabase 프로젝트 생성
                  </a>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (hasSupabaseUrl && hasSupabaseKey) {
    return null
  }

  return (
    <Card className="border-destructive bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          환경 변수 설정이 필요합니다
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-3">
              <p>
                Supabase 연결을 위해 환경 변수를 설정해야 합니다.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">NEXT_PUBLIC_SUPABASE_URL:</span>
                  {hasSupabaseUrl ? (
                    <span className="text-green-600">✅ 설정됨</span>
                  ) : (
                    <span className="text-red-600">❌ 설정되지 않음</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
                  {hasSupabaseKey ? (
                    <span className="text-green-600">✅ 설정됨</span>
                  ) : (
                    <span className="text-red-600">❌ 설정되지 않음</span>
                  )}
                </div>
              </div>

              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-semibold mb-2">📁 .env.local 파일을 생성하고 다음 내용을 추가하세요:</p>
                <pre className="text-xs bg-background p-2 rounded border overflow-x-auto">
{`# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI API 설정 (콘텐츠 생성 기능용)
OPENAI_API_KEY=your_openai_api_key_here`}
                </pre>
              </div>

              <div className="flex gap-2">
                <a 
                  href="/ENV_SETUP.md" 
                  target="_blank" 
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  상세 설정 가이드
                </a>
                
                <a 
                  href="https://supabase.com" 
                  target="_blank" 
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Supabase 프로젝트 생성
                </a>
              </div>

              <p className="text-xs text-muted-foreground">
                💡 환경 변수를 설정한 후 개발 서버를 재시작해야 합니다.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
