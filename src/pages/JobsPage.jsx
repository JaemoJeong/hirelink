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
  const [syncing, setSyncing] = useState(true)
  const [savingJobId, setSavingJobId] = useState('')
  const [loadError, setLoadError] = useState('')
  const [actionStatus, setActionStatus] = useState({ tone: 'neutral', message: '' })
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    let ignore = false
    async function loadJobBoard() {
      setSyncing(true)
      const { data, error } = await listJobs()
      if (ignore) return
      setJobs(data ?? [])
      setLoadError(error?.message ?? '')
      setLoading(false)
      setSyncing(false)
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
      <section className="page-hero section-card compact-hero">
        <div>
          <p className="eyebrow">채용공고</p>
          <h1>검수된 포지션만 모았습니다</h1>
          <p>
            운영팀이 직접 확인한 공고만 노출됩니다.
            직군, 지역, 근무 형태로 필터링하고 관심 공고를 저장하세요.
          </p>
        </div>
        <div className="compact-hero-card">
          <span className="compact-kicker">현황</span>
          <strong>{loading && jobs.length === 0 ? '불러오는 중...' : `${filteredJobs.length}개 공고`}</strong>
          <p>커피챗 요청 또는 바로 지원이 가능합니다.</p>
        </div>
      </section>

      <section className="jobs-section section-card">
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

        <div className="jobs-toolbar">
          <label className="search-box">
            <span>검색</span>
            <input type="search" placeholder="회사명, 직무, 키워드로 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <div className="filter-group">
            <span>필터 현황</span>
            <div className="results-chip-row">
              <span className="results-chip">직군: {activeRole}</span>
              <span className="results-chip">지역: {activeLocation}</span>
            </div>
          </div>
        </div>

        <div className="filter-row" aria-label="직군 필터">
          {roleFilters.map((role) => (
            <button className={`filter-pill ${activeRole === role ? 'active' : ''}`} key={role} type="button" onClick={() => startTransition(() => setActiveRole(role))}>
              {role}
            </button>
          ))}
        </div>

        <div className="filter-row" aria-label="지역 필터">
          {locationFilters.map((loc) => (
            <button className={`filter-pill ${activeLocation === loc ? 'active' : ''}`} key={loc} type="button" onClick={() => startTransition(() => setActiveLocation(loc))}>
              {loc}
            </button>
          ))}
        </div>

        <div className="results-meta">
          <span>{loading ? '불러오는 중...' : `총 ${filteredJobs.length}개 공고`}</span>
          <span>{activeRole} · {activeLocation}{user?.id ? ` · 저장 ${savedJobs.length}건` : ''}</span>
        </div>

        <div className="jobs-layout">
          <div className="jobs-grid">
            {loading ? (
              <div className="empty-state">
                <strong>공고를 불러오는 중입니다</strong>
                <p>잠시만 기다려주세요.</p>
              </div>
            ) : filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <article className="job-card" key={job.id}>
                  <div className="job-card-head">
                    <div>
                      <div className="job-meta">
                        <span className="job-badge">{job.badge}</span>
                        {job.companySlug ? (
                          <Link className="job-company" to={`/companies/${job.companySlug}`}>{job.company}</Link>
                        ) : (
                          <span className="job-company">{job.company}</span>
                        )}
                      </div>
                      <h3 className="job-title">{job.title}</h3>
                    </div>
                    <span className="deadline-pill">{job.deadline}</span>
                  </div>
                  <p className="job-summary">{job.summary}</p>
                  <div className="job-detail-row">
                    <span>{job.role}</span>
                    <span>{job.location}</span>
                    <span>{job.arrangement}</span>
                    <span>{job.experience}</span>
                    <span>{job.education}</span>
                  </div>
                  <footer>
                    {user?.id ? (
                      <button className="text-link button-reset" disabled={savingJobId === job.id} type="button" onClick={() => handleToggleSave(job)}>
                        {savingJobId === job.id ? '처리 중...' : savedJobIdSet.has(job.id) ? '저장 해제' : '관심 공고 저장'}
                      </button>
                    ) : (
                      <span className="job-footnote">커피챗 · 지원 가능</span>
                    )}
                    <Link className="job-cta" to={`/jobs/${job.slug}`}>상세 보기</Link>
                  </footer>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <strong>조건에 맞는 공고가 없습니다</strong>
                <p>검색어나 필터를 조정해보세요.</p>
              </div>
            )}
          </div>

          <aside className="jobs-sidebar-card">
            <p className="eyebrow">이용 안내</p>
            <h2>공고 탐색 후 다음 단계</h2>
            <ul className="sidebar-list">
              <li>관심 공고를 저장하고 상세 페이지에서 커피챗을 요청하세요.</li>
              <li>학교 인증을 완료하면 지원 시 우선 매칭 혜택이 있습니다.</li>
              <li>기업 정보 페이지에서 회사 문화와 채용 프로세스를 확인하세요.</li>
            </ul>
            <div className="sidebar-actions">
              <Link className="primary-button" to="/auth">시작하기</Link>
              <Link className="secondary-button" to="/companies">기업 탐색</Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
