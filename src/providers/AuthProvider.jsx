import { createContext, useContext, useEffect, useState } from 'react'
import { ensureProfileFromAuth, fetchProfile } from '../lib/platformApi.js'
import {
  isSupabaseConfigured,
  supabase,
  supabaseSetupMessage,
} from '../lib/supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  async function refreshProfile(userId = session?.user?.id ?? null) {
    if (!isSupabaseConfigured || !supabase || !userId) {
      setProfile(null)
      return { data: null, error: null }
    }

    const result = await fetchProfile(userId)
    setProfile(result.data ?? null)
    return result
  }

  useEffect(() => {
    let ignore = false

    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return undefined
    }

    async function loadInitialSession() {
      const { data, error } = await supabase.auth.getSession()

      if (ignore) {
        return
      }

      if (error) {
        setLoading(false)
        return
      }

      setSession(data.session ?? null)
      setLoading(false)

      if (data.session?.user?.id) {
        const { data: nextProfile } = await refreshProfile(data.session.user.id)
        if (!ignore) {
          setProfile(nextProfile ?? null)
        }
      }
    }

    loadInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (ignore) {
        return
      }

      setSession(nextSession ?? null)

      if (!nextSession?.user?.id) {
        setProfile(null)
        setLoading(false)
        return
      }

      const { data: nextProfile } = await refreshProfile(nextSession.user.id)

      if (!ignore) {
        setProfile(nextProfile ?? null)
        setLoading(false)
      }
    })

    return () => {
      ignore = true
      subscription.unsubscribe()
    }
  }, [])

  async function signInWithPassword({ email, password }) {
    if (!isSupabaseConfigured || !supabase) {
      return { data: null, error: new Error(supabaseSetupMessage) }
    }

    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signUpWithPassword({
    email,
    password,
    fullName,
    schoolEmail,
    universityId,
  }) {
    if (!isSupabaseConfigured || !supabase) {
      return { data: null, error: new Error(supabaseSetupMessage) }
    }

    const emailRedirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/auth` : undefined

    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          full_name: fullName,
          school_email: schoolEmail,
          university_id: universityId,
          user_role: 'candidate',
        },
      },
    })

    if (result.error || !result.data.user) {
      return result
    }

    await ensureProfileFromAuth({
      user: result.data.user,
      fullName,
      schoolEmail,
      universityId,
    })

    return result
  }

  async function signOut() {
    if (!isSupabaseConfigured || !supabase) {
      return { error: null }
    }

    return supabase.auth.signOut()
  }

  const value = {
    isConfigured: isSupabaseConfigured,
    loading,
    session,
    user: session?.user ?? null,
    profile,
    refreshProfile,
    signInWithPassword,
    signUpWithPassword,
    signOut,
    setupMessage: supabaseSetupMessage,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
