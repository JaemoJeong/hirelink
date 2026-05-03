import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getJobListSnapshot, listJobs, listSavedJobs, toggleSavedJob } from '../lib/platformApi.js'
import { useAuth } from '../providers/AuthProvider.jsx'

export function JobsPage() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState(() => getJobListSnapshot())
  const [savedJobs, setSavedJobs] = useState([])
  const [search, setSearch] = useState('')
  const [activeRole, setActiveRole] = useState('전체')
  const [activeLocation, setActiveLocation] = useState('전체')
  const [loading, setLoading] = useState(false)
  const [savingJobId, setSavingJobId] = useState('')
  const [loadError, setLoadError] = useState('')
  const [actionStatus, setActionStatus] = useState({ tone: 'neutral', message: '' })
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    let ignore = false
    async function loadJobBoard() {
      const { data, error } = await listJobs()
      if (ignore) return
      setJobs(data ?? [])
      setLoadError(error?.message ?? '')
      setLoading(false)
    }
    loadJobBoard()
    return () => { ignore = true }
  }, [])

  useEffect(() => {
    let ignore = false
    async function loadSavedJobs() {
      if (!user?.id) { setSavedJobs([]); return }
      const { data, error } = await listSavedJobs(user.id)
      if (ignore) return
      setSavedJobs(data ?? [])
      if (error) setActionStatus({ tone: 'error', message: error.message })
    }
    loadSavedJobs()
    return () => { ignore = true }
  }, [user?.id])

  const roleFilters = ['전체', ...new Set(jobs.map((job) => job.role).filter(Boolean))]
  const locationFilters = ['전체', ...new Set(jobs.map((job) => job.location).filter(Boolean))]
  const savedJobIdSet = useMemo(() => new Set(savedJobs.map((item) => item.jobId)), [savedJobs])

  const filteredJobs = jobs.filter((job) => {
    const query = deferredSearch.trim().toLowerCase()
    const matchesSearch =
      query.length === 0 ||
      [job.company, job.title, job.summary, job.role, ...(job.tags ?? [])]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query))
    const matchesRole = activeRole === '전체' || job.role === activeRole
    const matchesLocation = activeLocation === '전체' || job.location === activeLocation
    return matchesSearch && matchesRole && matchesLocation
  })

  async function handleToggleSave(job) {
    if (!user?.id) {
      setActionStatus({ tone: 'error', message: '로그인 후 관심 공고를 저장할 수 있습니다.' })
      return
    }
    setSavingJobId(job.id)
    setActionStatus({ tone: 'neutral', message: '' })
    const { data, error } = await toggleSavedJob({ jobId: job.id, userId: user.id })
    if (error) {
      setActionStatus({ tone: 'error', message: error.message })
      setSavingJobId('')
      return
    }
    setSavedJobs((curr) =>
      data?.saved
        ? [{ id: data.savedJobId, jobId: data.jobId, savedAt: data.savedAt ?? '' }, ...curr.filter((i) => i.jobId !== data.jobId)]
        : curr.filter((i) => i.jobId !== data?.jobId),
    )
    setActionStatus({ tone: 'success', message: data?.saved ? '관심 공고에 저장했습니다.' : '저장을 해제했습니다.' })
    setSavingJobId('')
  }

  return (
    <>
      <section className="aura-page-head">
        <div className="aura-title-row">
          <h1 className="aura-title">채용공고</h1>
          <nav className="aura-tabs" aria-label="직군 필터">
            {roleFilters.slice(0, 6).map((role) => (
              <button
                className={`aura-tab${activeRole === role ? ' active' : ''}`}
                key={role}
                type="button"
                onClick={() => startTransition(() => setActiveRole(role))}
              >
                {role}
              </button>
            ))}
          </nav>
          <span className="aura-meta-label">{filteredJobs.length} OPENINGS</span>
        </div>

        <div className="aura-toolbar">
          <label className="aura-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
              <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              placeholder="회사명, 직무, 키워드로 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="aura-location-row" aria-label="지역 필터">
            {locationFilters.slice(0, 6).map((loc) => (
              <button
                className={`aura-loc-tab${activeLocation === loc ? ' active' : ''}`}
                key={loc}
                type="button"
                onClick={() => startTransition(() => setActiveLocation(loc))}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loadError && !jobs.length ? (
        <div className="status-banner status-error">
          <strong>공고를 불러오지 못했습니다</strong>
          <p>{loadError}</p>
        </div>
      ) : null}

      {actionStatus.message ? (
        <div className={`status-banner status-${actionStatus.tone}`}>
          <strong>{actionStatus.tone === 'success' ? '완료' : actionStatus.tone === 'error' ? '오류' : '안내'}</strong>
          <p>{actionStatus.message}</p>
        </div>
      ) : null}

      <section className="aura-jobs-section">
        {filteredJobs.length > 0 ? (
          <>
            {filteredJobs[0] ? (
              <article className="aura-card aura-card-featured" key={filteredJobs[0].id}>
                <div className="aura-featured-eyebrow">
                  <span className="aura-featured-tag">FEATURED</span>
                  <span className="aura-featured-meta">{filteredJobs[0].badge ?? '신규 공고'}</span>
                </div>
                <header className="aura-card-head">
                  <div className="aura-card-company">
                    <span className="aura-company-logo" aria-hidden="true">
                      {(filteredJobs[0].company ?? '·').slice(0, 1)}
                    </span>
                    <div className="aura-company-info">
                      {filteredJobs[0].companySlug ? (
                        <Link to={`/companies/${filteredJobs[0].companySlug}`} className="aura-company-name">
                          {filteredJobs[0].company}
                        </Link>
                      ) : (
                        <span className="aura-company-name">{filteredJobs[0].company}</span>
                      )}
                      <span className="aura-company-meta">{filteredJobs[0].location} · {filteredJobs[0].arrangement}</span>
                    </div>
                  </div>
                  <span className="aura-arrangement">{filteredJobs[0].role}</span>
                </header>

                <h2 className="aura-card-title">{filteredJobs[0].title}</h2>
                <p className="aura-featured-summary">{filteredJobs[0].summary}</p>

                <footer className="aura-card-foot">
                  <div className="aura-card-meta">
                    <span className="aura-card-label">마감 · 경력 · 학력</span>
                    <span className="aura-card-value">{filteredJobs[0].deadline} · {filteredJobs[0].experience} · {filteredJobs[0].education}</span>
                  </div>
                  <div className="aura-card-actions">
                    {user?.id ? (
                      <button
                        type="button"
                        className={`aura-bookmark${savedJobIdSet.has(filteredJobs[0].id) ? ' saved' : ''}`}
                        disabled={savingJobId === filteredJobs[0].id}
                        onClick={() => handleToggleSave(filteredJobs[0])}
                        aria-label={savedJobIdSet.has(filteredJobs[0].id) ? '저장 해제' : '관심 공고 저장'}
                      >
                        <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true">
                          <path
                            d="M2 1.5h10v13L7 11l-5 3.5z"
                            fill={savedJobIdSet.has(filteredJobs[0].id) ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    ) : null}
                    <Link to={`/jobs/${filteredJobs[0].slug}`} className="aura-arrow-btn light" aria-label="상세 보기">
                      →
                    </Link>
                  </div>
                </footer>
              </article>
            ) : null}

            {filteredJobs.length > 1 ? (
              <div className="home-elite-grid jobs-elite-grid" aria-label="공고 목록">
                {filteredJobs.slice(1).map((job, idx) => {
                  const urgent = job.deadline?.startsWith('D-') && parseInt(job.deadline.slice(2), 10) <= 4
                  return (
                    <article className={`home-elite-card${urgent ? ' is-urgent' : ''}`} key={job.id}>
                      <Link to={`/jobs/${job.slug}`} className="home-elite-card-link" aria-label={job.title}>
                        <div className="home-elite-card-top">
                          <span className="home-elite-card-icon" aria-hidden="true">{job.company.slice(0, 1)}</span>
                          {urgent ? (
                            <span className="home-elite-card-badge urgent">URGENT</span>
                          ) : (
                            <span className="home-elite-card-badge">{job.deadline}</span>
                          )}
                        </div>
                        <div className="home-elite-card-body">
                          <span className="home-elite-card-company">{job.company}</span>
                          <h3 className="home-elite-card-title">{job.title}</h3>
                          <div className="home-elite-card-chips">
                            <span>{job.experience}</span>
                            <span>{job.location}</span>
                            <span>{job.arrangement}</span>
                          </div>
                        </div>
                        <div className="home-elite-card-foot">
                          <span className="home-elite-card-date">{job.role}</span>
                          {user?.id ? (
                            <button
                              type="button"
                              className={`home-elite-card-bookmark-btn${savedJobIdSet.has(job.id) ? ' saved' : ''}`}
                              disabled={savingJobId === job.id}
                              onClick={(e) => { e.preventDefault(); handleToggleSave(job) }}
                              aria-label={savedJobIdSet.has(job.id) ? '저장 해제' : '관심 공고 저장'}
                            >
                              <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                                <path d="M2 1.5h10v13L7 11l-5 3.5z" fill={savedJobIdSet.has(job.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                              </svg>
                            </button>
                          ) : (
                            <span className="home-elite-card-bookmark" aria-hidden="true">
                              <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                                <path d="M2 1.5h10v13L7 11l-5 3.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                              </svg>
                            </span>
                          )}
                        </div>
                      </Link>
                    </article>
                  )
                })}
              </div>
            ) : null}
          </>
        ) : (
          <div className="empty-state">
            <strong>조건에 맞는 공고가 없습니다</strong>
            <p>검색어나 필터를 조정해보세요.</p>
          </div>
        )}
      </section>
    </>
  )
}
