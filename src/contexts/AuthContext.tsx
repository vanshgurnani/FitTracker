import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as AuthUser, Session } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'
import { supabase, User } from '@/lib/supabase'

interface AuthContextType {
  user: AuthUser | null
  userProfile: User | null
  session: Session | null
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  updateProfile: (updates: Partial<User>) => Promise<{ error: any }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)

  // 🔹 Load user + profile from localStorage on refresh
  useEffect(() => {
    const storedUser = localStorage.getItem("authUser")
    const storedProfile = localStorage.getItem("authProfile")

    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    if (storedProfile) {
      setUserProfile(JSON.parse(storedProfile))
    }
  }, [])

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const profile = await fetchUserProfile(user.id)
      setUserProfile(profile)
      // 🔹 Update localStorage whenever profile refreshes
      localStorage.setItem("authProfile", JSON.stringify(profile))
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        return { error }
      }

      if (data.session && data.user) {
        setSession(data.session)
        setUser(data.user)
        const profile = await fetchUserProfile(data.user.id)
        setUserProfile(profile)

        // 🔹 Save to localStorage
        localStorage.setItem("authUser", JSON.stringify(data.user))
        localStorage.setItem("authProfile", JSON.stringify(profile))
      }

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error }
      }

      if (data.session && data.user) {
        setSession(data.session)
        setUser(data.user)
        const profile = await fetchUserProfile(data.user.id)
        setUserProfile(profile)

        // 🔹 Save to localStorage
        localStorage.setItem("authUser", JSON.stringify(data.user))
        localStorage.setItem("authProfile", JSON.stringify(profile))
      }

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        return { error }
      }
      setSession(null)
      setUser(null)
      setUserProfile(null)

      // 🔹 Clear from localStorage
      localStorage.removeItem("authUser")
      localStorage.removeItem("authProfile")

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!user) {
        return { error: new Error('No user logged in') }
      }

      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        return { error }
      }

      setUserProfile(data)
      // 🔹 Update localStorage
      localStorage.setItem("authProfile", JSON.stringify(data))

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const value: AuthContextType = {
    user,
    userProfile,
    session,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Protected Route Component
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const navigate = useNavigate()

  React.useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
    }
  }, [user, navigate])

  if (!user) {
    return null
  }

  return <>{children}</>
}
