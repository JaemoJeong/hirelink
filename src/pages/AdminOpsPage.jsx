import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  adminUpdateCommunityReportStatus,
  adminUpdateJobReviewStatus,
  adminUpdateVerificationStatus,
  fetchAdminOpsDashboard,
} from '../lib/platformApi.js'
import { useAuth } from '../providers/AuthProvider.jsx'

const verificationStatusLabelMap = {
  pending: '미인증',
  submitted: '검토중',
  verified: '인증 완료',
  rejected: '재검토 필요',
}

const verificationActionOptions = [
  { value: 'pending', label: '미인증 유지' },
  { value: 'submitted', label: '검토중 유지' },
  { value: 'verified', label: '인증 승인' },
  { value: 'rejected', label: '반려' },
]

const communityReportStatusOptions = [
  { value: 'open', label: '열림' },
  { value: 'reviewing', label: '검토중' },
  { value: 'resolved', label: '해결' },
  { value: 'dismissed', label: '기각' },
]

const jobReviewStatusOptions = [
  { value: 'pending_review', label: '검수 대기' },
  { value: 'published', label: '공개 승인' },
  { value: 'rejected', label: '반려' },
  { value: 'closed', label: '마감' },
]

function getEmailDomain(email) {
  const [, domain = ''] = String(email ?? '').split('@')
  return domain.trim().toLowerCase()
}

export function AdminOpsPage() {
  const { user, profile } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submittingProfileId, setSubmittingProfileId] = useState('')
  const [selectedProfileId, setSelectedProfileId] = useState('')
  const [search, setSearch] = useState('')
  const [filterMode, setFilterMode] = useState('전체')
  const [statusDrafts, setStatusDrafts] = useState({})
  const [status, setStatus] = useState({ tone: 'neutral', message: '' })

  useEffect(() => {
    let ignore = false

    async function loadDashboard() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      setLoading(true)
      const { data, error } = await fetchAdminOpsDashboard(user.id)

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

  const metrics = dashboard?.metrics ?? []
  const verificationQueue = dashboard?.verificationQueue ?? []
  const jobReviewQueue = dashboard?.jobReviewQueue ?? []
  const communityReports = dashboard?.communityReports ?? []
  const auditEntries = dashboard?.auditEntries ?? []
  const filterOptions = useMemo(
    () => ['전체', ...new Set(verificationQueue.map((item) => item.verificationStatus).filter(Boolean))],
    [verificationQueue],
  )

  const filteredQueue = useMemo(() => {
    const query = search.trim().toLowerCase()

    return verificationQueue.filter((item) => {
      const matchesFilter = filterMode === '전체' || item.verificationStatus === filterMode
      const matchesSearch =
        query.length === 0 ||
        [item.name, item.schoolEmail, item.universityName, item.major]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(query))

      return matchesFilter && matchesSearch
    })
  }, [filterMode, search, verificationQueue])

  const selectedQueueItem = useMemo(() => {
    if (!filteredQueue.length) {
      return null
    }

    return filteredQueue.find((item) => item.id === selectedProfileId) ?? filteredQueue[0]
  }, [filteredQueue, selectedProfileId])

  const selectedQueueSignals = useMemo(() => {
    if (!selectedQueueItem) {
      return []
    }

    const emailDomain = getEmailDomain(selectedQueueItem.schoolEmail)

    return [
      { label: '요청 ID', value: selectedQueueItem.requestId || '이전 방식 제출' },
      { label: '학교 이메일', value: selectedQueueItem.schoolEmail || '미입력' },
      { label: '이메일 도메인', value: emailDomain || '도메인 없음' },
      { label: '학교', value: selectedQueueItem.universityName || '미지정' },
      { label: '전공/졸업', value: `${selectedQueueItem.major} / ${selectedQueueItem.graduationYear}` },
      { label: '최근 검토', value: selectedQueueItem.reviewedAt || '미검토' },
    ]
  }, [selectedQueueItem])

  async function handleSaveVerificationStatus(queueItem, forcedStatus = null) {
    const nextStatus = forcedStatus ?? statusDrafts[queueItem.id] ?? queueItem.verificationStatus

    if (nextStatus === queueItem.verificationStatus) {
      setStatus({ tone: 'neutral', message: '변경된 상태가 없습니다.' })
      return
    }

    setSubmittingProfileId(queueItem.id)
    setStatus({ tone: 'neutral', message: '' })

    const { data, error } = await adminUpdateVerificationStatus({
      profileId: queueItem.id,
      nextStatus,
      note:
        nextStatus === 'rejected'
          ? '운영 검토 결과 반려되었습니다. 정보를 수정한 뒤 다시 제출해 주세요.'
          : null,
    })

    if (error) {
      setStatus({ tone: 'error', message: error.message })
      setSubmittingProfileId('')
      return
    }

    setDashboard((currentDashboard) => {
      if (!currentDashboard) {
        return currentDashboard
      }

      const nextQueue = (currentDashboard.verificationQueue ?? []).map((item) =>
        item.id === queueItem.id
          ? {
              ...item,
              verificationStatus: data?.to_status ?? nextStatus,
              submittedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            }
          : item,
      )

      return {
        ...currentDashboard,
        verificationQueue: nextQueue,
        metrics: [
          { label: '검토 대기', value: `${nextQueue.filter((item) => item.verificationStatus === 'submitted').length}건` },
          { label: '인증 완료', value: `${nextQueue.filter((item) => item.verificationStatus === 'verified').length}명` },
          { label: '반려 상태', value: `${nextQueue.filter((item) => item.verificationStatus === 'rejected').length}건` },
          ...(currentDashboard.metrics ?? []).slice(3),
        ],
        auditEntries: [
          {
            id: `verification-${queueItem.id}-${Date.now()}`,
            actorName: profile?.full_name ?? user?.email ?? '운영자',
            entityType: 'profile',
            action: 'admin_update_verification_status',
            createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            summary: `${queueItem.verificationStatus} -> ${data?.to_status ?? nextStatus}`,
          },
          ...(currentDashboard.auditEntries ?? []).slice(0, 11),
        ],
      }
    })

    setStatus({ tone: 'success', message: '학교 인증 상태를 업데이트했습니다.' })
    setSubmittingProfileId('')
  }

  async function handleUpdateCommunityReportStatus(report, nextStatus) {
    setSubmittingProfileId(report.id)
    setStatus({ tone: 'neutral', message: '' })

    const { data, error } = await adminUpdateCommunityReportStatus({
      reportId: report.id,
      nextStatus,
    })

    if (error) {
      setStatus({ tone: 'error', message: error.message })
      setSubmittingProfileId('')
      return
    }

    setDashboard((currentDashboard) => {
      if (!currentDashboard) {
        return currentDashboard
      }

      const nextReports = (currentDashboard.communityReports ?? []).map((item) =>
        item.id === report.id
          ? {
              ...item,
              status: data?.status ?? nextStatus,
              reviewedAt: data?.reviewed_at?.slice(0, 16).replace('T', ' ') ?? item.reviewedAt,
            }
          : item,
      )

      return {
        ...currentDashboard,
        communityReports: nextReports,
        metrics: (currentDashboard.metrics ?? []).map((metric) =>
          metric.label === '커뮤니티 신고'
            ? {
                ...metric,
                value: `${nextReports.filter((item) => item.status === 'open').length}건`,
              }
            : metric,
        ),
      }
    })
    setStatus({ tone: 'success', message: '커뮤니티 신고 상태를 업데이트했습니다.' })
    setSubmittingProfileId('')
  }

  async function handleUpdateJobReviewStatus(job, nextStatus) {
    setSubmittingProfileId(job.id)
    setStatus({ tone: 'neutral', message: '' })

    const { data, error } = await adminUpdateJobReviewStatus({
      jobId: job.id,
      nextStatus,
      note:
        nextStatus === 'rejected'
          ? '운영 검수 결과 반려되었습니다. 공고 내용을 수정한 뒤 다시 요청해 주세요.'
          : null,
    })

    if (error) {
      setStatus({ tone: 'error', message: error.message })
      setSubmittingProfileId('')
      return
    }

    setDashboard((currentDashboard) => {
      if (!currentDashboard) {
        return currentDashboard
      }

      const nextJobs = (currentDashboard.jobReviewQueue ?? []).map((item) =>
        item.id === job.id
          ? {
              ...item,
              status: data?.to_status ?? nextStatus,
              updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            }
          : item,
      )

      return {
        ...currentDashboard,
        jobReviewQueue: nextJobs,
        metrics: (currentDashboard.metrics ?? []).map((metric) =>
          metric.label === '공고 검수'
            ? {
                ...metric,
                value: `${nextJobs.filter((item) => item.status === 'pending_review').length}건`,
              }
            : metric,
        ),
      }
    })
    setStatus({ tone: 'success', message: '공고 검수 상태를 업데이트했습니다.' })
    setSubmittingProfileId('')
  }

  if (loading) {
    return (
      <section className="section-card not-found-panel">
        <p className="eyebrow">Loading</p>
        <h1>운영 대시보드를 준비하는 중입니다</h1>
        <p>플랫폼 운영 데이터와 인증 큐를 불러오고 있습니다.</p>
      </section>
    )
  }

  if (!dashboard?.isAdmin) {
    return (
      <section className="section-card not-found-panel">
        <p className="eyebrow">Admin Ops</p>
        <h1>플랫폼 운영 권한이 필요한 페이지입니다</h1>
        <p>현재 계정은 운영자 권한이 없어 인증 승인 큐와 감사 로그를 볼 수 없습니다.</p>
        <div className="sidebar-actions">
          <Link className="primary-button" to="/verify">
            내 인증 정보 보기
          </Link>
          <Link className="secondary-button" to="/me">
            마이페이지로 돌아가기
          </Link>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="page-hero section-card compact-hero">
        <div>
          <p className="eyebrow">Admin Ops</p>
          <h1>학교 인증 제출과 최근 운영 로그를 한 화면에서 관리합니다</h1>
          <p>
            운영자는 제출된 학교 인증을 검토하고 승인 또는 반려할 수 있으며,
            사용자에게 알림이 가고 감사 로그도 함께 남습니다.
          </p>
        </div>
        <div className="compact-hero-card">
          <span className="compact-kicker">Current Queue</span>
          <strong>{verificationQueue.length}개 프로필 추적 중</strong>
          <p>검토 대기, 승인 완료, 반려 상태를 실데이터 기준으로 요약합니다.</p>
        </div>
      </section>

      {status.message ? (
        <section className={`status-banner status-${status.tone}`}>
          <strong>{status.tone === 'error' ? '오류' : status.tone === 'success' ? '완료' : '안내'}</strong>
          <p>{status.message}</p>
        </section>
      ) : null}

      <section className="metric-grid">
        {metrics.map((metric) => (
          <article className="section-card metric-panel" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>

      <section className="jobs-layout">
        <section className="section-card table-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Verification Queue</p>
              <h2>학교 인증 제출 현황</h2>
            </div>
            <p>검색과 상태 필터로 운영자가 우선순위를 빠르게 정리할 수 있습니다.</p>
          </div>

          <div className="resume-editor-grid">
            <label className="search-box">
              <span>이름, 이메일, 학교, 전공 검색</span>
              <input
                type="search"
                placeholder="예: kaist, cs, @"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          <div className="filter-row" aria-label="인증 상태 필터">
            {filterOptions.map((filter) => (
              <button
                key={filter}
                className={`filter-pill ${filterMode === filter ? 'active' : ''}`}
                type="button"
                onClick={() => setFilterMode(filter)}
              >
                {filter === '전체' ? filter : verificationStatusLabelMap[filter] ?? filter}
              </button>
            ))}
          </div>

          <div className="results-meta">
            <span>총 {filteredQueue.length}건 표시 중</span>
            <span>상태 {filterMode}</span>
          </div>

          {selectedQueueItem ? (
            <aside className="ops-review-panel" aria-label="선택한 학교 인증 요청 상세">
              <div className="notification-meta">
                <span className="check-pill complete">
                  {verificationStatusLabelMap[selectedQueueItem.verificationStatus] ?? selectedQueueItem.verificationStatus}
                </span>
                <span>제출/갱신 {selectedQueueItem.submittedAt || '-'}</span>
              </div>
              <div>
                <h3>{selectedQueueItem.name}</h3>
                <p>
                  인증 요청을 승인하면 사용자에게 알림이 발송되고, 반려하면 재제출 안내 알림과 감사 로그가 남습니다.
                </p>
              </div>
              <div className="ops-signal-grid">
                {selectedQueueSignals.map((signal) => (
                  <div key={signal.label}>
                    <span>{signal.label}</span>
                    <strong>{signal.value}</strong>
                  </div>
                ))}
              </div>
              {selectedQueueItem.requestNote ? (
                <div className="status-banner status-neutral">
                  <strong>최근 요청 메모</strong>
                  <p>{selectedQueueItem.requestNote}</p>
                </div>
              ) : null}
              <div className="resume-editor-grid">
                <label className="field">
                  <span>다음 상태</span>
                  <select
                    value={statusDrafts[selectedQueueItem.id] ?? selectedQueueItem.verificationStatus}
                    onChange={(event) =>
                      setStatusDrafts((currentDrafts) => ({
                        ...currentDrafts,
                        [selectedQueueItem.id]: event.target.value,
                      }))
                    }
                  >
                    {verificationActionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="sidebar-actions">
                <button
                  className="primary-button"
                  disabled={submittingProfileId === selectedQueueItem.id}
                  type="button"
                  onClick={() => handleSaveVerificationStatus(selectedQueueItem, 'verified')}
                >
                  바로 승인
                </button>
                <button
                  className="secondary-button"
                  disabled={submittingProfileId === selectedQueueItem.id}
                  type="button"
                  onClick={() => handleSaveVerificationStatus(selectedQueueItem, 'rejected')}
                >
                  반려 처리
                </button>
                <button
                  className="secondary-button"
                  disabled={submittingProfileId === selectedQueueItem.id}
                  type="button"
                  onClick={() => handleSaveVerificationStatus(selectedQueueItem)}
                >
                  선택 상태 저장
                </button>
              </div>
            </aside>
          ) : null}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>이름</th>
                  <th>학교</th>
                  <th>이메일</th>
                  <th>전공 / 졸업</th>
                  <th>현재 상태</th>
                  <th>변경</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {filteredQueue.length > 0 ? (
                  filteredQueue.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <button
                          className="text-link button-reset"
                          type="button"
                          onClick={() => setSelectedProfileId(item.id)}
                        >
                          {item.name}
                        </button>
                      </td>
                      <td>{item.universityName}</td>
                      <td>{item.schoolEmail || '-'}</td>
                      <td>{`${item.major} / ${item.graduationYear}`}</td>
                      <td>{verificationStatusLabelMap[item.verificationStatus] ?? item.verificationStatus}</td>
                      <td>
                        <select
                          value={statusDrafts[item.id] ?? item.verificationStatus}
                          onChange={(event) =>
                            setStatusDrafts((currentDrafts) => ({
                              ...currentDrafts,
                              [item.id]: event.target.value,
                            }))
                          }
                        >
                          {verificationActionOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          className="secondary-button"
                          disabled={submittingProfileId === item.id}
                          type="button"
                          onClick={() => handleSaveVerificationStatus(item)}
                        >
                          {submittingProfileId === item.id ? '저장 중...' : '상태 저장'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">조건에 맞는 인증 요청이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Job Review</p>
              <h2>공고 검수 큐</h2>
            </div>
            <p>파트너가 검수 요청한 공고를 공개 승인, 반려, 마감 처리합니다.</p>
          </div>

          {jobReviewQueue.length > 0 ? (
            <div className="notification-list">
              {jobReviewQueue.slice(0, 10).map((job) => (
                <article className={`notification-card ${job.status === 'pending_review' ? 'unread' : ''}`} key={job.id}>
                  <div className="notification-meta">
                    <span className={`check-pill ${job.status === 'published' ? 'complete' : ''}`}>
                      {jobReviewStatusOptions.find((option) => option.value === job.status)?.label ?? job.status}
                    </span>
                    <span>{job.updatedAt}</span>
                  </div>
                  <strong>{job.title}</strong>
                  <p>{job.companyName} · {job.role} · {job.location}</p>
                  {job.summary ? <p>{job.summary}</p> : null}
                  <div className="sidebar-actions">
                    <Link className="secondary-button" to={job.linkPath}>
                      공고 보기
                    </Link>
                    {jobReviewStatusOptions.map((option) => (
                      <button
                        className={option.value === 'published' ? 'primary-button' : 'secondary-button'}
                        disabled={submittingProfileId === job.id || job.status === option.value}
                        key={option.value}
                        type="button"
                        onClick={() => handleUpdateJobReviewStatus(job, option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>검수할 공고가 없습니다.</strong>
              <p>파트너가 공고를 `검수 요청` 상태로 저장하면 이 큐에 표시됩니다.</p>
            </div>
          )}
        </section>

        <section className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Community Reports</p>
              <h2>커뮤니티 신고 큐</h2>
            </div>
            <p>게시글/댓글 신고를 확인하고 처리 상태를 업데이트합니다.</p>
          </div>

          {communityReports.length > 0 ? (
            <div className="notification-list">
              {communityReports.slice(0, 8).map((report) => (
                <article className="notification-card" key={report.id}>
                  <div className="notification-meta">
                    <span className={`check-pill ${report.status === 'resolved' ? 'complete' : ''}`}>
                      {communityReportStatusOptions.find((option) => option.value === report.status)?.label ?? report.status}
                    </span>
                    <span>{report.createdAt}</span>
                  </div>
                  <strong>{report.targetType === 'comment' ? '댓글 신고' : '게시글 신고'} · {report.targetLabel}</strong>
                  <p>{report.reporterName} · {report.reason}</p>
                  <div className="sidebar-actions">
                    <Link className="secondary-button" to={report.linkPath}>
                      대상 보기
                    </Link>
                    {communityReportStatusOptions.map((option) => (
                      <button
                        className="secondary-button"
                        disabled={submittingProfileId === report.id || report.status === option.value}
                        key={option.value}
                        type="button"
                        onClick={() => handleUpdateCommunityReportStatus(report, option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>표시할 커뮤니티 신고가 없습니다.</strong>
              <p>게시글이나 댓글 신고가 접수되면 이 운영 큐에 표시됩니다.</p>
            </div>
          )}
        </section>

        <section className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Audit Trail</p>
              <h2>최근 운영 로그</h2>
            </div>
            <p>운영 승인 액션은 감사 로그에 남아 이후 추적이 가능합니다.</p>
          </div>

          {auditEntries.length > 0 ? (
            <div className="notification-list">
              {auditEntries.map((entry) => (
                <article className="notification-card" key={entry.id}>
                  <strong>{entry.action}</strong>
                  <p>{entry.summary}</p>
                  <div className="notification-meta">
                    <span>{entry.actorName}</span>
                    <span>{entry.createdAt}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>표시할 운영 로그가 없습니다.</strong>
              <p>운영 액션이 발생하면 최근 로그가 여기에 누적됩니다.</p>
            </div>
          )}
        </section>
      </section>
    </>
  )
}
