/**
 * Robust Supabase Authentication Provider
 * 
 * Advanced authentication system with:
 * - Atomic state management (no split-brain issues)
 * - Proactive health monitoring
 * - Automatic token refresh and recovery
 * - Consistent frontend/backend authentication state
 */

'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, clearAuthCookies, isInvalidJWTError } from '@/lib/supabase/client'
import { 
  validateAuthenticationState, 
  validateSessionHealth, 
  isTokenNearExpiry, 
  refreshAuthSession,
  AuthValidationResult 
} from '@/lib/auth/validator'

interface AuthState {
  user: User | null
  session: Session | null
  isValid: boolean
  isLoading: boolean
  lastValidated: Date | null
  validationStatus: string
}

interface AuthContextType {
  // State
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  isValid: boolean
  lastValidated: Date | null
  
  // Actions
  signUp: (data: {
    email: string
    password: string
    displayName?: string
    preferredPosition?: string
    location?: string
  }) => Promise<{ success: boolean; error?: string }>
  signIn: (data: {
    email: string
    password: string
  }) => Promise<{ success: boolean; error?: string }>
  signInWithOAuth: (provider: 'google' | 'github' | 'discord') => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<{ success: boolean; error?: string }>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  
  // Advanced
  validateAuth: () => Promise<AuthValidationResult>
  refreshSession: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Atomic authentication state
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isValid: false,
    isLoading: true,
    lastValidated: null,
    validationStatus: 'initial'
  })
  
  // Refs for cleanup
  const mounted = useRef(true)
  const healthCheckInterval = useRef<NodeJS.Timeout>()
  const refreshCheckInterval = useRef<NodeJS.Timeout>()

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔑 Getting initial session...')
        
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (error) {
          console.error('🔑 Session error:', error)
          
          // Check if this is an invalid JWT error
          if (isInvalidJWTError(error) && !authRecoveryAttempted) {
            console.log('🚨 Invalid JWT detected - clearing corrupted cookies and resetting auth state')
            setAuthRecoveryAttempted(true)
            clearAuthCookies()
            
            // Reset auth state cleanly
            setSession(null)
            setUser(null)
            
            // Try to get session again after clearing cookies
            setTimeout(() => {
              if (mounted) {
                console.log('🔄 Retrying session after cookie cleanup...')
                supabase.auth.getSession().then(({ data: { session: retrySession }, error: retryError }) => {
                  if (mounted && !retryError) {
                    console.log('🔑 Retry session result:', !!retrySession)
                    setSession(retrySession)
                    setUser(retrySession?.user ?? null)
                  }
                })
              }
            }, 100)
          }
        } else {
          console.log('🔑 Initial session:', !!initialSession, initialSession?.user?.email)
          setSession(initialSession)
          setUser(initialSession?.user ?? null)
        }
      } catch (error) {
        console.error('🔑 Error getting initial session:', error)
        
        // Check if this is an invalid JWT error in the catch block too
        if (isInvalidJWTError(error) && !authRecoveryAttempted) {
          console.log('🚨 Invalid JWT detected in catch - clearing corrupted cookies')
          setAuthRecoveryAttempted(true)
          clearAuthCookies()
        }
        
        if (mounted) {
          setSession(null)
          setUser(null)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔑 Auth state change:', event, !!session, session?.user?.email)
        
        if (!mounted) return

        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const isAuthenticated = !!user && !!session

  // Sign up with email/password
  const signUp = async (data: {
    email: string
    password: string
    displayName?: string
    preferredPosition?: string
    location?: string
  }) => {
    try {
      setIsLoading(true)
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            display_name: data.displayName || '',
            preferred_position: data.preferredPosition || '',
            location: data.location || ''
          }
        }
      })

      if (error) {
        console.error('Sign up error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Sign up error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      setIsLoading(false)
    }
  }

  // Sign in with email/password
  const signIn = async (data: { email: string; password: string }) => {
    try {
      setIsLoading(true)
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        console.error('Sign in error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      setIsLoading(false)
    }
  }

  // Sign in with OAuth
  const signInWithOAuth = async (provider: 'google' | 'github' | 'discord') => {
    try {
      setIsLoading(true)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) {
        console.error('OAuth sign in error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('OAuth sign in error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      setIsLoading(false)
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      setIsLoading(true)
      
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Sign out error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Sign out error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      setIsLoading(false)
    }
  }

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        console.error('Password reset error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Password reset error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Export a helper for getting session in client components
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Error getting session:', error)
      return null
    }
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}