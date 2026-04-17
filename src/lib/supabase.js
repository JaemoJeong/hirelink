import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'elite-auth',
      },
      global: {
        headers: { 'x-client-info': 'elite-clone/1.0' },
      },
      db: {
        schema: 'public',
      },
      realtime: {
        params: { eventsPerSecond: 2 },
      },
    })
  : null

export const supabaseSetupMessage =
  'VITE_SUPABASE_URL과 VITE_SUPABASE_PUBLISHABLE_KEY를 설정하면 실제 인증과 데이터 저장이 활성화됩니다.'
