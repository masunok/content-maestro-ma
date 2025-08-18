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
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          await fetchUserProfile(session.user.id)
        }
        setIsLoading(false)
      } catch (error) {
        console.error("세션 확인 오류:", error)
        setIsLoading(false)
      }
    }

    getSession()

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          await fetchUserProfile(session.user.id)
        } else {
          setUser(null)
        }
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('프로필 조회 오류:', error)
        return
      }

      setUser(data)
    } catch (error) {
      console.error('프로필 조회 중 오류:', error)
    }
  }

  const createUserProfile = async (userId: string, email: string, name: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email,
          name,
          credits: 10, // 회원가입 시 무료 크레딧
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('프로필 생성 오류:', error)
        return false
      }

      // 환영 보너스 크레딧 트랜잭션 추가
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          type: 'bonus',
          amount: 10,
          description: '회원가입 환영 보너스',
          created_at: new Date().toISOString()
        })

      return true
    } catch (error) {
      console.error('프로필 생성 중 오류:', error)
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
        return false
      }

      if (data.user) {
        // 사용자 프로필 생성
        const profileCreated = await createUserProfile(data.user.id, email, name)
        if (profileCreated) {
          await fetchUserProfile(data.user.id)
          return true
        }
      }

      return false
    } catch (error) {
      console.error('회원가입 중 오류:', error)
      return false
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error('구글 로그인 오류:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('구글 로그인 중 오류:', error)
      return false
    } finally {
      setIsLoading(false)
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
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('로그아웃 오류:', error)
      }
      // 상태 완전 초기화
      setUser(null)
      // 로컬 스토리지도 정리 (혹시 모를 데이터)
      localStorage.removeItem("content-maestro-user")
      localStorage.removeItem("content-maestro-credit-history")
    } catch (error) {
      console.error('로그아웃 중 오류:', error)
      // 에러가 발생해도 로컬 상태는 정리
      setUser(null)
      localStorage.removeItem("content-maestro-user")
      localStorage.removeItem("content-maestro-credit-history")
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
