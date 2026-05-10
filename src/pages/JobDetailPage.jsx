import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  fetchJobBySlug,
  fetchMyApplication,
  fetchResumeDraft,
  listUniversities,
  submitApplication,
  withdrawApplication,
} from '../lib/platformApi.js'
import { useAuth } from '../providers/AuthProvider.jsx'

const applicationStatusLabelMap = {
  submitted: '지원 완료',
  reviewing: '검토중',
  interview: '인터뷰',
  offer: '오퍼',
  rejected: '불합격',
  withdrawn: '지원 철회',
}

function isWithdrawableApplication(status) {
  return ['submitted', 'reviewing', 'interview'].includes(status)
}

function tokenize(text) {
  if (!text) return []
  return String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2)
}

function autoMatchRequirement(reqText, profileBlob) {
  const tokens = tokenize(reqText)
  if (!tokens.length || !profileBlob) return false
  return tokens.some((t) => profileBlob.includes(t))
}

export function JobDetailPage() {
  const { slug } = useParams()
  const { user, profile } = useAuth()
  const [job, setJob] = useState(null)
  const [application, setApplication] = useState(null)
  const [coverNote, setCoverNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false)
  const [status, setStatus] = useState({ tone: 'neutral', message: '' })
  const [resumeDraft, setResumeDraft] = useState(null)
  const [universities, setUniversities] = useState([])
  const [overrideMatches, setOverrideMatches] = useState({})

  useEffect(() => {
    let ignore = false
    async function loadJobDetail() {
      setLoading(true)
      const { data: nextJob } = await fetchJobBySlug(slug)
      if (ignore) return
      setJob(nextJob ?? null)
      if (nextJob && user?.id) {
        const { data: nextApp } = await fetchMyApplication(nextJob.id, user.id)
        if (!ignore) setApplication(nextApp ?? null)
      } else if (!ignore) {
        setApplication(null)
      }
      if (!ignore) setLoading(false)
    }
    loadJobDetail()
    return () => { ignore = true }
  }, [slug, user?.id])

  useEffect(() => {
    let ignore = false
    async function loadProfileExtras() {
      if (!user?.id) {
        setResumeDraft(null)
        return
      }
      const [draftRes, uniRes] = await Promise.all([
        fetchResumeDraft(user.id).catch(() => ({ data: null })),
        listUniversities().catch(() => []),
      ])
      if (ignore) return
      setResumeDraft(draftRes?.data ?? null)
      setUniversities(Array.isArray(uniRes) ? uniRes : [])
    }
    loadProfileExtras()
    return () => { ignore = true }
  }, [user?.id])

  const universityName = useMemo(() => {
    if (!profile?.university_id) return ''
    return universities.find((u) => u.id === profile.university_id)?.name ?? ''
  }, [profile?.university_id, universities])

  const profileBlob = useMemo(() => {
    if (!user?.id) return ''
    const content = resumeDraft?.content ?? {}
    return [
      profile?.full_name,
      universityName,
      content.school,
      content.major,
      content.headline,
      content.summary,
      content.impact,
      content.experience,
      content.links,
      resumeDraft?.headline,
      resumeDraft?.summary,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
  }, [user?.id, profile?.full_name, universityName, resumeDraft])

  const requirementMatches = useMemo(() => {
    if (!job?.requirements) return []
    return job.requirements.map((req, idx) => {
      const auto = autoMatchRequirement(req, profileBlob)
      const overridden = overrideMatches[idx]
      const matched = overridden === undefined ? auto : overridden
      return { req, idx, auto, matched }
    })
  }, [job?.requirements, profileBlob, overrideMatches])

  const matchedCount = requirementMatches.filter((m) => m.matched).length
  const totalCount = requirementMatches.length
  const matchPercent = totalCount ? Math.round((matchedCount / totalCount) * 100) : 0

  function toggleMatch(idx) {
    setOverrideMatches((curr) => {
      const current = curr[idx]
      const auto = requirementMatches.find((m) => m.idx === idx)?.auto ?? false
      const next = current === undefined ? !auto : !current
      return { ...curr, [idx]: next }
    })
  }

  async function handleApply() {
    if (!user?.id || !job) return
    setSubmitting(true)
    setStatus({ tone: 'neutral', message: '' })
    const { data, error, existing } = await submitApplication({ jobId: job.id, userId: user.id, resumeId: null, coverNote })
    if (error) {
      setStatus({ tone: 'error', message: error.message })
      setSubmitting(false)
      return
    }
    setApplication(data ?? null)
    setStatus({
      tone: 'success',
      message: existing ? '이미 지원한 공고입니다.' : '지원이 완료되었습니다. 기업에서 확인 후 연락드립니다.',
    })
    setSubmitting(false)
  }

  async function handleWithdrawApplication() {
    if (!application?.id || !isWithdrawableApplication(application.status)) return
    setWithdrawSubmitting(true)
    setStatus({ tone: 'neutral', message: '' })
    const { data, error } = await withdrawApplication({ applicationId: application.id, note: '지원자 철회' })
    if (error) {
      setStatus({ tone: 'error', message: error.message })
      setWithdrawSubmitting(false)
      return
    }
    setApplication((curr) => curr ? { ...curr, status: data?.to_status ?? 'withdrawn' } : curr)
    setStatus({ tone: 'success', message: '지원을 철회했습니다.' })
    setWithdrawSubmitting(false)
  }

  if (loading) {
    return (
      <section className="section-card not-found-panel">
        <p className="eyebrow">로딩</p>
        <h1>공고 정보를 불러오는 중입니다</h1>
        <p>잠시만 기다려주세요.</p>
      </section>
    )
  }

  if (!job) {
    return (
      <section className="section-card not-found-panel">
        <p className="eyebrow">404</p>
        <h1>공고를 찾을 수 없습니다</h1>
        <p>삭제되었거나 잘못된 주소입니다.</p>
        <Link className="primary-button" to="/jobs">공고 목록으로</Link>
      </section>
    )
  }

  return (
    <>
      <section className="page-hero section-card compact-hero detail-hero">
        <div>
          <p className="eyebrow">{job.company}</p>
          <h1>{job.title}</h1>
          <p>{job.companyIntro || job.summary}</p>
          <div className="job-detail-row" style={{ marginTop: 16 }}>
            <span>{job.role}</span>
            <span>{job.location}</span>
            <span>{job.arrangement}</span>
          </div>
        </div>
        <aside className="compact-hero-card detail-hero-card">
          <div className="detail-kpis detail-hero-kpis">
            <article><strong>마감</strong><span>{job.deadline}</span></article>
            <article><strong>경력</strong><span>{job.experience}</span></article>
            <article><strong>학력</strong><span>{job.education}</span></article>
            <article><strong>근무</strong><span>{job.arrangement}</span></article>
          </div>
          <div className="detail-hero-actions">
            {user ? (
              <a className="primary-button full-width" href="#apply">지원하기</a>
            ) : (
              <Link className="primary-button full-width" to="/auth">로그인 후 지원하기</Link>
            )}
            <Link className="text-link detail-hero-back" to="/jobs">← 공고 목록</Link>
          </div>
        </aside>
      </section>

      <section className="detail-layout">
        <article className="section-card detail-main-card">
          <div className="detail-section-block">
            <p className="eyebrow">포지션 개요</p>
            <h2>{job.title}</h2>
            <p>{job.summary}</p>
          </div>

          <div className="detail-grid">
            <div className="detail-panel-card">
              <h3>주요 업무</h3>
              <ul className="detail-list">
                {(job.responsibilities ?? []).map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div className="detail-panel-card">
              <h3>자격 요건</h3>
              <ul className="detail-list">
                {(job.requirements ?? []).map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>

          {(job.perks ?? []).length > 0 ? (
            <div className="detail-panel-card wide">
              <h3>혜택</h3>
              <div className="job-detail-row">
                {job.perks.map((perk) => <span key={perk}>{perk}</span>)}
              </div>
            </div>
          ) : null}

          {job.description ? (
            <div className="detail-panel-card wide">
              <h3>회사 소개</h3>
              <p>{job.description}</p>
              {job.companySlug ? (
                <Link className="text-link" to={`/companies/${job.companySlug}`}>{job.company} 기업 프로필 보기</Link>
              ) : null}
            </div>
          ) : null}
        </article>

        <aside className="section-card detail-aside-card" id="apply">
          <div className="detail-match-card">
            <header className="detail-match-head">
              <p className="eyebrow">— 프로필 매칭</p>
              <h3>지원 자격 매칭</h3>
              {totalCount > 0 ? (
                <p className="detail-match-summary">
                  자격 요건 <strong>{matchedCount}</strong> / {totalCount} 충족 ({matchPercent}%)
                </p>
              ) : null}
            </header>

            {totalCount > 0 ? (
              <div className="detail-match-progress" aria-hidden="true">
                <span style={{ width: `${matchPercent}%` }} />
              </div>
            ) : null}

            {user ? (
              <ul className="detail-match-profile">
                <li>
                  <span className="detail-match-label">이름</span>
                  <span className="detail-match-value">{profile?.full_name ?? '미입력'}</span>
                </li>
                <li>
                  <span className="detail-match-label">학교</span>
                  <span className="detail-match-value">
                    {universityName || resumeDraft?.content?.school || '미연결'}
                  </span>
                </li>
                <li>
                  <span className="detail-match-label">전공</span>
                  <span className="detail-match-value">{resumeDraft?.content?.major || '미입력'}</span>
                </li>
                <li>
                  <span className="detail-match-label">인증</span>
                  <span className={`detail-match-value${profile?.verification_status === 'verified' ? ' is-ok' : ''}`}>
                    {profile?.verification_status === 'verified' ? '완료' : '미인증'}
                  </span>
                </li>
              </ul>
            ) : (
              <div className="detail-match-empty">
                <p>로그인하면 내 프로필을 자격 요건과 자동으로 비교해 드립니다.</p>
                <Link className="text-link" to="/auth">로그인하고 매칭 보기</Link>
              </div>
            )}

            {totalCount > 0 ? (
              <ul className="detail-match-list">
                {requirementMatches.map(({ req, idx, matched }) => (
                  <li key={`${idx}-${req}`}>
                    <button
                      type="button"
                      className={`detail-match-row${matched ? ' is-matched' : ''}`}
                      onClick={() => toggleMatch(idx)}
                      aria-pressed={matched}
                      aria-label={matched ? '매칭 해제' : '매칭으로 표시'}
                    >
                      <span className="detail-match-mark" aria-hidden="true">
                        {matched ? (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6.5 5 9.5 10 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M3 6h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        )}
                      </span>
                      <span className="detail-match-text">{req}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {user ? (
              <div className="detail-match-actions">
                <Link className="text-link" to="/me">프로필 보강하기</Link>
              </div>
            ) : null}
          </div>

          {status.message ? (
            <div className={`status-banner status-${status.tone}`}>
              <strong>{status.tone === 'success' ? '완료' : status.tone === 'error' ? '오류' : '안내'}</strong>
              <p>{status.message}</p>
            </div>
          ) : null}

          {application ? (
            <div className="detail-panel-card">
              <h3>내 지원 현황</h3>
              <p>상태: {applicationStatusLabelMap[application.status] ?? application.status}</p>
              <p>지원일: {application.applied_at?.slice(0, 10) ?? '방금 전'}</p>
              {application.cover_note ? <p>메모: {application.cover_note}</p> : null}
              {isWithdrawableApplication(application.status) ? (
                <div className="sidebar-actions stacked">
                  <button className="secondary-button full-width" disabled={withdrawSubmitting} type="button" onClick={handleWithdrawApplication}>
                    {withdrawSubmitting ? '처리 중...' : '지원 철회'}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {user ? (
            <div className="detail-panel-card">
              <h3>지원하기</h3>
              <p>간단한 메모와 함께 지원하세요. 커피챗을 통해 더 자세한 대화를 나눌 수 있습니다.</p>
              <label className="field">
                <span>지원 메모</span>
                <textarea rows="4" placeholder="지원 동기나 간단한 소개를 남겨주세요" value={coverNote} onChange={(e) => setCoverNote(e.target.value)} />
              </label>
              <div className="sidebar-actions stacked">
                <button className="primary-button full-width" disabled={submitting || Boolean(application)} type="button" onClick={handleApply}>
                  {application ? '이미 지원 완료' : submitting ? '처리 중...' : '지원하기'}
                </button>
              </div>
            </div>
          ) : null}

          {profile?.verification_status !== 'verified' && user ? (
            <div className="detail-panel-card">
              <h3>학교 인증</h3>
              <p>인증을 완료하면 기업에 더 빠르게 노출됩니다.</p>
              <Link className="text-link" to="/verify">학교 인증하기</Link>
            </div>
          ) : null}
        </aside>
      </section>
    </>
  )
}
