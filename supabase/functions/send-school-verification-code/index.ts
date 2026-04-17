import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function maskEmail(email: string) {
  const [localPart, domain] = email.split('@')

  if (!localPart || !domain) {
    return email
  }

  if (localPart.length <= 2) {
    return `${localPart[0] ?? '*'}*@${domain}`
  }

  return `${localPart.slice(0, 2)}${'*'.repeat(Math.max(2, localPart.length - 2))}@${domain}`
}

function generateVerificationCode() {
  return `${Math.floor(100000 + Math.random() * 900000)}`
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? ''
  const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? ''
  const debugReturnCode = (Deno.env.get('ALLOW_DEV_VERIFICATION_CODE_RESPONSE') ?? '').toLowerCase() === 'true'

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return jsonResponse({ error: 'Supabase Edge Function secrets are not configured.' }, 500)
  }

  if (!resendApiKey || !resendFromEmail) {
    return jsonResponse({ error: 'RESEND_API_KEY 또는 RESEND_FROM_EMAIL 이 설정되지 않았습니다.' }, 500)
  }

  const authHeader = request.headers.get('Authorization') ?? ''

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()

  if (userError || !user?.id) {
    return jsonResponse({ error: 'Authentication required' }, 401)
  }

  const requestBody = await request.json().catch(() => null)

  const universityId = String(requestBody?.universityId ?? '').trim()
  const schoolEmail = String(requestBody?.schoolEmail ?? '').trim().toLowerCase()
  const major = String(requestBody?.major ?? '').trim() || null
  const headline = String(requestBody?.headline ?? '').trim() || null
  const bio = String(requestBody?.bio ?? '').trim() || null
  const graduationYear = Number.isInteger(requestBody?.graduationYear)
    ? requestBody.graduationYear
    : null

  if (!universityId || !schoolEmail.includes('@')) {
    return jsonResponse({ error: '학교와 학교 이메일을 확인해 주세요.' }, 400)
  }

  const emailDomain = schoolEmail.split('@').pop()?.trim().toLowerCase() ?? ''

  if (!emailDomain) {
    return jsonResponse({ error: '학교 이메일 형식이 올바르지 않습니다.' }, 400)
  }

  const { data: universityRows, error: universityError } = await adminClient
    .from('universities')
    .select('id, name, university_domains(domain, is_active)')
    .eq('id', universityId)
    .limit(1)

  if (universityError || !universityRows?.length) {
    return jsonResponse({ error: '학교 정보를 확인하지 못했습니다.' }, 400)
  }

  const university = universityRows[0]
  const allowedDomains = (university.university_domains ?? [])
    .filter((item: { is_active?: boolean }) => item.is_active !== false)
    .map((item: { domain?: string }) => String(item.domain ?? '').toLowerCase())
    .filter(Boolean)

  if (!allowedDomains.includes(emailDomain)) {
    return jsonResponse({ error: '선택한 학교의 허용 이메일 도메인이 아닙니다.' }, 400)
  }

  const throttleSince = new Date(Date.now() - 45 * 1000).toISOString()
  const { data: recentChallenges, error: recentChallengeError } = await adminClient
    .from('school_email_verification_challenges')
    .select('id, last_sent_at')
    .eq('user_id', user.id)
    .is('consumed_at', null)
    .is('verified_at', null)
    .gte('last_sent_at', throttleSince)
    .order('last_sent_at', { ascending: false })
    .limit(1)

  if (recentChallengeError) {
    return jsonResponse({ error: '최근 인증 요청 상태를 확인하지 못했습니다.' }, 500)
  }

  if (recentChallenges?.length) {
    return jsonResponse({ error: '너무 자주 요청하고 있습니다. 잠시 후 다시 시도해 주세요.' }, 429)
  }

  await adminClient
    .from('school_email_verification_challenges')
    .update({
      consumed_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .is('consumed_at', null)
    .is('verified_at', null)

  const verificationCode = generateVerificationCode()
  const codeSalt = crypto.randomUUID().replaceAll('-', '')
  const codeHash = await sha256Hex(`${codeSalt}${verificationCode}`)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  const { data: challenge, error: challengeError } = await adminClient
    .from('school_email_verification_challenges')
    .insert({
      user_id: user.id,
      university_id: universityId,
      school_email: schoolEmail,
      requested_major: major,
      graduation_year: graduationYear,
      headline,
      bio,
      code_hash: codeHash,
      code_salt: codeSalt,
      expires_at: expiresAt,
      last_sent_at: new Date().toISOString(),
    })
    .select('id, expires_at')
    .single()

  if (challengeError || !challenge?.id) {
    return jsonResponse({ error: '학교 이메일 인증 요청을 저장하지 못했습니다.' }, 500)
  }

  await adminClient
    .from('profiles')
    .upsert(
      {
        id: user.id,
        school_email: schoolEmail,
        university_id: universityId,
        major,
        graduation_year: graduationYear,
        headline,
        bio,
        user_role: 'candidate',
      },
      { onConflict: 'id' },
    )

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: [schoolEmail],
      subject: `[HireLink] ${university.name ?? '학교'} 이메일 인증 코드`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #102348;">
          <h2 style="margin-bottom: 8px;">학교 이메일 인증 코드</h2>
          <p>아래 6자리 코드를 HireLink 학교 인증 화면에 입력해 주세요.</p>
          <div style="margin: 20px 0; padding: 16px; font-size: 32px; font-weight: 700; letter-spacing: 8px; background: #f5efe2; border-radius: 14px; text-align: center;">
            ${verificationCode}
          </div>
          <p>인증 코드는 10분 동안 유효합니다.</p>
          <p style="font-size: 14px; color: #5a6983;">요청하지 않았다면 이 메일을 무시하셔도 됩니다.</p>
        </div>
      `,
    }),
  })

  let emailSent = false

  if (resendResponse.ok) {
    emailSent = true
  }

  return jsonResponse({
    challengeId: challenge.id,
    maskedEmail: maskEmail(schoolEmail),
    expiresAt: challenge.expires_at,
    emailSent,
    ...(!emailSent || debugReturnCode ? { debugCode: verificationCode } : {}),
  })
})
