import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchJobBySlug, fetchMyApplication, submitApplication, withdrawApplication } from '../lib/platformApi.js'
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
