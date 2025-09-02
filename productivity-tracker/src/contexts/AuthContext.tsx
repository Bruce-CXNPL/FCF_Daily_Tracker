'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  name: string
  email: string
  access_level: 'ops' | 'admin'
  staff_id?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAdmin: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
    
    // Listen for auth state changes but only for sign out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // User signed out, clear data
        setUser(null)
        localStorage.removeItem('user')
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    try {
      // Don't set loading if we already have user data
      if (!user) {
        setIsLoading(true)
      }
      
      // Add a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      )
      
      // Check if we have a session
      const sessionResult = await Promise.race([
        supabase.auth.getSession(),
        timeoutPromise
      ]).catch(() => ({ data: { session: null } })) as { data: { session: any } }
      
      const session = sessionResult.data.session
      
      if (session?.user) {
        // Get user data from our users table with timeout
        const userResult = await Promise.race([
          supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single(),
          timeoutPromise
        ]).catch((err) => ({ data: null, error: err })) as { data: any, error: any }
        
        const userData = userResult.data
        const error = userResult.error

        if (error) {
          console.error('Error fetching user data:', error)
          
          // If user doesn't exist in our table, try to create it
          if (error.code === 'PGRST116') { // No rows returned
            try {
              console.log('Creating missing user record...')
              const { data: newUserData, error: insertError } = await supabase
                .from('users')
                .insert({
                  id: session.user.id,
                  email: session.user.email!,
                  name: session.user.user_metadata?.name || session.user.email!.split('@')[0],
                  access_level: session.user.user_metadata?.access_level || 'ops',
                  is_verified: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .select()
                .single()

              if (insertError) {
                console.error('Error creating user record:', insertError)
                await supabase.auth.signOut()
                setUser(null)
                return
              }

              if (newUserData) {
                const userInfo: User = {
                  id: newUserData.id,
                  name: newUserData.name,
                  email: newUserData.email,
                  access_level: newUserData.access_level,
                  staff_id: newUserData.staff_id
                }
                setUser(userInfo)
                localStorage.setItem('user', JSON.stringify(userInfo))
              }
            } catch (createError) {
              console.error('Failed to create user record:', createError)
              await supabase.auth.signOut()
              setUser(null)
            }
          } else {
            // Other error, sign them out
            await supabase.auth.signOut()
            setUser(null)
          }
        } else if (userData) {
          const userInfo: User = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            access_level: userData.access_level,
            staff_id: userData.staff_id
          }
          setUser(userInfo)
          localStorage.setItem('user', JSON.stringify(userInfo))
        }
      } else {
        // No session, check localStorage for quick access
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser)
            // Verify the stored user still has a valid session
            const { data: { session: verifySession } } = await supabase.auth.getSession()
            if (!verifySession) {
              localStorage.removeItem('user')
              setUser(null)
            } else {
              setUser(parsedUser)
            }
          } catch {
            localStorage.removeItem('user')
            setUser(null)
          }
        } else {
          setUser(null)
        }
      }
    } catch (error) {
      console.error('Error checking user:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      // Clear user state immediately
      setUser(null)
      setIsLoading(false)
      
      // Clear all local storage
      localStorage.clear()
      sessionStorage.clear()
      
      // Sign out from Supabase with scope 'local' to clear all sessions
      await supabase.auth.signOut({ scope: 'local' })
      
      // Force a complete page reload to clear any cached state
      window.location.replace('/auth/login')
    } catch (error) {
      console.error('Error signing out:', error)
      // Even if signOut fails, clear everything and redirect
      setUser(null)
      localStorage.clear()
      sessionStorage.clear()
      window.location.replace('/auth/login')
    }
  }

  const refreshUser = async () => {
    await checkUser()
  }

  const value = {
    user,
    isLoading,
    isAdmin: user?.access_level === 'admin',
    signOut,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
