"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Database } from './supabase'

type Profile = Database['public']['Tables']['profiles']['Row']
type CreditTransaction = Database['public']['Tables']['credit_transactions']['Row']

interface User extends Profile {
  // Profile과 동일한 구조
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string, name: string) => Promise<boolean>
  loginWithGoogle: () => Promise<boolean>
  logout: () => Promise<void>
  isLoading: boolean
  deductCredits: (amount: number, description: string) => Promise<boolean>
  addCredits: (amount: number, description: string) => Promise<void>
  getCreditHistory: () => Promise<CreditTransaction[]>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Supabase 환경 변수 확인
const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Supabase가 설정되지 않은 경우 mock 사용자 로드
      console.log('⚠️ Supabase 환경 변수가 설정되지 않았습니다. Mock 모드로 실행됩니다.')
      const savedUser = localStorage.getItem("content-maestro-user")
      if (savedUser) {
        setUser(JSON.parse(savedUser))
      }
      setIsLoading(false)
      return
    }

    // 현재 세션 확인
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('❌ 세션 조회 오류:', error)
          setIsLoading(false)
          return
        }

        if (session) {
          console.log('🔐 유효한 세션 발견:', session.user.id)
          await fetchUserProfile(session.user.id)
        } else {
          console.log('⚠️ 세션이 없습니다.')
          setUser(null)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('❌ 세션 조회 중 오류:', error)
        setUser(null)
        setIsLoading(false)
      }
    }

    getSession()

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 인증 상태 변경:', event, session?.user?.id)
        
                 if (event === 'SIGNED_IN' && session?.user) {
           console.log('✅ 사용자 로그인됨:', session.user.id)
           setIsLoading(true)
           
           try {
             // 사용자 프로필 조회
             await fetchUserProfile(session.user.id)
             
             // 로그인 성공 시 대시보드로 자동 이동 (콜백 페이지가 아닌 경우에만)
             if (typeof window !== 'undefined') {
               const currentPath = window.location.pathname
               if ((currentPath === '/login' || currentPath === '/signup' || currentPath === '/') && 
                   !currentPath.includes('/auth/callback')) {
                 // Next.js router를 사용하여 클라이언트 사이드 네비게이션
                 const { useRouter } = require('next/navigation')
                 // router는 useEffect 내부에서 직접 사용할 수 없으므로 
                 // 콜백 페이지에서 처리하도록 함
               }
             }
           } catch (error) {
             console.error('❌ 프로필 조회 실패:', error)
             // 프로필 조회 실패 시 기본 프로필 생성 시도
             try {
               console.log('🔄 기본 프로필 생성 시도...')
               const success = await createUserProfile(
                 session.user.id, 
                 session.user.email || 'unknown@example.com',
                 session.user.user_metadata?.name || session.user.email?.split('@')[0] || '사용자'
               )
               if (success) {
                 await fetchUserProfile(session.user.id)
                 
                 // 프로필 생성 성공 시에도 대시보드로 이동 (콜백 페이지가 아닌 경우에만)
                 if (typeof window !== 'undefined') {
                   const currentPath = window.location.pathname
                   if ((currentPath === '/login' || currentPath === '/signup' || currentPath === '/') && 
                       !currentPath.includes('/auth/callback')) {
                     // Next.js router를 사용하여 클라이언트 사이드 네비게이션
                     // router는 useEffect 내부에서 직접 사용할 수 없으므로 
                     // 콜백 페이지에서 처리하도록 함
                   }
                 }
               } else {
                 // 프로필 생성 실패 시 로딩 상태 해제
                 setIsLoading(false)
               }
             } catch (createError) {
               console.error('❌ 기본 프로필 생성도 실패:', createError)
               setIsLoading(false)
             }
           }
           // fetchUserProfile에서 setIsLoading(false)를 처리하므로 여기서는 하지 않음
         } else if (event === 'SIGNED_OUT') {
          console.log('🚪 사용자 로그아웃됨')
          setUser(null)
          setIsLoading(false)
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 토큰 갱신됨')
          // 토큰 갱신 후 사용자 정보 다시 조회
          if (session?.user) {
            await fetchUserProfile(session.user.id)
          }
        } else {
          console.log('🔍 기타 인증 이벤트:', event)
          setIsLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string, retryCount = 0) => {
    try {
      // 무한 루프 방지
      if (retryCount > 2) {
        console.error('❌ 프로필 조회 재시도 횟수 초과, 로딩 상태 해제')
        setIsLoading(false)
        return
      }

      // 환경 변수 체크
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.')
        console.error('📁 .env.local 파일을 확인하고 ENV_SETUP.md를 참고하세요.')
        setIsLoading(false)
        return
      }

      console.log(`🔍 프로필 조회 시작 (시도 ${retryCount + 1}/3):`, userId)
      console.log('🔧 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('🔧 Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 설정되지 않음')
      
      // Supabase 클라이언트 상태 확인
      console.log('🔧 Supabase 클라이언트:', supabase ? '✅ 생성됨' : '❌ 생성되지 않음')
      
      console.log('🔍 프로필 존재 여부 확인 중...')
      // 먼저 프로필이 존재하는지 확인
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle()

      if (checkError) {
        console.error('❌ 프로필 존재 여부 확인 오류:', checkError)
        console.error('🔧 오류 코드:', checkError.code)
        console.error('🔧 오류 메시지:', checkError.message)
        setIsLoading(false)
        return
      }

      console.log('🔍 프로필 존재 여부 확인 결과:', existingProfile ? '존재함' : '존재하지 않음')

      if (!existingProfile) {
        console.log('⚠️ 프로필이 존재하지 않습니다. 새로 생성합니다.')
        // 프로필이 존재하지 않으면 새로 생성
        const success = await createUserProfile(userId, 'unknown@example.com', '사용자')
        if (success) {
          console.log('🔄 프로필 생성 성공, 다시 조회 시도...')
          // 생성 후 다시 조회 (재시도 횟수 증가)
          await fetchUserProfile(userId, retryCount + 1)
        } else {
          console.log('❌ 프로필 생성 실패, 간단한 프로필로 대체 시도...')
          // 간단한 프로필로 대체
          try {
            const simpleProfile = {
              id: userId,
              email: 'unknown@example.com',
              name: '사용자',
              credits: 10,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            console.log('🔄 간단한 프로필로 사용자 상태 설정...')
            setUser(simpleProfile)
            setIsLoading(false)
            console.log('✅ 간단한 프로필로 대시보드 로드 완료')
          } catch (simpleError) {
            console.error('❌ 간단한 프로필 설정도 실패:', simpleError)
            setIsLoading(false)
          }
        }
        return
      }

      console.log('🔍 기존 프로필 발견, 전체 정보 조회 중...')
      // 프로필이 존재하면 전체 정보 조회 (maybeSingle 사용으로 더 안전하게)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('❌ 프로필 조회 오류:', error)
        console.error('🔧 오류 코드:', error.code)
        console.error('🔧 오류 메시지:', error.message)
        console.error('🔧 오류 세부사항:', error.details)
        console.error('🔧 오류 힌트:', error.hint)
        setIsLoading(false)
        return
      }

      if (!data) {
        console.log('⚠️ 프로필 데이터가 없습니다. 새로 생성합니다.')
        // 프로필이 없으면 새로 생성
        const success = await createUserProfile(userId, 'unknown@example.com', '사용자')
        if (success) {
          console.log('🔄 프로필 생성 성공, 다시 조회 시도...')
          // 생성 후 다시 조회 (재시도 횟수 증가)
          await fetchUserProfile(userId, retryCount + 1)
        } else {
          console.log('❌ 프로필 생성 실패, 간단한 프로필로 대체 시도...')
          // 간단한 프로필로 대체
          try {
            const simpleProfile = {
              id: userId,
              email: 'unknown@example.com',
              name: '사용자',
              credits: 10,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            console.log('🔄 간단한 프로필로 사용자 상태 설정...')
            setUser(simpleProfile)
            setIsLoading(false)
            console.log('✅ 간단한 프로필로 대시보드 로드 완료')
          } catch (simpleError) {
            console.error('❌ 간단한 프로필 설정도 실패:', simpleError)
            setIsLoading(false)
          }
        }
        return
      }

      console.log('✅ 프로필 조회 성공:', data)
      console.log('🔄 사용자 상태 업데이트 중...')
      setUser(data)
      console.log('🔄 로딩 상태 해제 중...')
      setIsLoading(false)
      console.log('✅ 모든 상태 업데이트 완료')
    } catch (error) {
      console.error('❌ 프로필 조회 중 예외 발생:', error)
      if (error instanceof Error) {
        console.error('🔧 오류 메시지:', error.message)
        console.error('🔧 오류 스택:', error.stack)
      }
      console.log('❌ 예외 발생으로 로딩 상태 해제')
      setIsLoading(false)
    }
  }

  const createUserProfile = async (userId: string, email: string, name: string) => {
    try {
      console.log('🔧 프로필 생성 시작:', { userId, email, name })
      
      console.log('🔧 SECURITY DEFINER 함수 호출 시도...')
      // SECURITY DEFINER 함수를 사용하여 프로필 생성 (RLS 우회)
      const { data: profileResult, error: profileError } = await supabase
        .rpc('create_or_update_user_profile', {
          p_user_id: userId,
          p_email: email,
          p_name: name,
          p_credits: 10
        })
      
      if (profileError) {
        console.error('❌ SECURITY DEFINER 함수 호출 실패:', profileError)
        console.error('🔧 오류 코드:', profileError.code)
        console.error('🔧 오류 메시지:', profileError.message)
        
        console.log('🔄 백업 방법: 직접 프로필 생성 시도...')
        // 백업 방법: 직접 프로필 생성 시도 (RLS 정책이 허용하는 경우)
        try {
          const { error: directProfileError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email,
              name,
              credits: 10,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (directProfileError) {
            console.error('❌ 직접 프로필 생성도 실패:', directProfileError)
            console.error('🔧 오류 코드:', directProfileError.code)
            console.error('🔧 오류 메시지:', directProfileError.message)
            throw directProfileError
          }
          
          console.log('✅ 백업 방법으로 프로필 생성 성공')
        } catch (directError) {
          console.error('❌ 모든 프로필 생성 방법 실패:', directError)
          throw profileError // 원래 에러를 던짐
        }
      } else if (!profileResult) {
        console.error('❌ 프로필 생성 함수가 false 반환')
        throw new Error('프로필 생성 함수가 실패했습니다')
      } else {
        console.log('✅ SECURITY DEFINER 함수로 프로필 생성 성공')
      }

      console.log('🔧 환영 보너스 크레딧 트랜잭션 추가 시도...')
      // 환영 보너스 크레딧 트랜잭션 추가 (트리거가 이미 처리했지만 백업으로도 시도)
      try {
        const { error: transactionError } = await supabase
          .rpc('add_user_credits', {
            p_user_id: userId,
            p_amount: 10,
            p_description: '회원가입 환영 보너스',
            p_metadata: { type: 'signup_bonus' }
          })

        if (transactionError) {
          console.error('⚠️ 백업 크레딧 트랜잭션 생성 실패 (치명적이지 않음):', transactionError)
        } else {
          console.log('✅ 백업 크레딧 트랜잭션 생성 성공')
        }
      } catch (transactionError) {
        console.error('⚠️ 백업 크레딧 트랜잭션 생성 중 오류 (치명적이지 않음):', transactionError)
      }

      console.log('✅ 프로필 생성 완료')
      return true
    } catch (error) {
      console.error('❌ 프로필 생성 중 오류:', error)
      if (error instanceof Error) {
        console.error('🔧 오류 메시지:', error.message)
        console.error('🔧 오류 스택:', error.stack)
      }
      return false
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    if (!isSupabaseConfigured) {
      // Mock 로그인 (개발용)
      const mockUser: User = {
        id: "mock-user-1",
        email,
        name: email.split("@")[0],
        credits: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setUser(mockUser)
      localStorage.setItem("content-maestro-user", JSON.stringify(mockUser))
      return true
    }

    try {
      setIsLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('로그인 오류:', error)
        return false
      }

      if (data.user) {
        console.log('✅ Supabase 로그인 성공:', data.user.id)
        await fetchUserProfile(data.user.id)
        return true
      }

      return false
    } catch (error) {
      console.error('로그인 중 오류:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    if (!isSupabaseConfigured) {
      // Mock 회원가입 (개발용)
      const mockUser: User = {
        id: "mock-user-1",
        email,
        name,
        credits: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setUser(mockUser)
      localStorage.setItem("content-maestro-user", JSON.stringify(mockUser))
      return true
    }

    try {
      setIsLoading(true)
      
      // 1. 회원가입 시도
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      })

      if (error) {
        console.error('회원가입 오류:', error)
        
        // 이메일 중복 오류인 경우 이메일을 수정하여 재시도
        if (error.message.includes('User already registered')) {
          console.log('이메일 중복 감지, 이메일 수정하여 재시도...')
          
          // 이메일을 수정하여 고유하게 만들기
          const emailParts = email.split('@')
          const localPart = emailParts[0]
          const domainPart = emailParts[1]
          const timestamp = Date.now()
          const modifiedEmail = `${localPart}+${timestamp}@${domainPart}`
          
          console.log(`수정된 이메일: ${email} → ${modifiedEmail}`)
          
          // 수정된 이메일로 재시도
          const { data: retryData, error: retryError } = await supabase.auth.signUp({
            email: modifiedEmail,
            password,
            options: {
              data: {
                name,
                originalEmail: email // 원본 이메일을 메타데이터에 저장
              }
            }
          })
          
          if (retryError) {
            console.error('수정된 이메일로도 회원가입 실패:', retryError)
            throw new Error(`이메일 중복으로 회원가입에 실패했습니다. 다른 이메일을 사용해주세요.`)
          }
          
          if (retryData.user) {
            console.log('수정된 이메일로 회원가입 성공, 사용자 ID:', retryData.user.id)
            
            // 2. 사용자 프로필 생성 (트리거가 자동으로 처리하지만, 백업으로도 시도)
            try {
              await createUserProfile(retryData.user.id, modifiedEmail, name)
              console.log('백업 프로필 생성 성공')
            } catch (profileError) {
              console.error('백업 프로필 생성 실패 (트리거에 의존):', profileError)
              // 프로필 생성 실패는 치명적이지 않음 (트리거가 처리할 수 있음)
            }
            
            // 3. 프로필 정보 가져오기 (트리거 생성된 프로필)
            try {
              await fetchUserProfile(retryData.user.id)
              console.log('프로필 정보 로드 성공')
              
              // 사용자에게 이메일이 수정되었음을 알림
              alert(`회원가입이 완료되었습니다!\n\n원본 이메일: ${email}\n실제 로그인 이메일: ${modifiedEmail}\n\n로그인 시에는 수정된 이메일을 사용해주세요.`)
              
              return true
            } catch (profileFetchError) {
              console.error('프로필 정보 로드 실패:', profileFetchError)
              
              // 프로필 로드 실패 시에도 회원가입은 성공으로 처리
              console.log('회원가입은 성공했지만 프로필 로드에 실패했습니다. 로그인 후 다시 시도해주세요.')
              
              // 사용자에게 이메일이 수정되었음을 알림
              alert(`회원가입이 완료되었습니다!\n\n원본 이메일: ${email}\n실제 로그인 이메일: ${modifiedEmail}\n\n로그인 시에는 수정된 이메일을 사용해주세요.`)
              
              return true
            }
          }
          
          return false
        }
        
        // 구체적인 에러 메시지 처리
        if (error.message.includes('Password should be at least 6 characters')) {
          throw new Error('비밀번호는 최소 6자 이상이어야 합니다.')
        } else if (error.message.includes('Invalid email')) {
          throw new Error('올바른 이메일 형식을 입력해주세요.')
        } else if (error.message.includes('Unable to validate email')) {
          throw new Error('이메일 인증에 실패했습니다. 다시 시도해주세요.')
        } else {
          throw new Error(`회원가입 중 오류가 발생했습니다: ${error.message}`)
        }
      }

      if (data.user) {
        console.log('회원가입 성공, 사용자 ID:', data.user.id)
        
        // 2. 사용자 프로필 생성 (트리거가 자동으로 처리하지만, 백업으로도 시도)
        try {
          await createUserProfile(data.user.id, email, name)
          console.log('백업 프로필 생성 성공')
        } catch (profileError) {
          console.error('백업 프로필 생성 실패 (트리거에 의존):', profileError)
          // 프로필 생성 실패는 치명적이지 않음 (트리거가 처리할 수 있음)
        }
        
        // 3. 프로필 정보 가져오기 (트리거 생성된 프로필)
        try {
          await fetchUserProfile(data.user.id)
          console.log('프로필 정보 로드 성공')
          return true
        } catch (profileFetchError) {
          console.error('프로필 정보 로드 실패:', profileFetchError)
          
          // 프로필 로드 실패 시에도 회원가입은 성공으로 처리
          // 사용자는 로그인 후 프로필을 확인할 수 있음
          console.log('회원가입은 성공했지만 프로필 로드에 실패했습니다. 로그인 후 다시 시도해주세요.')
          return true
        }
      }

      return false
    } catch (error) {
      console.error('회원가입 중 오류:', error)
      throw error // 에러를 상위로 전달하여 UI에서 처리
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithGoogle = async (): Promise<boolean> => {
    if (!isSupabaseConfigured) {
      alert("Supabase가 설정되지 않았습니다. 환경 변수를 확인해주세요.")
      return false
    }

    try {
      setIsLoading(true)
      console.log('🔐 구글 OAuth 로그인 시작...')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })

      if (error) {
        console.error('❌ 구글 로그인 오류:', error)
        setIsLoading(false)
        return false
      }

      if (data) {
        console.log('✅ 구글 OAuth URL 생성 성공:', data.url ? 'URL 생성됨' : 'URL 없음')
        // OAuth 리다이렉트가 시작되면 true 반환
        // 실제 인증은 콜백 페이지에서 처리됨
        return true
      }

      console.log('⚠️ 구글 OAuth 응답에 데이터가 없습니다.')
      setIsLoading(false)
      return false
    } catch (error) {
      console.error('❌ 구글 로그인 중 예외 발생:', error)
      setIsLoading(false)
      return false
    }
  }

  const logout = async (): Promise<void> => {
    if (!isSupabaseConfigured) {
      // Mock 로그아웃
      setUser(null)
      localStorage.removeItem("content-maestro-user")
      localStorage.removeItem("content-maestro-credit-history")
      return
    }

    try {
      // 현재 세션 상태 확인
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        console.log('🔐 유효한 세션 발견, 로그아웃 진행...')
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.error('❌ 로그아웃 오류:', error)
        } else {
          console.log('✅ 로그아웃 성공')
        }
      } else {
        console.log('⚠️ 유효한 세션이 없습니다. 로컬 상태만 정리합니다.')
      }
      
      // 상태 완전 초기화 (세션 상태와 관계없이)
      setUser(null)
      setIsLoading(false)
      
      // 로컬 스토리지도 정리 (혹시 모를 데이터)
      localStorage.removeItem("content-maestro-user")
      localStorage.removeItem("content-maestro-credit-history")
      
      console.log('🧹 로컬 상태 정리 완료')
      
    } catch (error) {
      console.error('❌ 로그아웃 중 오류:', error)
      // 에러가 발생해도 로컬 상태는 정리
      setUser(null)
      setIsLoading(false)
      localStorage.removeItem("content-maestro-user")
      localStorage.removeItem("content-maestro-credit-history")
      console.log('🧹 오류 발생으로 인한 로컬 상태 정리 완료')
    }
  }

  const deductCredits = async (amount: number, description: string): Promise<boolean> => {
    if (!user || user.credits < amount) {
      return false
    }

    if (!isSupabaseConfigured) {
      // Mock 크레딧 차감
      const updatedUser = { ...user, credits: user.credits - amount }
      setUser(updatedUser)
      localStorage.setItem("content-maestro-user", JSON.stringify(updatedUser))
      return true
    }

    try {
      // 크레딧 차감
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          credits: user.credits - amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('크레딧 차감 오류:', updateError)
        return false
      }

      // 트랜잭션 기록
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          type: 'usage',
          amount: -amount,
          description,
          created_at: new Date().toISOString()
        })

      if (transactionError) {
        console.error('트랜잭션 기록 오류:', transactionError)
      }

      // 로컬 상태 업데이트
      setUser(prev => prev ? { ...prev, credits: prev.credits - amount } : null)
      return true
    } catch (error) {
      console.error('크레딧 차감 중 오류:', error)
      return false
    }
  }

  const addCredits = async (amount: number, description: string): Promise<void> => {
    if (!user) return

    if (!isSupabaseConfigured) {
      // Mock 크레딧 추가
      const updatedUser = { ...user, credits: user.credits + amount }
      setUser(updatedUser)
      localStorage.setItem("content-maestro-user", JSON.stringify(updatedUser))
      return
    }

    try {
      // 크레딧 추가
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          credits: user.credits + amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('크레딧 추가 오류:', updateError)
        return
      }

      // 트랜잭션 기록
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          type: 'purchase',
          amount,
          description,
          created_at: new Date().toISOString()
        })

      if (transactionError) {
        console.error('트랜잭션 기록 오류:', transactionError)
      }

      // 로컬 상태 업데이트
      setUser(prev => prev ? { ...prev, credits: prev.credits + amount } : null)
    } catch (error) {
      console.error('크레딧 추가 중 오류:', error)
    }
  }

  const getCreditHistory = async (): Promise<CreditTransaction[]> => {
    if (!user) return []

    if (!isSupabaseConfigured) {
      // Mock 크레딧 히스토리
      const savedHistory = localStorage.getItem("content-maestro-credit-history")
      return savedHistory ? JSON.parse(savedHistory) : []
    }

    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('크레딧 히스토리 조회 오류:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('크레딧 히스토리 조회 중 오류:', error)
      return []
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        loginWithGoogle,
        logout,
        isLoading,
        deductCredits,
        addCredits,
        getCreditHistory,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
