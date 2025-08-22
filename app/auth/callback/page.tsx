"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('인증 처리 중...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setMessage('세션 확인 중...')
        
        // URL에서 세션 정보 확인
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("인증 콜백 오류:", error)
          setStatus('error')
          setMessage('인증 처리 중 오류가 발생했습니다.')
          setTimeout(() => {
            router.push("/login?error=auth_callback_failed")
          }, 2000)
          return
        }

        if (session) {
          console.log('✅ 유효한 세션 발견:', session.user.id)
          setMessage('사용자 프로필 확인 중...')
          
          // 사용자 프로필이 있는지 확인
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profileError && profileError.code === 'PGRST116') {
            setMessage('새 사용자 프로필 생성 중...')
            // 프로필이 없으면 생성 (구글 로그인으로 처음 가입한 경우)
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '사용자',
                credits: 10,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })

            if (insertError) {
              console.error("프로필 생성 오류:", insertError)
              setStatus('error')
              setMessage('프로필 생성에 실패했습니다.')
              setTimeout(() => {
                router.push("/login?error=profile_creation_failed")
              }, 2000)
              return
            }

            // 환영 보너스 크레딧 트랜잭션 추가
            try {
              await supabase
                .from('credit_transactions')
                .insert({
                  user_id: session.user.id,
                  type: 'bonus',
                  amount: 10,
                  description: '구글 로그인 환영 보너스',
                  created_at: new Date().toISOString()
                })
              console.log('✅ 환영 보너스 크레딧 추가 완료')
            } catch (creditError) {
              console.error('크레딧 추가 실패 (치명적이지 않음):', creditError)
            }
          } else if (profile) {
            console.log('✅ 기존 프로필 발견:', profile.name)
          }

          // 구글 로그인 성공 시 대시보드로 이동
          console.log('🚀 구글 로그인 성공, 대시보드로 이동합니다...')
          setStatus('success')
          setMessage('로그인 성공! 대시보드로 이동합니다...')
          
          // 잠시 후 대시보드로 이동 (사용자가 메시지를 볼 수 있도록)
          setTimeout(() => {
            router.push("/dashboard")
          }, 1500)
        } else {
          console.log('⚠️ 세션을 찾을 수 없습니다.')
          setStatus('error')
          setMessage('세션을 찾을 수 없습니다. 다시 로그인해주세요.')
          setTimeout(() => {
            router.push("/login")
          }, 2000)
        }
      } catch (error) {
        console.error("인증 콜백 처리 중 오류:", error)
        setStatus('error')
        setMessage('알 수 없는 오류가 발생했습니다.')
        setTimeout(() => {
          router.push("/login?error=unknown_error")
        }, 2000)
      }
    }

    // 약간의 지연 후 처리 시작 (URL 파라미터 처리를 위해)
    const timer = setTimeout(() => {
      handleAuthCallback()
    }, 100)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className={`rounded-full h-16 w-16 mx-auto mb-6 flex items-center justify-center ${
          status === 'loading' ? 'bg-blue-100' : 
          status === 'success' ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {status === 'loading' && (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          )}
          {status === 'success' && (
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {status === 'error' && (
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <h2 className="text-xl font-semibold mb-2">
          {status === 'loading' ? '인증 처리 중' : 
           status === 'success' ? '로그인 성공!' : '오류 발생'}
        </h2>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}
