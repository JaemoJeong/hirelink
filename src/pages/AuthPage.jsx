import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { listUniversities } from '../lib/platformApi.js'
import { useAuth } from '../providers/AuthProvider.jsx'

const emptyLoginForm = { email: '', password: '' }
const emptySignupForm = { fullName: '', email: '', universityId: '', schoolEmail: '', password: '' }

export function AuthPage() {
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') === 'signup' ? 'signup' : 'login')
  const [loginForm, setLoginForm] = useState(emptyLoginForm)
  const [signupForm, setSignupForm] = useState(emptySignupForm)
  const [universityOptions, setUniversityOptions] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState({ tone: 'neutral', message: '' })
  const location = useLocation()
  const navigate = useNavigate()
  const { isConfigured, loading, user, signInWithPassword, signUpWithPassword, setupMessage } = useAuth()

  const redirectTarget = location.state?.from?.pathname ?? '/me'
  const password = tab === 'signup' ? signupForm.password : ''
  const passwordChecks = [password.length >= 8, /[A-Z]/.test(password), /[a-z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)]
  const strength = passwordChecks.filter(Boolean).length
  const strengthLabel = strength >= 5 ? '강함' : strength >= 3 ? '보통' : strength >= 1 ? '약함' : ''

  useEffect(() => {
    let ignore = false
    async function loadUniversities() {
      const next = await listUniversities()
      if (!ignore) setUniversityOptions(next)
    }
    loadUniversities()
    return () => { ignore = true }
  }, [])

  useEffect(() => {
    if (user) navigate(redirectTarget, { replace: true })
  }, [navigate, redirectTarget, user])

  function updateLoginForm(field, value) {
    setLoginForm((f) => ({ ...f, [field]: value }))
  }

  function updateSignupForm(field, value) {
    setSignupForm((f) => ({ ...f, [field]: value }))
  }

  async function handleLoginSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setStatus({ tone: 'neutral', message: '' })
    const { error } = await signInWithPassword(loginForm)
    if (error) {
      setStatus({ tone: 'error', message: error.message })
      setSubmitting(false)
      return
    }
    setStatus({ tone: 'success', message: '로그인되었습니다.' })
    setSubmitting(false)
    navigate(redirectTarget, { replace: true })
  }

  async function handleSignupSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setStatus({ tone: 'neutral', message: '' })
    if (!signupForm.fullName || !signupForm.email || !signupForm.universityId || !signupForm.schoolEmail || !signupForm.password) {
      setStatus({ tone: 'error', message: '모든 항목을 입력해주세요.' })
      setSubmitting(false)
      return
    }
    const { error } = await signUpWithPassword({
      email: signupForm.email,
      password: signupForm.password,
      fullName: signupForm.fullName,
      schoolEmail: signupForm.schoolEmail,
      universityId: signupForm.universityId,
    })
    if (error) {
      setStatus({ tone: 'error', message: error.message })
      setSubmitting(false)
      return
    }
    setStatus({ tone: 'success', message: '가입이 완료되었습니다. 이메일을 확인한 후 로그인해주세요.' })
    setSubmitting(false)
    setTab('login')
    setLoginForm({ email: signupForm.email, password: '' })
  }

  return (
    <>
      <section className="page-hero section-card compact-hero">
        <div>
          <p className="eyebrow">로그인 · 회원가입</p>
          <h1>HireLink에 오신 것을 환영합니다</h1>
          <p>
            학교 인증 기반 커리어 플랫폼에 가입하고,
            큐레이션된 채용 공고와 커피챗 매칭을 시작하세요.
          </p>
        </div>
        <div className="compact-hero-card">
          <span className="compact-kicker">가입 흐름</span>
          <strong>회원가입 → 학교 인증 → 프로필 등록</strong>
          <p>인증 완료 후 커피챗 요청과 지원이 가능합니다.</p>
        </div>
      </section>

      <section className="auth-shell">
        <article className="section-card auth-card">
          {!isConfigured ? (
            <div className="status-banner status-neutral">
              <strong>서비스 준비 중</strong>
              <p>{setupMessage}</p>
            </div>
          ) : null}

          {status.message ? (
            <div className={`status-banner status-${status.tone}`}>
              <strong>{status.tone === 'error' ? '오류' : status.tone === 'success' ? '완료' : '안내'}</strong>
              <p>{status.message}</p>
            </div>
          ) : null}

          <div className="auth-tabs" role="tablist" aria-label="인증 탭">
            <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} type="button" onClick={() => setTab('login')}>
              로그인
            </button>
            <button className={`auth-tab ${tab === 'signup' ? 'active' : ''}`} type="button" onClick={() => setTab('signup')}>
              회원가입
            </button>
          </div>

          {tab === 'login' ? (
            <form className="form-grid" onSubmit={handleLoginSubmit}>
              <label className="field">
                <span>이메일</span>
                <input type="email" placeholder="your@email.com" value={loginForm.email} onChange={(e) => updateLoginForm('email', e.target.value)} />
              </label>
              <label className="field">
                <span>비밀번호</span>
                <input type="password" placeholder="비밀번호 입력" value={loginForm.password} onChange={(e) => updateLoginForm('password', e.target.value)} />
              </label>
              <div className="inline-row">
                <label className="check-row">
                  <input type="checkbox" defaultChecked />
                  자동 로그인
                </label>
                <button className="text-link button-reset" type="button">비밀번호 찾기</button>
              </div>
              <button className="primary-button full-width" disabled={loading || submitting} type="submit">
                {submitting ? '로그인 중...' : '로그인'}
              </button>
            </form>
          ) : (
            <form className="form-grid" onSubmit={handleSignupSubmit}>
              <label className="field">
                <span>이름</span>
                <input placeholder="홍길동" value={signupForm.fullName} onChange={(e) => updateSignupForm('fullName', e.target.value)} />
              </label>
              <label className="field">
                <span>로그인 이메일</span>
                <input type="email" placeholder="your@email.com" value={signupForm.email} onChange={(e) => updateSignupForm('email', e.target.value)} />
              </label>
              <label className="field">
                <span>학교</span>
                <select value={signupForm.universityId} onChange={(e) => updateSignupForm('universityId', e.target.value)}>
                  <option value="">학교 선택</option>
                  {universityOptions.map((school) => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>학교 이메일</span>
                <input type="email" placeholder="id@university.ac.kr" value={signupForm.schoolEmail} onChange={(e) => updateSignupForm('schoolEmail', e.target.value)} />
              </label>
              <label className="field">
                <span>비밀번호</span>
                <input type="password" placeholder="8자 이상, 영문/숫자/특수문자" value={signupForm.password} onChange={(e) => updateSignupForm('password', e.target.value)} />
              </label>
              {password.length > 0 ? (
                <div className="password-meter">
                  <div className="meter-track">
                    <div className="meter-fill" style={{ width: `${(strength / 5) * 100}%` }} />
                  </div>
                  <span>비밀번호 강도: {strengthLabel}</span>
                </div>
              ) : null}
              <button className="primary-button full-width" disabled={loading || submitting} type="submit">
                {submitting ? '가입 중...' : '회원가입'}
              </button>
            </form>
          )}
        </article>

        <aside className="info-stack">
          <article className="section-card info-card">
            <p className="eyebrow">학교 인증</p>
            <h2>가입 후 학교 인증을 완료하세요</h2>
            <p>
              학교 이메일로 인증을 마치면 커피챗 요청, 공고 지원 등
              모든 기능을 이용할 수 있습니다.
            </p>
            <Link className="secondary-button" to="/verify">학교 인증하기</Link>
          </article>

          <article className="section-card info-card dark-card">
            <p className="eyebrow bright">기업 파트너</p>
            <h2>채용을 시작하고 싶은 기업이라면</h2>
            <p>
              파트너 등록 후 전용 리퍼럴 링크와 채용 대시보드를
              바로 사용할 수 있습니다.
            </p>
            <Link className="primary-button light-button" to="/business">기업 서비스 보기</Link>
          </article>
        </aside>
      </section>
    </>
  )
}
