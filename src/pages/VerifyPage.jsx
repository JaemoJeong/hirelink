import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { verificationSteps } from '../data/mockData.js'
import {
  confirmSchoolEmailVerificationCode,
  listUniversities,
  requestSchoolEmailVerificationCode,
} from '../lib/platformApi.js'
import { useAuth } from '../providers/AuthProvider.jsx'

const challengeStorageKey = 'elite-school-email-verification'

const emptyForm = {
  universityId: '',
  schoolEmail: '',
  major: '',
  graduationYear: '',
  headline: '',
  bio: '',
}

const statusLabelMap = {
  pending: '미인증',
  submitted: '검토중',
  verified: '인증 완료',
  rejected: '재검토 필요',
}

function loadStoredChallenge() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(challengeStorageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const expires = new Date(parsed?.expiresAt ?? '')
    if (Number.isNaN(expires.getTime()) || expires.getTime() <= Date.now()) {
      window.sessionStorage.removeItem(challengeStorageKey)
      return null
    }
    return parsed
  } catch { return null }
}

function storeChallenge(challenge) {
  if (typeof window === 'undefined') return
  if (!challenge) { window.sessionStorage.removeItem(challengeStorageKey); return }
  window.sessionStorage.setItem(challengeStorageKey, JSON.stringify(challenge))
}

function formatRemainingTime(expiresAt) {
  const d = new Date(expiresAt ?? '')
  if (Number.isNaN(d.getTime())) return ''
  const remaining = Math.max(0, Math.floor((d.getTime() - Date.now()) / 1000))
  return `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`
}

export function VerifyPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [universities, setUniversities] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [verificationCode, setVerificationCode] = useState('')
  const [challenge, setChallenge] = useState(() => loadStoredChallenge())
  const [loading, setLoading] = useState(true)
  const [sendingCode, setSendingCode] = useState(false)
  const [confirmingCode, setConfirmingCode] = useState(false)
  const [status, setStatus] = useState({ tone: 'neutral', message: '' })

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      const nextUniversities = await listUniversities()
      if (ignore) return
      setUniversities(nextUniversities ?? [])
      setForm({
        universityId: profile?.university_id ?? nextUniversities?.[0]?.id ?? '',
        schoolEmail: profile?.school_email ?? '',
        major: profile?.major ?? '',
        graduationYear: profile?.graduation_year ? String(profile.graduation_year) : '',
        headline: profile?.headline ?? '',
        bio: profile?.bio ?? '',
      })
      if (profile?.verification_status === 'verified') {
        setChallenge(null)
        storeChallenge(null)
      }
      setLoading(false)
    }
    load()
    return () => { ignore = true }
  }, [profile?.id, profile?.verification_status])

  useEffect(() => {
    if (!challenge?.expiresAt) return undefined
    const id = window.setInterval(() => {
      const d = new Date(challenge.expiresAt)
      if (!Number.isNaN(d.getTime()) && d.getTime() <= Date.now()) {
        setChallenge(null)
        storeChallenge(null)
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [challenge?.expiresAt])

  const selectedUniversity = useMemo(
    () => universities.find((s) => s.id === form.universityId) ?? null,
    [form.universityId, universities],
  )

  const normalizedEmailDomain = form.schoolEmail.includes('@')
    ? form.schoolEmail.split('@').pop().trim().toLowerCase()
    : ''
  const selectedDomain = selectedUniversity?.domain?.toLowerCase() ?? ''
  const domainMatches = Boolean(selectedDomain) && normalizedEmailDomain === selectedDomain
  const currentStatusLabel =
    challenge && profile?.verification_status !== 'verified'
      ? '코드 확인 대기'
      : statusLabelMap[profile?.verification_status] ?? '미설정'
  const codeRemainingTime = formatRemainingTime(challenge?.expiresAt)

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSendCode(event) {
    event?.preventDefault?.()
    if (!user?.id) return
    if (!form.universityId || !form.schoolEmail.trim()) {
      setStatus({ tone: 'error', message: '학교와 학교 이메일을 입력해주세요.' })
      return
    }
    if (!domainMatches) {
      setStatus({ tone: 'error', message: `선택한 학교의 허용 도메인은 @${selectedUniversity?.domain ?? '?'} 입니다.` })
      return
    }
    const parsedYear = Number.parseInt(form.graduationYear, 10)
    if (form.graduationYear && Number.isNaN(parsedYear)) {
      setStatus({ tone: 'error', message: '졸업 연도는 숫자로 입력해주세요.' })
      return
    }
    setSendingCode(true)
    setStatus({ tone: 'neutral', message: '' })

    const { data, error } = await requestSchoolEmailVerificationCode({
      universityId: form.universityId,
      schoolEmail: form.schoolEmail,
      major: form.major,
      graduationYear: form.graduationYear,
      headline: form.headline,
      bio: form.bio,
    })

    if (error) {
      setStatus({ tone: 'error', message: error.message })
      setSendingCode(false)
      return
    }

    const next = {
      challengeId: data?.challengeId ?? '',
      maskedEmail: data?.maskedEmail ?? form.schoolEmail,
      expiresAt: data?.expiresAt ?? '',
      schoolEmail: form.schoolEmail.trim().toLowerCase(),
      universityId: form.universityId,
    }
    setChallenge(next)
    storeChallenge(next)
    setVerificationCode('')
    setStatus({
      tone: 'success',
      message: data?.debugCode
        ? `인증 코드: ${data.debugCode} (메일 발송이 불가한 환경이라 화면에 표시합니다)`
        : `인증 코드를 ${next.maskedEmail} 로 보냈습니다. 메일함을 확인하세요.`,
    })
    setSendingCode(false)
  }

  async function handleConfirmCode(event) {
    event.preventDefault()
    if (!challenge?.challengeId) {
      setStatus({ tone: 'error', message: '먼저 인증 코드를 요청해주세요.' })
      return
    }
    if (verificationCode.trim().length < 6) {
      setStatus({ tone: 'error', message: '6자리 인증 코드를 입력해주세요.' })
      return
    }
    setConfirmingCode(true)
    setStatus({ tone: 'neutral', message: '' })

    const { error } = await confirmSchoolEmailVerificationCode({
      challengeId: challenge.challengeId,
      code: verificationCode,
    })

    if (error) {
      setStatus({ tone: 'error', message: error.message })
      setConfirmingCode(false)
      return
    }

    await refreshProfile(user?.id ?? null)
    setChallenge(null)
    storeChallenge(null)
    setVerificationCode('')
    setStatus({ tone: 'success', message: '학교 인증이 완료되었습니다! 이제 모든 기능을 이용할 수 있습니다.' })
    setConfirmingCode(false)
  }

  return (
    <>
      <section className="page-hero section-card compact-hero">
        <div>
          <p className="eyebrow">학교 인증</p>
          <h1>학교 이메일로 본인 인증</h1>
          <p>
            학교 이메일로 6자리 인증 코드를 받고 입력하면
            인증이 완료됩니다. 인증 후 커피챗과 지원이 가능합니다.
          </p>
        </div>
        <div className="compact-hero-card">
          <span className="compact-kicker">인증 상태</span>
          <strong>{loading ? '불러오는 중...' : currentStatusLabel}</strong>
          <p>
            {challenge?.maskedEmail
              ? `${challenge.maskedEmail} 로 코드를 발송했습니다.`
              : selectedUniversity
                ? `허용 도메인: @${selectedUniversity.domain}`
                : '학교를 선택하면 허용 도메인이 표시됩니다.'}
          </p>
        </div>
      </section>

      <section className="verify-grid">
        {verificationSteps.map((step, index) => (
          <article className="section-card verify-card" key={step.title}>
            <span className="feature-index">0{index + 1}</span>
            <h2>{step.title}</h2>
            <p>{step.copy}</p>
          </article>
        ))}
      </section>

      <section className="jobs-layout">
        <article className="section-card auth-card">
          {status.message ? (
            <div className={`status-banner status-${status.tone}`}>
              <strong>{status.tone === 'error' ? '오류' : status.tone === 'success' ? '완료' : '안내'}</strong>
              <p>{status.message}</p>
            </div>
          ) : null}

          <div className="section-heading">
            <div>
              <p className="eyebrow">Step 1</p>
              <h2>인증 코드 받기</h2>
            </div>
            <p>프로필 정보를 입력하고 학교 이메일로 인증 코드를 받으세요.</p>
          </div>

          <form className="form-grid" onSubmit={handleSendCode}>
            <label className="field">
              <span>학교</span>
              <select disabled={loading || universities.length === 0} value={form.universityId} onChange={(e) => updateField('universityId', e.target.value)}>
                {universities.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>

            <label className="field">
              <span>학교 이메일</span>
              <input type="email" placeholder={selectedUniversity ? `name@${selectedUniversity.domain}` : 'school@email.com'} value={form.schoolEmail} onChange={(e) => updateField('schoolEmail', e.target.value)} />
            </label>

            <label className="field">
              <span>전공</span>
              <input value={form.major} onChange={(e) => updateField('major', e.target.value)} />
            </label>

            <label className="field">
              <span>졸업 연도</span>
              <input inputMode="numeric" placeholder="예: 2027" value={form.graduationYear} onChange={(e) => updateField('graduationYear', e.target.value)} />
            </label>

            <label className="field">
              <span>한 줄 소개</span>
              <input placeholder="예: AI 제품과 사업 전략에 관심 있는 컴퓨터공학 전공생" value={form.headline} onChange={(e) => updateField('headline', e.target.value)} />
            </label>

            <label className="field resume-editor-full">
              <span>자기소개</span>
              <textarea rows="4" placeholder="관심 직무, 강점, 경험을 간단히 적어주세요" value={form.bio} onChange={(e) => updateField('bio', e.target.value)} />
            </label>

            <div className="sidebar-actions">
              <button className="primary-button" disabled={sendingCode || loading} type="submit">
                {sendingCode ? '보내는 중...' : '인증 코드 받기'}
              </button>
            </div>
          </form>

          <div className="section-heading">
            <div>
              <p className="eyebrow">Step 2</p>
              <h2>코드 입력</h2>
            </div>
            <p>받은 6자리 코드를 입력하면 인증이 완료됩니다.</p>
          </div>

          <form className="form-grid" onSubmit={handleConfirmCode}>
            <label className="field">
              <span>인증 코드</span>
              <input inputMode="numeric" maxLength={6} placeholder="6자리 코드 입력" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} />
            </label>

            <div className="sidebar-actions">
              <button className="primary-button" disabled={confirmingCode || !challenge?.challengeId} type="submit">
                {confirmingCode ? '확인 중...' : '인증 완료'}
              </button>
              {challenge ? (
                <button className="secondary-button" disabled={sendingCode} type="button" onClick={handleSendCode}>
                  {sendingCode ? '재전송 중...' : '코드 다시 받기'}
                </button>
              ) : null}
            </div>
          </form>
        </article>

        <aside className="section-card jobs-sidebar-card info-stack">
          <article className="resume-progress-card">
            <p className="eyebrow">인증 현황</p>
            <h2>상태 요약</h2>
            <div className="resume-checklist">
              <article className="resume-check-item">
                <div className="resume-check-head">
                  <strong>현재 상태</strong>
                  <span className={`check-pill ${profile?.verification_status === 'verified' ? 'complete' : ''}`}>
                    {currentStatusLabel}
                  </span>
                </div>
                <ul>
                  <li>학교: {selectedUniversity?.name ?? '미선택'}</li>
                  <li>허용 도메인: @{selectedUniversity?.domain ?? '-'}</li>
                  <li>도메인 일치: {domainMatches ? '예' : '아니오'}</li>
                  <li>코드 유효: {challenge ? codeRemainingTime || '만료됨' : '요청 전'}</li>
                </ul>
              </article>
            </div>
          </article>

          <div className="section-heading">
            <div>
              <p className="eyebrow">허용 도메인</p>
              <h2>인증 가능 학교</h2>
            </div>
          </div>

          <div className="domain-grid">
            {universities.map((s) => (
              <article className="domain-pill section-card" key={s.id}>
                <strong>{s.name}</strong>
                <span>@{s.domain}</span>
              </article>
            ))}
          </div>

          <div className="sidebar-actions">
            <Link className="secondary-button" to="/jobs">채용공고 보기</Link>
            <Link className="secondary-button" to="/me">마이페이지</Link>
          </div>
        </aside>
      </section>
    </>
  )
}
