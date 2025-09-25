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

  // Atomic state update function
  const updateAuthState = useCallback(async (validation: AuthValidationResult) => {
    if (!mounted.current) return
    
    console.log('🔄 Updating auth state:', validation.status)
    
    setAuthState({
      user: validation.user,
      session: validation.session,
      isValid: validation.isValid,
      isLoading: false,
      lastValidated: new Date(),
      validationStatus: validation.status
    })
    
    // Handle recovery actions
    if (validation.shouldClearCookies) {
      console.log('🧹 Clearing corrupted cookies')
      clearAuthCookies()
    }
  }, [])

  // Comprehensive authentication validation
  const validateAuth = useCallback(async (): Promise<AuthValidationResult> => {
    const validation = await validateAuthenticationState()
    await updateAuthState(validation)
    return validation
  }, [updateAuthState])

  // Refresh session manually
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const { success, session: newSession } = await refreshAuthSession()
      
      if (success && newSession) {
        // Validate the new session
        const validation = await validateAuthenticationState()
        await updateAuthState(validation)
        return validation.isValid
      }
      
      return false
    } catch (error) {
      console.error('Manual session refresh failed:', error)
      return false
    }
  }, [updateAuthState])

  // Initial authentication setup
  useEffect(() => {
    mounted.current = true
    
    const initializeAuth = async () => {
      console.log('🚀 Initializing robust authentication...')
      await validateAuth()
    }
    
    initializeAuth()
    
    // Listen for auth state changes from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current) return
      
      console.log('🔑 Auth event:', event, !!session)
      
      // Re-validate after any auth state change
      setTimeout(() => validateAuth(), 100)
    })
    
    return () => {
      mounted.current = false
      subscription.unsubscribe()
    }
  }, [validateAuth])

  // Proactive health monitoring
  useEffect(() => {
    if (!authState.session || !authState.isValid) {
      // Clear intervals if no valid session
      if (healthCheckInterval.current) clearInterval(healthCheckInterval.current)
      if (refreshCheckInterval.current) clearInterval(refreshCheckInterval.current)
      return
    }
    
    // Health check every 5 minutes
    healthCheckInterval.current = setInterval(async () => {
      if (!mounted.current) return
      
      console.log('🏥 Running periodic health check...')
      await validateAuth()
    }, 5 * 60 * 1000)
    
    // Refresh check every minute (check if token needs refresh)
    refreshCheckInterval.current = setInterval(async () => {
      if (!mounted.current || !authState.session) return
      
      if (isTokenNearExpiry(authState.session)) {
        console.log('🔄 Token near expiry, refreshing...')
        await refreshSession()
      }
    }, 60 * 1000)
    
    return () => {
      if (healthCheckInterval.current) clearInterval(healthCheckInterval.current)
      if (refreshCheckInterval.current) clearInterval(refreshCheckInterval.current)
    }
  }, [authState.session, authState.isValid, validateAuth, refreshSession])

  const isAuthenticated = authState.isValid && !!authState.user && !!authState.session

  // Sign up with email/password
  const signUp = async (data: {
    email: string
    password: string
    displayName?: string
    preferredPosition?: string
    location?: string
  }) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))
      
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

      // Validate the new auth state
      await validateAuth()
      return { success: true }
    } catch (error) {
      console.error('Sign up error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  // Sign in with email/password
  const signIn = async (data: { email: string; password: string }) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        console.error('Sign in error:', error)
        setAuthState(prev => ({ ...prev, isLoading: false }))
        
        // Return user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Invalid email or password. Please try again.' }
        }
        if (error.message.includes('Email not confirmed')) {
          return { success: false, error: 'Please confirm your email before signing in.' }
        }
        
        return { success: false, error: error.message }
      }

      // Validate the new auth state
      await validateAuth()
      return { success: true }
    } catch (error: any) {
      console.error('Sign in error:', error)
      setAuthState(prev => ({ ...prev, isLoading: false }))
      
      // Handle network errors
      if (error?.message?.includes('fetch')) {
        return { success: false, error: 'Network error. Please check your connection.' }
      }
      
      return { success: false, error: 'An unexpected error occurred. Please try again.' }
    } finally {
      // Ensure loading state is cleared
      setAuthState(prev => ({ ...prev, isLoading: false }))
    }
  }

  // Sign in with OAuth
  const signInWithOAuth = async (provider: 'google' | 'github' | 'discord') => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))
      
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
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))
      
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Sign out error:', error)
        return { success: false, error: error.message }
      }

      // Clear all auth state
      setAuthState({
        user: null,
        session: null,
        isValid: false,
        isLoading: false,
        lastValidated: null,
        validationStatus: 'signed_out'
      })
      
      // Clear cookies as well
      clearAuthCookies()

      return { success: true }
    } catch (error) {
      console.error('Sign out error:', error)
      return { success: false, error: 'An unexpected error occurred' }
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
    // State
    user: authState.user,
    session: authState.session,
    isLoading: authState.isLoading,
    isAuthenticated,
    isValid: authState.isValid,
    lastValidated: authState.lastValidated,
    
    // Actions
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    resetPassword,
    
    // Advanced
    validateAuth,
    refreshSession,
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