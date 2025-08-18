"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

interface User {
  id: string
  email: string
  name: string
  credits: number
}

interface CreditTransaction {
  id: string
  type: "purchase" | "usage" | "bonus"
  amount: number
  description: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string, name: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  deductCredits: (amount: number, description: string) => boolean
  addCredits: (amount: number, description: string) => void
  getCreditHistory: () => CreditTransaction[]
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [creditHistory, setCreditHistory] = useState<CreditTransaction[]>([])

  useEffect(() => {
    // Check for existing user in localStorage
    const savedUser = localStorage.getItem("content-maestro-user")
    const savedHistory = localStorage.getItem("content-maestro-credit-history")

    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    if (savedHistory) {
      setCreditHistory(JSON.parse(savedHistory))
    }
    setIsLoading(false)
  }, [])

  const deductCredits = (amount: number, description: string): boolean => {
    if (!user || user.credits < amount) {
      return false
    }

    const updatedUser = { ...user, credits: user.credits - amount }
    const transaction: CreditTransaction = {
      id: Date.now().toString(),
      type: "usage",
      amount: -amount,
      description,
      createdAt: new Date().toISOString(),
    }

    setUser(updatedUser)
    const newHistory = [transaction, ...creditHistory]
    setCreditHistory(newHistory)

    localStorage.setItem("content-maestro-user", JSON.stringify(updatedUser))
    localStorage.setItem("content-maestro-credit-history", JSON.stringify(newHistory))

    return true
  }

  const addCredits = (amount: number, description: string) => {
    if (!user) return

    const updatedUser = { ...user, credits: user.credits + amount }
    const transaction: CreditTransaction = {
      id: Date.now().toString(),
      type: "purchase",
      amount,
      description,
      createdAt: new Date().toISOString(),
    }

    setUser(updatedUser)
    const newHistory = [transaction, ...creditHistory]
    setCreditHistory(newHistory)

    localStorage.setItem("content-maestro-user", JSON.stringify(updatedUser))
    localStorage.setItem("content-maestro-credit-history", JSON.stringify(newHistory))
  }

  const getCreditHistory = (): CreditTransaction[] => {
    return creditHistory
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock successful login
    const mockUser: User = {
      id: "1",
      email,
      name: email.split("@")[0],
      credits: 10, // Free credits for new users
    }

    setUser(mockUser)
    localStorage.setItem("content-maestro-user", JSON.stringify(mockUser))
    setIsLoading(false)
    return true
  }

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock successful signup
    const mockUser: User = {
      id: "1",
      email,
      name,
      credits: 10, // Free credits for new users
    }

    const welcomeTransaction: CreditTransaction = {
      id: Date.now().toString(),
      type: "bonus",
      amount: 10,
      description: "회원가입 환영 보너스",
      createdAt: new Date().toISOString(),
    }

    setUser(mockUser)
    setCreditHistory([welcomeTransaction])
    localStorage.setItem("content-maestro-user", JSON.stringify(mockUser))
    localStorage.setItem("content-maestro-credit-history", JSON.stringify([welcomeTransaction]))
    setIsLoading(false)
    return true
  }

  const logout = () => {
    setUser(null)
    setCreditHistory([])
    localStorage.removeItem("content-maestro-user")
    localStorage.removeItem("content-maestro-credit-history")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
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
