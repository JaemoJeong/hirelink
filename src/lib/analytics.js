// 트래킹 헬퍼: GA + Supabase 자체 트래픽 테이블에 동시 전송
// 본인 트래픽 제외: localStorage.hl_internal === '1'

import { supabase, isSupabaseConfigured } from './supabase.js'

function isInternal() {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem('hl_internal') === '1'
  } catch {
    return false
  }
}

function sessionId() {
  if (typeof window === 'undefined') return null
  try {
    let sid = window.sessionStorage.getItem('hl_sid')
    if (!sid) {
      sid = crypto.randomUUID()
      window.sessionStorage.setItem('hl_sid', sid)
    }
    return sid
  } catch {
    return null
  }
}

function gaEvent(name, params) {
  if (typeof window === 'undefined') return
  if (typeof window.gtag !== 'function') return
  try {
    window.gtag('event', name, params)
  } catch {
    // ignore
  }
}

async function dbInsert(table, row) {
  if (!isSupabaseConfigured || !supabase) return
  try {
    await supabase.from(table).insert(row)
  } catch {
    // 트래킹 실패가 UX 깨면 안 되므로 조용히 삼킴
  }
}

export function trackJobView({ slug, company, category, applyUrlPresent }) {
  if (!slug || isInternal()) return
  gaEvent('job_view', { job_slug: slug, company, category })
  dbInsert('job_views', {
    job_slug: slug,
    company_name: company ?? null,
    category: category ?? null,
    has_apply_url: applyUrlPresent ?? null,
    session_id: sessionId(),
  })
}

export function trackApplyClick({ slug, company, applyUrl }) {
  if (!slug || isInternal()) return
  gaEvent('apply_click', { job_slug: slug, company, apply_url: applyUrl })
  dbInsert('apply_clicks', {
    job_slug: slug,
    company_name: company ?? null,
    apply_url: applyUrl ?? null,
    session_id: sessionId(),
  })
}

export function trackCompanyView({ slug, name, category }) {
  if (!slug || isInternal()) return
  gaEvent('company_view', { company_slug: slug, name, category })
  dbInsert('company_views', {
    company_slug: slug,
    company_name: name ?? null,
    category: category ?? null,
    session_id: sessionId(),
  })
}

export function trackSearch({ query, surface }) {
  const q = (query ?? '').trim()
  if (!q || isInternal()) return
  gaEvent('job_search', { query: q, surface })
  dbInsert('search_events', {
    query: q,
    surface: surface ?? null,
    session_id: sessionId(),
  })
}
