import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { createCompanyInfoRequest, fetchCompanyBySlug, listCompanyInfoRequests } from '../lib/platformApi.js'
import { useAuth } from '../providers/AuthProvider.jsx'

function getCompanyInfoScore(company) {
  const checks = [company?.tagline, company?.description, company?.mission, company?.culture, company?.benefits?.length, company?.hiringProcess?.length, company?.websiteUrl, company?.logoUrl, company?.jobCount > 0]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

function shortenText(value, maxLength = 120) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim()
  if (!text) return ''
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text
}

export function CompanyDetailPage() {
  const { slug } = useParams()
  const { user } = useAuth()
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [companyQuestions, setCompanyQuestions] = useState([])
  const [question, setQuestion] = useState('')
  const [submittingQuestion, setSubmittingQuestion] = useState(false)
  const [requestStatus, setRequestStatus] = useState({ tone: 'neutral', message: '' })

  useEffect(() => {
    let ignore = false
    async function loadCompany() {
      setLoading(true)
      const { data, error } = await fetchCompanyBySlug(slug)
      if (ignore) return
      setCompany(data ?? null)
      setCompanyQuestions([])
      setLoadError(error ?? null)
      setLoading(false)
    }
    loadCompany()
    return () => { ignore = true }
  }, [slug])

  useEffect(() => {
    let ignore = false
    async function loadQuestions() {
      if (!company?.id) { setCompanyQuestions([]); return }
      const { data } = await listCompanyInfoRequests(company.id)
      if (!ignore) setCompanyQuestions(data ?? [])
    }
    loadQuestions()
    return () => { ignore = true }
  }, [company?.id])

  const infoScore = useMemo(() => getCompanyInfoScore(company), [company])

  const companyInsightCards = useMemo(() => {
    if (!company) return []
    return [
      { label: '미션', title: '회사가 푸는 문제', body: company.mission || '준비중' },
      { label: '문화', title: '일하는 방식', body: company.culture || '준비중' },
      { label: '혜택', title: '복지 포인트', body: company.benefits?.length ? company.benefits.join(' · ') : '준비중' },
      { label: '채용', title: '채용 프로세스', body: company.hiringProcess?.length ? company.hiringProcess.join(' → ') : '준비중' },
    ]
  }, [company])

  const suggestedQuestions = useMemo(() => {
    if (!company) return []
    return [
      company.hiringProcess?.length ? '' : '채용 프로세스는 어떻게 진행되나요?',
      company.culture ? '주니어가 빠르게 적응하려면 어떤 역량이 중요한가요?' : '팀 문화와 일하는 방식이 궁금합니다.',
      company.jobs?.length ? `${company.jobs[0].title} 포지션에서 가장 중요하게 보는 경험은요?` : '향후 채용 계획이 있으신가요?',
    ].filter(Boolean)
  }, [company])

  async function handleSubmitQuestion(event) {
    event.preventDefault()
    if (!company?.id) return
    if (!user?.id) {
      setRequestStatus({ tone: 'error', message: '로그인 후 질문을 남길 수 있습니다.' })
      return
    }
    setSubmittingQuestion(true)
    setRequestStatus({ tone: 'neutral', message: '' })
    const { data, error } = await createCompanyInfoRequest({ companyId: company.id, requesterId: user.id, question, context: '' })
    if (error) {
      setRequestStatus({ tone: 'error', message: error.message })
      setSubmittingQuestion(false)
      return
    }
    setQuestion('')
    setCompanyQuestions((curr) => [...(data ? [{ ...data, answer: '', answeredAt: '' }] : []), ...curr])
    setRequestStatus({ tone: 'success', message: '질문을 보냈습니다. 답변이 등록되면 알려드립니다.' })
    setSubmittingQuestion(false)
  }

  if (loading) {
    return (
      <section className="section-card not-found-panel">
        <p className="eyebrow">로���</p>
        <h1>기업 정보를 불러오는 중입니다</h1>
        <p>잠시만 기다려주세요.</p>
      </section>
    )
  }

  if (!company) {
    return (
      <section className="section-card not-found-panel">
        <p className="eyebrow">404</p>
        <h1>기업을 찾을 수 없습니다</h1>
        <p>{loadError?.message ?? '삭제되었거나 잘못된 주소입니다.'}</p>
        <Link className="primary-button" to="/companies">기업 목록으로</Link>
      </section>
    )
  }

  return (
    <>
      <section
        className="page-hero section-card compact-hero company-hero"
        style={company.coverImageUrl ? { backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.94), rgba(255,255,255,0.76)), url(${company.coverImageUrl})` } : undefined}
      >
        <div>
          <p className="eyebrow">{company.category}</p>
          <h1>{company.name}</h1>
          <p>{company.tagline || company.description}</p>
        </div>
        <div className="compact-hero-card">
          {company.logoUrl ? <img alt={`${company.name} 로고`} className="company-logo-preview" src={company.logoUrl} /> : null}
          <span className="compact-kicker">{company.headquarters}</span>
          <strong>공개 공고 {company.jobCount}건</strong>
          <p>{company.isPartner ? '엘리트잡 파트너 기업' : ''}</p>
        </div>
      </section>

      <section className="jobs-layout">
        <article className="section-card detail-main-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">소��</p>
              <h2>{company.name}</h2>
            </div>
          </div>
          <p>{company.description}</p>
          <div className="results-chip-row">
            <span className="results-chip">{company.category}</span>
            <span className="results-chip">{company.headquarters}</span>
            {company.websiteUrl ? <span className="results-chip">{company.websiteUrl}</span> : null}
          </div>
        </article>

        <aside className="section-card jobs-sidebar-card">
          <p className="eyebrow">빠른 이동</p>
          <h2>관련 페이지</h2>
          <div className="sidebar-actions stacked">
            {company.jobs?.[0] ? (
              <Link className="primary-button full-width" to={`/jobs/${company.jobs[0].slug}`}>대표 공고 보기</Link>
            ) : null}
            {company.websiteUrl ? (
              <a className="secondary-button full-width" href={company.websiteUrl} rel="noreferrer" target="_blank">공식 웹사이트</a>
            ) : null}
            <Link className="secondary-button full-width" to="/companies">기업 목록</Link>
          </div>
        </aside>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">기업 정보</p>
            <h2>미션 · 문화 · 혜택 · 채용</h2>
          </div>
          <p>지원 전에 확인하면 좋은 핵심 정보를 정리했습니다.</p>
        </div>

        <div className="demo-flow-grid">
          {companyInsightCards.map((item) => (
            <article className="notification-card" key={`${company.id}-${item.label}`}>
              <div className="notification-meta">
                <span className="check-pill complete">{item.label}</span>
              </div>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">채용 공고</p>
            <h2>{company.name}의 공개 포지���</h2>
          </div>
        </div>

        {company.jobs?.length ? (
          <div className="jobs-grid">
            {company.jobs.map((job) => (
              <article className="job-card" key={job.id}>
                <div className="job-card-head">
                  <div>
                    <div className="job-meta">
                      <span className="job-badge">{job.badge || job.role}</span>
                    </div>
                    <h3 className="job-title">{job.title}</h3>
                  </div>
                  <span className="deadline-pill">{job.deadline || '상시'}</span>
                </div>
                <p className="job-summary">{job.summary || job.description || ''}</p>
                <div className="job-detail-row">
                  <span>{job.role}</span>
                  <span>{job.location}</span>
                  <span>{job.arrangement || '협의'}</span>
                </div>
                <footer>
                  <span className="job-footnote">커피챗 · 지원 가능</span>
                  <Link className="job-cta" to={`/jobs/${job.slug}`}>상세 보기</Link>
                </footer>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>현재 공개 공고가 없습니다</strong>
            <p>아래에서 기업에 직접 질문을 남겨보세요.</p>
          </div>
        )}
      </section>

      <section className="section-card company-intel-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Q&A</p>
            <h2>기업에게 질문하기</h2>
          </div>
          <p>궁금한 점을 남기면 파트너가 답변합��다.</p>
        </div>

        <div className="metric-grid">
          <article className="metric-panel">
            <span>정보 완성도</span>
            <strong>{infoScore}%</strong>
          </article>
          <article className="metric-panel">
            <span>공개 공고</span>
            <strong>{company.jobCount}건</strong>
          </article>
          <article className="metric-panel">
            <span>Q&A</span>
            <strong>{companyQuestions.length}건</strong>
          </article>
        </div>

        {requestStatus.message ? (
          <div className={`status-banner status-${requestStatus.tone}`}>
            <strong>{requestStatus.tone === 'error' ? '오류' : '완료'}</strong>
            <p>{requestStatus.message}</p>
          </div>
        ) : null}

        <div className="resume-editor-grid">
          <article className="notification-card">
            <strong>추천 질문</strong>
            <div className="notification-list">
              {suggestedQuestions.map((item) => (
                <button className="secondary-button" key={item} type="button" onClick={() => setQuestion(item)}>{item}</button>
              ))}
            </div>
          </article>

          <article className="notification-card">
            <form className="company-question-form" onSubmit={handleSubmitQuestion}>
              <label className="field">
                <span>질문 작성</span>
                <textarea placeholder="이 기업에 대해 궁금한 점을 남겨주세요" value={question} onChange={(e) => setQuestion(e.target.value)} />
              </label>
              <button className="primary-button" disabled={submittingQuestion || !question.trim()} type="submit">
                {submittingQuestion ? '보내는 중...' : '질문 보내기'}
              </button>
            </form>
          </article>
        </div>

        {companyQuestions.length > 0 ? (
          <div className="notification-list">
            {companyQuestions.map((item) => (
              <article className={`notification-card ${item.status === 'open' ? 'unread' : ''}`} key={item.id}>
                <div className="notification-meta">
                  <span className={`check-pill ${item.status === 'answered' ? 'complete' : ''}`}>
                    {item.status === 'answered' ? '답변 완료' : '답변 대기'}
                  </span>
                  <span>{item.answeredAt || item.createdAt || ''}</span>
                </div>
                <strong>Q. {item.question}</strong>
                {item.answer ? <p>A. {item.answer}</p> : <p>답변을 기다리는 중입니다.</p>}
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </>
  )
}
