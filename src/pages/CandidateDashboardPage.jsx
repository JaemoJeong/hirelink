import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCandidateDashboard, withdrawApplication } from '../lib/platformApi.js'
import { useAuth } from '../providers/AuthProvider.jsx'

const verificationStatusLabelMap = {
  pending: '미인증',
  submitted: '검토중',
  verified: '인증 완료',
  rejected: '재검토 필요',
}

const applicationStatusLabelMap = {
  submitted: '지원 완료',
  reviewing: '검토중',
  interview: '인터뷰',
  offer: '오퍼',
  rejected: '불합격',
  withdrawn: '지원 철회',
}

function formatDateTime(value) {
  if (!value) {
    return '-'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toISOString().slice(0, 16).replace('T', ' ')
}

function isWithdrawableApplication(status) {
  return ['submitted', 'reviewing', 'interview'].includes(status)
}

export function CandidateDashboardPage() {
  const { user, profile } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applicationSearch, setApplicationSearch] = useState('')
  const [applicationFilter, setApplicationFilter] = useState('전체')
  const [selectedApplicationId, setSelectedApplicationId] = useState('')
  const [actionSubmittingKey, setActionSubmittingKey] = useState('')
  const [status, setStatus] = useState({ tone: 'neutral', message: '' })

  useEffect(() => {
    let ignore = false

    async function loadDashboard() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      setLoading(true)

      const { data, error } = await fetchCandidateDashboard(user.id)

      if (ignore) {
        return
      }

      setDashboard(data ?? null)
      setStatus(error ? { tone: 'error', message: error.message } : { tone: 'neutral', message: '' })
      setLoading(false)
    }

    loadDashboard()

    return () => {
      ignore = true
    }
  }, [user?.id])

  const profileSummary = dashboard?.profileSummary ?? null
  const applications = dashboard?.applications ?? []
  const metrics = dashboard?.metrics ?? []
  const applicationFilterOptions = useMemo(
    () => ['전체', ...new Set(applications.map((item) => item.status).filter(Boolean))],
    [applications],
  )
  const filteredApplications = useMemo(() => {
    const query = applicationSearch.trim().toLowerCase()

    return applications.filter((application) => {
      const matchesFilter =
        applicationFilter === '전체' || application.status === applicationFilter
      const matchesSearch =
        query.length === 0 ||
        [application.title, application.company, application.coverNote]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(query))

      return matchesFilter && matchesSearch
    })
  }, [applicationFilter, applicationSearch, applications])
  const selectedApplication = useMemo(() => {
    if (!filteredApplications.length) {
      return null
    }

    return (
      filteredApplications.find((application) => application.id === selectedApplicationId) ??
      filteredApplications[0]
    )
  }, [filteredApplications, selectedApplicationId])

  const displayName =
    profileSummary?.fullName ??
    profile?.full_name ??
    user?.user_metadata?.full_name ??
    user?.email?.split('@')[0] ??
    'Candidate'
  const verificationLabel =
    verificationStatusLabelMap[profileSummary?.verificationStatus] ?? '미설정'

  async function handleWithdrawApplication(application) {
    if (!application?.id || !isWithdrawableApplication(application.status)) {
      return
    }

    setActionSubmittingKey(`application:${application.id}`)
    setStatus({ tone: 'neutral', message: '' })

    const { data, error } = await withdrawApplication({
      applicationId: application.id,
      note: 'Candidate withdrew application from simplified dashboard',
    })

    if (error) {
      setStatus({ tone: 'error', message: error.message })
      setActionSubmittingKey('')
      return
    }

    setDashboard((currentDashboard) => {
      if (!currentDashboard) {
        return currentDashboard
      }

      const nextApplications = (currentDashboard.applications ?? []).map((item) =>
        item.id === application.id
          ? {
              ...item,
              status: data?.to_status ?? 'withdrawn',
              lastUpdatedAt: formatDateTime(data?.changed_at ?? new Date().toISOString()),
              history: [
                {
                  id: `withdraw-${application.id}-${Date.now()}`,
                  fromStatus: data?.from_status ?? item.status,
                  toStatus: data?.to_status ?? 'withdrawn',
                  note: '마이페이지에서 지원을 철회했습니다.',
                  createdAt: formatDateTime(data?.changed_at ?? new Date().toISOString()),
                },
                ...(item.history ?? []),
              ],
            }
          : item,
      )

      const activeApplications = nextApplications.filter(
        (item) => !['rejected', 'withdrawn'].includes(item.status),
      ).length

      return {
        ...currentDashboard,
        applications: nextApplications,
        metrics: [
          { label: '지원 현황', value: `${nextApplications.length}건` },
          { label: '진행중 지원', value: `${activeApplications}건` },
          currentDashboard.metrics?.[2] ?? { label: '학교 인증', value: verificationLabel },
        ],
      }
    })

    setStatus({ tone: 'success', message: '지원 상태를 철회로 변경했습니다.' })
    setActionSubmittingKey('')
  }

  return (
    <>
      <section className="page-hero section-card compact-hero">
        <div>
          <p className="eyebrow">마이페이지</p>
          <h1>{displayName}님, 안녕하세요</h1>
          <p>
            프로필, 학교 인증 상태, 지원 현황을 확인하고 관리하세요.
          </p>
        </div>
        <div className="compact-hero-card">
          <span className="compact-kicker">Verification</span>
          <strong>{loading ? '불러오는 중...' : verificationLabel}</strong>
          <p>
            {profileSummary?.headline
              ? profileSummary.headline
              : '학교 인증과 기본 프로필을 채우면 기업이 지원자를 더 빨리 이해할 수 있습니다.'}
          </p>
        </div>
      </section>

      <section className="metric-grid">
        {metrics.map((metric) => (
          <article className="section-card metric-panel" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{loading ? '...' : metric.value}</strong>
          </article>
        ))}
      </section>

      {status.message ? (
        <section className={`status-banner status-${status.tone}`}>
          <strong>
            {status.tone === 'error' ? '오류' : status.tone === 'success' ? '완료' : '안내'}
          </strong>
          <p>{status.message}</p>
        </section>
      ) : null}

      <section className="jobs-layout">
        <article className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Profile Snapshot</p>
              <h2>기본 프로필과 인증 상태</h2>
            </div>
            <p>핵심 채용 흐름에 필요한 정보만 남겼습니다.</p>
          </div>

          <div className="resume-editor-grid">
            <label className="field">
              <span>이름</span>
              <input readOnly value={displayName} />
            </label>

            <label className="field">
              <span>이메일</span>
              <input readOnly value={user?.email ?? ''} />
            </label>

            <label className="field">
              <span>학교</span>
              <input readOnly value={profileSummary?.universityName || '아직 등록되지 않았습니다'} />
            </label>

            <label className="field">
              <span>인증 상태</span>
              <input readOnly value={verificationLabel} />
            </label>

            <label className="field">
              <span>학교 이메일</span>
              <input readOnly value={profileSummary?.schoolEmail || '미입력'} />
            </label>

            <label className="field">
              <span>졸업 연도</span>
              <input readOnly value={profileSummary?.graduationYear || '미입력'} />
            </label>

            <label className="field">
              <span>전공</span>
              <input readOnly value={profileSummary?.major || '미입력'} />
            </label>

            <label className="field">
              <span>헤드라인</span>
              <input readOnly value={profileSummary?.headline || '미입력'} />
            </label>

            <label className="field resume-editor-full">
              <span>자기소개</span>
              <textarea
                readOnly
                value={profileSummary?.bio || '아직 자기소개가 없습니다. 학교 인증 화면에서 입력할 수 있습니다.'}
              />
            </label>
          </div>

          <div className="sidebar-actions">
            <Link className="primary-button" to="/verify">
              프로필 수정
            </Link>
            <Link className="secondary-button" to="/jobs">
              공고 보러가기
            </Link>
          </div>
        </article>

        <article className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Applications</p>
              <h2>최근 지원 현황</h2>
            </div>
            <p>핵심 채용 흐름은 지원 상태와 히스토리만으로도 충분히 보여줄 수 있습니다.</p>
          </div>

          {applications.length > 0 ? (
            <div className="notification-list">
              <label className="search-box">
                <span>공고명, 회사명, 메모 검색</span>
                <input
                  type="search"
                  placeholder="예: strategy, AI, cover note"
                  value={applicationSearch}
                  onChange={(event) => setApplicationSearch(event.target.value)}
                />
              </label>

              <div className="filter-row" aria-label="지원 상태 필터">
                {applicationFilterOptions.map((filter) => (
                  <button
                    key={filter}
                    className={`filter-pill ${applicationFilter === filter ? 'active' : ''}`}
                    type="button"
                    onClick={() => setApplicationFilter(filter)}
                  >
                    {filter === '전체' ? filter : applicationStatusLabelMap[filter] ?? filter}
                  </button>
                ))}
              </div>

              <div className="results-meta">
                <span>총 {filteredApplications.length}건 표시 중</span>
                <span>상태 {applicationFilter}</span>
              </div>

              {selectedApplication ? (
                <aside className="candidate-application-detail" aria-label="선택한 지원 상세">
                  <div className="notification-meta">
                    <span className="check-pill complete">
                      {applicationStatusLabelMap[selectedApplication.status] ?? selectedApplication.status}
                    </span>
                    <span>최근 변경 {selectedApplication.lastUpdatedAt || '-'}</span>
                  </div>
                  <div>
                    <h3>{selectedApplication.title}</h3>
                    <p>{selectedApplication.company}</p>
                  </div>
                  <div className="candidate-detail-grid">
                    <div>
                      <span>직군</span>
                      <strong>{selectedApplication.role || '직군 미정'}</strong>
                    </div>
                    <div>
                      <span>근무지</span>
                      <strong>{selectedApplication.location || '위치 협의'}</strong>
                    </div>
                    <div>
                      <span>근무 형태</span>
                      <strong>{selectedApplication.arrangement || '협의'}</strong>
                    </div>
                    <div>
                      <span>마감</span>
                      <strong>{selectedApplication.deadline || '상시'}</strong>
                    </div>
                  </div>
                  {selectedApplication.summary ? <p>{selectedApplication.summary}</p> : null}
                  {selectedApplication.tags?.length ? (
                    <div className="results-chip-row">
                      {selectedApplication.tags.slice(0, 5).map((tag) => (
                        <span className="results-chip" key={`${selectedApplication.id}-${tag}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="candidate-cover-note">
                    <span>지원 메모</span>
                    <p>{selectedApplication.coverNote || '별도 메모 없이 지원했습니다.'}</p>
                  </div>
                  <div className="candidate-status-timeline">
                    <span>상태 히스토리</span>
                    {selectedApplication.history?.length ? (
                      <div className="timeline">
                        {selectedApplication.history.map((historyItem, index) => (
                          <article className="timeline-item candidate-timeline-item" key={historyItem.id}>
                            <span className="timeline-number">{index + 1}</span>
                            <div>
                              <h3>
                                {applicationStatusLabelMap[historyItem.fromStatus] ?? historyItem.fromStatus ?? '시작'} →{' '}
                                {applicationStatusLabelMap[historyItem.toStatus] ?? historyItem.toStatus ?? '업데이트'}
                              </h3>
                              <p>{historyItem.note || '상태가 업데이트되었습니다.'}</p>
                              <small>{historyItem.createdAt || '-'}</small>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p>아직 상태 변경 이력이 없습니다.</p>
                    )}
                  </div>
                  <div className="notification-actions">
                    <span>지원일 {selectedApplication.appliedAt || '-'}</span>
                    <div className="notification-action-group">
                      {isWithdrawableApplication(selectedApplication.status) ? (
                        <button
                          className="secondary-button"
                          disabled={actionSubmittingKey === `application:${selectedApplication.id}`}
                          type="button"
                          onClick={() => handleWithdrawApplication(selectedApplication)}
                        >
                          {actionSubmittingKey === `application:${selectedApplication.id}` ? '처리 중...' : '지원 철회'}
                        </button>
                      ) : null}
                      <Link className="primary-button" to={selectedApplication.linkPath}>
                        공고 보기
                      </Link>
                    </div>
                  </div>
                </aside>
              ) : (
                <div className="empty-state">
                  <strong>조건에 맞는 지원 내역이 없습니다.</strong>
                  <p>검색어를 바꾸거나 다른 상태 필터를 선택해보세요.</p>
                </div>
              )}

              <div className="notification-list">
                {filteredApplications.map((application) => (
                  <article
                    className={`notification-card ${selectedApplication?.id === application.id ? 'unread' : ''}`}
                    key={application.id}
                  >
                    <div className="notification-actions">
                      <div>
                        <strong>{application.title}</strong>
                        <p>{application.company}</p>
                      </div>
                      <button
                        className="text-link button-reset"
                        type="button"
                        onClick={() => setSelectedApplicationId(application.id)}
                      >
                        상세 보기
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <strong>아직 지원한 공고가 없습니다.</strong>
              <p>기업 정보를 살펴본 뒤 원하는 공고에 첫 지원을 남겨보세요.</p>
              <Link className="primary-button" to="/jobs">
                공고 보러가기
              </Link>
            </div>
          )}
        </article>
      </section>
    </>
  )
}
