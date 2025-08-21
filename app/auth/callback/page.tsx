"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("인증 콜백 오류:", error)
          router.push("/login?error=auth_callback_failed")
          return
        }

        if (data.session) {
          // 사용자 프로필이 있는지 확인
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single()

          if (profileError && profileError.code === 'PGRST116') {
            // 프로필이 없으면 생성 (구글 로그인으로 처음 가입한 경우)
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: data.session.user.id,
                email: data.session.user.email!,
                name: data.session.user.user_metadata?.name || data.session.user.email?.split('@')[0] || '사용자',
                credits: 10,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })

            if (insertError) {
              console.error("프로필 생성 오류:", insertError)
              router.push("/login?error=profile_creation_failed")
              return
            }

            // 환영 보너스 크레딧 트랜잭션 추가
            await supabase
              .from('credit_transactions')
              .insert({
                user_id: data.session.user.id,
                type: 'bonus',
                amount: 10,
                description: '구글 로그인 환영 보너스',
                created_at: new Date().toISOString()
              })
          }

          // 구글 로그인 성공 시 대시보드로 이동
          console.log('🚀 구글 로그인 성공, 대시보드로 이동합니다...')
          router.push("/dashboard")
        } else {
          router.push("/login")
        }
      } catch (error) {
        console.error("인증 콜백 처리 중 오류:", error)
        router.push("/login?error=unknown_error")
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>인증 처리 중...</p>
      </div>
    </div>
  )
}
