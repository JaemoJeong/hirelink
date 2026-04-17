import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAllApplications, adminUpdateApplicationStatus } from '../lib/platformApi.js'
import { useAuth } from '../providers/AuthProvider.jsx'

const statusLabelMap = {
  submitted: '지원 완료',
  reviewing: '검토중',
  interview: '인터뷰',
  offer: '오퍼',
  rejected: '불합격',
  withdrawn: '철회',
}

const statusOptions = [
  { value: 'submitted', label: '지원 완료' },
  { value: 'reviewing', label: '검토중' },
  { value: 'interview', label: '인터뷰' },
  { value: 'offer', label: '오퍼' },
  { value: 'rejected', label: '불합격' },
]

function formatDate(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toISOString().slice(0, 16).replace('T', ' ')
}

export function AdminApplicationsPage() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('전체')
  const [selectedId, setSelectedId] = useState('')
  const [updatingId, setUpdatingId] = useState('')
  const [status, setStatus] = useState({ tone: 'neutral', message: '' })

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      const { data, error } = await listAllApplications()
      if (ignore) return
      setApplications(data ?? [])
      if (error) setStatus({ tone: 'error', message: error.message })
      setLoading(false)
    }
    load()
    return () => { ignore = true }
  }, [user?.id])

  const filterOptions = useMemo(
    () => ['전체', ...new Set(applications.map((a) => a.status).filter(Boolean))],
    [applications],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return applications.filter((app) => {
      const matchStatus = statusFilter === '전체' || app.status === statusFilter
      const name = app.profiles?.full_name || ''
      const email = app.profiles?.school_email || ''
      const title = app.jobs?.title || ''
      const company = app.jobs?.companies?.name || ''
      const matchSearch = q.length === 0 || [name, email, title, company].some((f) => f.toLowerCase().includes(q))
      return matchStatus && matchSearch
    })
  }, [applications, search, statusFilter])

  const selected = useMemo(
    () => filtered.find((a) => a.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId],
  )

  const metrics = useMemo(() => {
    const total = applications.length
    const active = applications.filter((a) => !['rejected', 'withdrawn'].includes(a.status)).length
    const reviewing = applications.filter((a) => a.status === 'reviewing').length
    const interview = applications.filter((a) => a.status === 'interview').length
    return [
      { label: '전체 지원', value: `${total}건` },
      { label: '진행중', value: `${active}건` },
      { label: '검토중', value: `${reviewing}건` },
      { label: '인터뷰', value: `${interview}건` },
    ]
  }, [applications])

  async function handleUpdateStatus(app, nextStatus) {
    if (!app?.id) return
    setUpdatingId(app.id)
    setStatus({ tone: 'neutral', message: '' })
    const { error } = await adminUpdateApplicationStatus({
      applicationId: app.id,
      nextStatus,
      note: '',
    })
    if (error) {
      setStatus({ tone: 'error', message: error.message })
      setUpdatingId('')
      return
    }
    setApplications((curr) =>
      curr.map((a) => a.id === app.id ? { ...a, status: nextStatus } : a),
    )
    setStatus({ tone: 'success', message: `상태를 "${statusLabelMap[nextStatus]}"로 변경했습니다.` })
    setUpdatingId('')
  }

  return (
    <>
      <section className="page-hero section-card compact-hero">
        <div>
          <p className="eyebrow">지원 관리</p>
          <h1>전체 지원 현황</h1>
          <p>들어온 모든 지원을 확인하고 상태를 관리합니다.</p>
        </div>
        <div className="compact-hero-card">
          <span className="compact-kicker">현황</span>
          <strong>{loading ? '불러오는 중...' : `${applications.length}건 지원`}</strong>
          <p>지원자 정보, 포지션, 상태를 한눈에 확인하세요.</p>
        </div>
      </section>

      <section className="metric-grid">
        {metrics.map((m) => (
          <article className="section-card metric-panel" key={m.label}>
            <span>{m.label}</span>
            <strong>{loading ? '-' : m.value}</strong>
          </article>
        ))}
      </section>

      {status.message ? (
        <section className={`status-banner status-${status.tone}`}>
          <strong>{status.tone === 'error' ? '오류' : '완료'}</strong>
          <p>{status.message}</p>
        </section>
      ) : null}

      <section className="section-card">
        <div className="jobs-toolbar">
          <label className="search-box">
            <span>검색</span>
            <input type="search" placeholder="지원자명, 이메일, 포지션, 회사명" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <div className="filter-group">
            <span>필터</span>
            <div className="results-chip-row">
              <span className="results-chip">상태: {statusFilter}</span>
              <span className="results-chip">{filtered.length}건</span>
            </div>
          </div>
        </div>

        <div className="filter-row">
          {filterOptions.map((f) => (
            <button className={`filter-pill ${statusFilter === f ? 'active' : ''}`} key={f} type="button" onClick={() => setStatusFilter(f)}>
              {f === '전체' ? f : statusLabelMap[f] ?? f}
            </button>
          ))}
        </div>
      </section>

      <section className="jobs-layout">
        <article className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">지원 목록</p>
              <h2>최근 지원 내역</h2>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <strong>불러오는 중...</strong>
            </div>
          ) : filtered.length > 0 ? (
            <div className="notification-list">
              {filtered.map((app) => (
                <article
                  className={`notification-card ${selected?.id === app.id ? 'unread' : ''}`}
                  key={app.id}
                >
                  <div className="notification-meta">
                    <span className={`check-pill ${app.status === 'interview' || app.status === 'offer' ? 'complete' : ''}`}>
                      {statusLabelMap[app.status] ?? app.status}
                    </span>
                    <span>{formatDate(app.applied_at)}</span>
                  </div>
                  <div className="notification-actions">
                    <div>
                      <strong>{app.profiles?.full_name || '이름 없음'}</strong>
                      <p>{app.jobs?.title || '포지션 미상'} — {app.jobs?.companies?.name || ''}</p>
                    </div>
                    <button className="text-link button-reset" type="button" onClick={() => setSelectedId(app.id)}>
                      상세
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>지원 내역이 없습니다</strong>
              <p>아직 들어온 지원이 없거나 필터 조건에 맞는 지원이 없습니다.</p>
            </div>
          )}
        </article>

        <aside className="section-card jobs-sidebar-card">
          {selected ? (
            <>
              <p className="eyebrow">지원 상세</p>
              <h2>{selected.profiles?.full_name || '지원자'}</h2>

              <div className="resume-checklist">
                <article className="resume-check-item">
                  <div className="resume-check-head">
                    <strong>지원자 정보</strong>
                    <span className={`check-pill ${selected.profiles?.verification_status === 'verified' ? 'complete' : ''}`}>
                      {selected.profiles?.verification_status === 'verified' ? '인증완료' : '미인증'}
                    </span>
                  </div>
                  <ul>
                    <li>이메일: {selected.profiles?.school_email || '-'}</li>
                    <li>전공: {selected.profiles?.major || '-'}</li>
                    <li>한줄소개: {selected.profiles?.headline || '-'}</li>
                  </ul>
                </article>

                <article className="resume-check-item">
                  <div className="resume-check-head">
                    <strong>포지션</strong>
                  </div>
                  <ul>
                    <li>{selected.jobs?.title || '-'}</li>
                    <li>{selected.jobs?.companies?.name || '-'}</li>
                    <li>{selected.jobs?.role || '-'} · {selected.jobs?.location || '-'}</li>
                    <li>{selected.jobs?.arrangement || '-'}</li>
                  </ul>
                </article>

                <article className="resume-check-item">
                  <div className="resume-check-head">
                    <strong>지원 메모</strong>
                  </div>
                  <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.7 }}>
                    {selected.cover_note || '메모 없이 지원했습니다.'}
                  </p>
                </article>
              </div>

              <div className="section-heading">
                <div>
                  <p className="eyebrow">상태 변경</p>
                  <h2>지원 상태 관리</h2>
                </div>
              </div>

              <div className="sidebar-actions stacked">
                {statusOptions.map((opt) => (
                  <button
                    className={selected.status === opt.value ? 'primary-button full-width' : 'secondary-button full-width'}
                    disabled={updatingId === selected.id || selected.status === opt.value}
                    key={opt.value}
                    type="button"
                    onClick={() => handleUpdateStatus(selected, opt.value)}
                  >
                    {updatingId === selected.id ? '처리 중...' : opt.label}
                  </button>
                ))}
              </div>

              <p className="results-meta">지원일: {formatDate(selected.applied_at)}</p>

              {selected.jobs?.slug ? (
                <Link className="text-link" to={`/jobs/${selected.jobs.slug}`}>공고 보기 →</Link>
              ) : null}
              {selected.jobs?.companies?.slug ? (
                <Link className="text-link" to={`/companies/${selected.jobs.companies.slug}`}>기업 정보 →</Link>
              ) : null}
            </>
          ) : (
            <>
              <p className="eyebrow">안내</p>
              <h2>지원을 선택하세요</h2>
              <p>왼쪽 목록에서 지원을 클릭하면 상세 정보와 상태 변경 옵션이 표시됩니다.</p>
            </>
          )}
        </aside>
      </section>
    </>
  )
}
