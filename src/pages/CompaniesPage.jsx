import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCompanyListSnapshot, listCompanies } from '../lib/platformApi.js'

function getCompanyInfoScore(company) {
  const checks = [
    company.tagline, company.description, company.mission, company.culture,
    company.benefits?.length, company.hiringProcess?.length, company.websiteUrl,
    company.logoUrl, company.jobCount > 0,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

function getCompanyHiringSignal(company) {
  if (company.jobCount > 0) return '채용중'
  if (getCompanyInfoScore(company) >= 70) return '정보 풍부'
  return '준비중'
}

function buildStudentSignalList(company) {
  const signals = []
  if (company.jobCount > 0) signals.push(`공개 공고 ${company.jobCount}건`)
  if (company.jobs?.[0]?.title) signals.push(`대표 포지션: ${company.jobs[0].title}`)
  if (company.hiringProcess?.length) signals.push(`채용 프로세스: ${company.hiringProcess.slice(0, 3).join(' → ')}`)
  if (company.benefits?.length) signals.push(`${company.benefits.slice(0, 2).join(', ')}`)
  if (company.mission) signals.push(company.mission)
  return signals.slice(0, 3)
}

export function CompaniesPage() {
  const [companies, setCompanies] = useState(() => getCompanyListSnapshot())
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('전체')
  const [sortMode, setSortMode] = useState('추천순')
  const [hiringOnly, setHiringOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(true)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    let ignore = false
    async function loadCompanies() {
      setSyncing(true)
      const { data, error } = await listCompanies()
      if (ignore) return
      setCompanies(data ?? [])
      setLoadError(error ?? null)
      setLoading(false)
      setSyncing(false)
    }
    loadCompanies()
    return () => { ignore = true }
  }, [])

  const categoryOptions = useMemo(
    () => ['전체', ...new Set(companies.map((c) => c.category).filter(Boolean))],
    [companies],
  )

  const filteredCompanies = useMemo(() => {
    const query = search.trim().toLowerCase()
    return companies
      .map((c) => ({ ...c, infoScore: getCompanyInfoScore(c), hiringSignal: getCompanyHiringSignal(c) }))
      .filter((c) => {
        const matchesCategory = categoryFilter === '전체' || c.category === categoryFilter
        const matchesHiring = !hiringOnly || c.jobCount > 0
        const matchesSearch = query.length === 0 || [c.name, c.category, c.tagline, c.description, c.mission, c.culture, c.headquarters, ...(c.benefits ?? []), ...(c.hiringProcess ?? []), ...(c.jobs ?? []).map((j) => j.title)].filter(Boolean).some((f) => f.toLowerCase().includes(query))
        return matchesCategory && matchesHiring && matchesSearch
      })
      .sort((a, b) => {
        if (sortMode === '공고순') return b.jobCount - a.jobCount
        if (sortMode === '정보순') return b.infoScore - a.infoScore
        return (b.jobCount * 12 + b.infoScore) - (a.jobCount * 12 + a.infoScore)
      })
  }, [categoryFilter, companies, hiringOnly, search, sortMode])

  const featuredCompanies = useMemo(() => filteredCompanies.slice(0, 3), [filteredCompanies])

  const companyMetrics = useMemo(() => {
    const openJobCount = companies.reduce((sum, c) => sum + (c.jobCount ?? 0), 0)
    const richCount = companies.filter((c) => getCompanyInfoScore(c) >= 70).length
    const activeCount = companies.filter((c) => c.jobCount > 0).length
    return [
      { label: '파트너 기업', value: `${companies.length}개` },
      { label: '공개 공고', value: `${openJobCount}건` },
      { label: '채용중', value: `${activeCount}개` },
      { label: '정보 충실', value: `${richCount}개` },
    ]
  }, [companies])

  return (
    <>
      <section className="page-hero section-card compact-hero">
        <div>
          <p className="eyebrow">기업 정보</p>
          <h1>파트너 기업을 한눈에</h1>
          <p>
            엘리트잡 파트너 기업의 미션, 문화, 채용 정보를 비교하고
            관심 기업의 공고를 바로 확인하세요.
          </p>
        </div>
        <div className="compact-hero-card">
          <span className="compact-kicker">파트너</span>
          <strong>{loading ? '불러오는 중...' : `${companies.length}개 기업`}</strong>
          <p>채용중인 기업을 중심으로 탐색하세요.</p>
        </div>
      </section>

      {loadError && !companies.length ? (
        <section className="status-banner status-error">
          <strong>기업 정보를 불러오지 못했습니다</strong>
          <p>{loadError.message}</p>
        </section>
      ) : null}

      <section className="metric-grid">
        {companyMetrics.map((m) => (
          <article className="section-card metric-panel" key={m.label}>
            <span>{m.label}</span>
            <strong>{loading ? '-' : m.value}</strong>
          </article>
        ))}
      </section>

      <section className="section-card company-intel-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">주목할 기업</p>
            <h2>이번 주 추천 기업</h2>
          </div>
          <p>정보 밀도와 공개 공고를 기준으로 선정한 기업입니다.</p>
        </div>

        <div className="demo-flow-grid">
          {featuredCompanies.map((company) => (
            <article className="notification-card company-spotlight-card" key={`featured-${company.id}`}>
              <div className="notification-meta">
                <span className="check-pill complete">{company.category}</span>
                <span>{company.headquarters}</span>
              </div>
              <strong>{company.name}</strong>
              <p>{company.tagline || company.description}</p>
              <div className="results-chip-row">
                <span className="results-chip">정보 {company.infoScore}%</span>
                <span className="results-chip">공고 {company.jobCount}건</span>
                <span className="results-chip">{company.hiringSignal}</span>
              </div>
              <ul className="sidebar-list compact-list">
                {buildStudentSignalList(company).map((signal) => (
                  <li key={`${company.id}-${signal}`}>{signal}</li>
                ))}
              </ul>
              <div className="sidebar-actions">
                <Link className="primary-button" to={`/companies/${company.slug}`}>기업 정보 보기</Link>
                {company.jobs?.[0] ? (
                  <Link className="secondary-button" to={`/jobs/${company.jobs[0].slug}`}>대표 공고</Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">전체 기업</p>
            <h2>기업 검색 · 필터</h2>
          </div>
          <p>카테고리, 채용 여부, 정보 완성도로 비교하세요.</p>
        </div>

        <div className="jobs-toolbar">
          <label className="search-box">
            <span>검색</span>
            <input type="search" placeholder="기업명, 카테고리, 위치" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <label className="field">
            <span>카테고리</span>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="filter-row">
          {['추천순', '공고순', '정보순'].map((mode) => (
            <button className={`filter-pill ${sortMode === mode ? 'active' : ''}`} key={mode} type="button" onClick={() => setSortMode(mode)}>
              {mode}
            </button>
          ))}
          <button className={`filter-pill ${hiringOnly ? 'active' : ''}`} type="button" onClick={() => setHiringOnly((v) => !v)}>
            채용중만
          </button>
        </div>

        <div className="results-meta">
          <span>총 {filteredCompanies.length}개 기업</span>
          <span>{categoryFilter} · {sortMode}</span>
        </div>

        <div className="community-grid">
          {loading && companies.length === 0 ? (
            <div className="empty-state">
              <strong>기업 정보를 불러오는 중입니다</strong>
              <p>잠시만 기다려주세요.</p>
            </div>
          ) : filteredCompanies.length > 0 ? (
            filteredCompanies.map((company) => (
              <article className="section-card community-card" key={company.id}>
                <div className="job-meta">
                  {company.logoUrl ? <img alt={`${company.name} 로고`} className="company-logo-chip" src={company.logoUrl} /> : null}
                  <span className="job-badge">{company.category}</span>
                  <span className="job-company">{company.headquarters}</span>
                </div>
                <h2>{company.name}</h2>
                <p>{company.tagline || company.description}</p>
                <div className="company-intel-bar">
                  <span>정보 완성도 {company.infoScore}%</span>
                  <div className="meter-track">
                    <div className="meter-fill" style={{ width: `${company.infoScore}%` }} />
                  </div>
                </div>
                <div className="results-chip-row">
                  <span className="results-chip">공고 {company.jobCount}건</span>
                  <span className="results-chip">{company.hiringSignal}</span>
                  {company.isPartner ? <span className="results-chip">파트너</span> : null}
                </div>
                {company.jobs?.[0] ? (
                  <p className="company-card-footnote">대표 공고: {company.jobs[0].title}</p>
                ) : (
                  <p className="company-card-footnote">공개 공고 준비중입니다.</p>
                )}
                <Link className="secondary-button" to={`/companies/${company.slug}`}>기업 정보 보기</Link>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <strong>조건에 맞는 기업이 없습니다</strong>
              <p>검색어나 필터를 조정해보세요.</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
