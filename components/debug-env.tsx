"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bug, Eye, EyeOff } from "lucide-react"

export function DebugEnv() {
  const [showDebug, setShowDebug] = useState(false)

  // 환경 변수 상태 확인
  const envStatus = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    openaiKey: !!process.env.OPENAI_API_KEY,
    baseUrl: !!process.env.NEXT_PUBLIC_BASE_URL
  }

  // 모든 환경 변수 표시 (개발용)
  const allEnvVars = {
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
    'NEXT_PUBLIC_BASE_URL': process.env.NEXT_PUBLIC_BASE_URL
  }

  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={() => setShowDebug(!showDebug)}
        variant="outline"
        size="sm"
        className="bg-background/80 backdrop-blur-sm"
      >
        <Bug className="h-4 w-4 mr-2" />
        {showDebug ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>

      {showDebug && (
        <Card className="absolute bottom-12 right-0 w-96 max-h-96 overflow-y-auto">
          <CardHeader>
            <CardTitle className="text-sm">🔧 환경 변수 디버그</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Supabase URL:</span>
                <Badge variant={envStatus.supabaseUrl ? "default" : "destructive"}>
                  {envStatus.supabaseUrl ? "✅" : "❌"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Supabase Key:</span>
                <Badge variant={envStatus.supabaseKey ? "default" : "destructive"}>
                  {envStatus.supabaseKey ? "✅" : "❌"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">OpenAI Key:</span>
                <Badge variant={envStatus.openaiKey ? "default" : "destructive"}>
                  {envStatus.openaiKey ? "✅" : "❌"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Base URL:</span>
                <Badge variant={envStatus.baseUrl ? "default" : "destructive"}>
                  {envStatus.baseUrl ? "✅" : "❌"}
                </Badge>
              </div>
            </div>

            <div className="border-t pt-3">
              <details className="text-xs">
                <summary className="cursor-pointer font-medium mb-2">
                  📋 모든 환경 변수 값
                </summary>
                <div className="space-y-1">
                  {Object.entries(allEnvVars).map(([key, value]) => (
                    <div key={key} className="bg-muted p-2 rounded">
                      <div className="font-mono text-xs">{key}</div>
                      <div className="text-xs text-muted-foreground break-all">
                        {value ? `${value.substring(0, 20)}...` : 'undefined'}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>

            <div className="border-t pt-3 space-y-2">
              <Button
                onClick={() => {
                  fetch('/api/test-connection')
                    .then(res => res.json())
                    .then(data => {
                      console.log('🔍 연결 테스트 결과:', data)
                      alert(`연결 테스트: ${data.success ? '성공' : '실패'}\n${data.message}`)
                    })
                    .catch(err => {
                      console.error('❌ 연결 테스트 오류:', err)
                      alert('연결 테스트 중 오류 발생')
                    })
                }}
                size="sm"
                className="w-full"
              >
                🔍 연결 테스트
              </Button>
              
              <Button
                onClick={() => {
                  const userId = prompt('테스트 프로필을 생성할 사용자 ID를 입력하세요:')
                  if (userId) {
                    fetch('/api/create-test-profile', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId })
                    })
                    .then(res => res.json())
                    .then(data => {
                      console.log('🔧 테스트 프로필 생성 결과:', data)
                      alert(`테스트 프로필 생성: ${data.success ? '성공' : '실패'}\n${data.message}`)
                    })
                    .catch(err => {
                      console.error('❌ 테스트 프로필 생성 오류:', err)
                      alert('테스트 프로필 생성 중 오류 발생')
                    })
                  }
                }}
                size="sm"
                variant="outline"
                className="w-full"
              >
                🔧 테스트 프로필 생성
              </Button>
              
              <Button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/auth-status')
                    const data = await response.json()
                    
                    if (data.success) {
                      if (data.hasSession) {
                        const session = data.session
                        alert(`🔐 인증 상태:\n사용자 ID: ${session.userId}\n이메일: ${session.email}\n만료: ${session.isExpired ? '만료됨' : '유효함'}\n만료 시간: ${session.expiresAtFormatted}`)
                      } else {
                        alert('⚠️ 유효한 인증 세션이 없습니다.')
                      }
                    } else {
                      alert(`❌ 인증 상태 확인 실패:\n${data.error}`)
                    }
                  } catch (err) {
                    console.error('❌ 인증 상태 확인 오류:', err)
                    alert('인증 상태 확인 중 오류 발생')
                  }
                }}
                size="sm"
                variant="outline"
                className="w-full"
              >
                🔐 인증 상태 확인
              </Button>
              
              <Button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/check-tables')
                    const data = await response.json()
                    
                    if (data.success) {
                      const requiredTables = data.requiredTables
                      const missingTables = requiredTables.filter(t => !t.exists).map(t => t.tableName)
                      
                      if (missingTables.length === 0) {
                        alert('✅ 모든 필수 테이블이 존재합니다!')
                      } else {
                        alert(`⚠️ 누락된 테이블:\n${missingTables.join('\n')}\n\n📋 전체 테이블 목록은 콘솔을 확인하세요.`)
                        console.log('📋 전체 테이블 목록:', data.allTables)
                      }
                    } else {
                      alert(`❌ 테이블 확인 실패:\n${data.error}`)
                    }
                  } catch (err) {
                    console.error('❌ 테이블 확인 오류:', err)
                    alert('테이블 확인 중 오류 발생')
                  }
                }}
                size="sm"
                variant="outline"
                className="w-full"
              >
                🗄️ 테이블 상태 확인
              </Button>
              
              <Button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/setup-database', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'create_content_history' })
                    })
                    const data = await response.json()
                    
                    if (data.success) {
                      alert('✅ content_history 테이블이 정상적으로 설정되었습니다!')
                    } else if (data.code === 'TABLE_MISSING') {
                      alert(`⚠️ 테이블 생성이 필요합니다:\n\n${data.solution}`)
                      console.log('🔧 SQL 실행 방법:', data.solution)
                    } else {
                      alert(`❌ 데이터베이스 설정 실패:\n${data.error}`)
                    }
                  } catch (err) {
                    console.error('❌ 데이터베이스 설정 오류:', err)
                    alert('데이터베이스 설정 중 오류 발생')
                  }
                }}
                size="sm"
                variant="outline"
                className="w-full"
              >
                🔧 content_history 테이블 생성
              </Button>
              
              <Button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/setup-database', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'create_all_tables' })
                    })
                    const data = await response.json()
                    
                    if (data.success) {
                      alert('✅ 모든 필수 테이블이 성공적으로 생성되었습니다!')
                    } else if (data.code === 'TABLES_MISSING') {
                      alert(`⚠️ 테이블 생성이 필요합니다:\n\n${data.solution}`)
                      console.log('🔧 SQL 실행 방법:', data.solution)
                    } else {
                      alert(`❌ 데이터베이스 설정 실패:\n${data.error}`)
                    }
                  } catch (err) {
                    console.error('❌ 데이터베이스 설정 오류:', err)
                    alert('데이터베이스 설정 중 오류 발생')
                  }
                }}
                size="sm"
                variant="outline"
                className="w-full"
              >
                🗄️ 모든 테이블 생성
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
