import { useEffect, useMemo, useState } from 'react'
import {
  activateDemoPartnerWorkspace,
  answerCompanyInfoRequest,
  fetchPartnerDashboard,
  listPartnerCompanies,
  savePartnerCompanyProfile,
  savePartnerJob,
} from '../lib/platformApi.js'
import { useAuth } from '../providers/AuthProvider.jsx'

const partnerJobStatusOptions = [
  { value: 'draft', label: '임시저장' },
  { value: 'pending_review', label: '검수 요청' },
  { value: 'published', label: '공개중' },
  { value: 'closed', label: '마감' },
]

function createEmptyJobDraft() {
  return {
    title: '',
    slug: '',
    role: '',
    location: '',
    arrangement: '',
    experience: '',
    education: '',
    status: 'draft',
    deadlineAt: '',
    publishedAt: null,
    summary: '',
    description: '',
    tagsText: '',
    responsibilitiesText: '',
    requirementsText: '',
    perksText: '',
  }
}

function buildCompanyDraft(company) {
  return {
    name: company?.name ?? '',
    category: company?.category ?? '',
    websiteUrl: company?.website_url ?? company?.websiteUrl ?? '',
    headquarters: company?.headquarters ?? '',
    logoUrl: company?.logo_url ?? company?.logoUrl ?? '',
    coverImageUrl: company?.cover_image_url ?? company?.coverImageUrl ?? '',
    brandColor: company?.brand_color ?? company?.brandColor ?? '',
    tagline: company?.tagline ?? '',
    description: company?.description ?? '',
    mission: company?.mission ?? '',
    culture: company?.culture ?? '',
    benefitsText: (company?.benefits ?? []).join('\n'),
    hiringProcessText: (company?.hiringProcess ?? []).join('\n'),
  }
}

function buildJobDraft(job) {
  return {
    title: job?.title ?? '',
    slug: job?.slug ?? '',
    role: job?.role ?? '',
    location: job?.location ?? '',
    arrangement: job?.arrangement ?? '',
    experience: job?.experience ?? '',
    education: job?.education ?? '',
    status: job?.status ?? 'draft',
    deadlineAt: job?.deadlineAt ?? '',
    publishedAt: job?.publishedAt ?? null,
    summary: job?.summary ?? '',
    description: job?.description ?? '',
    tagsText: (job?.tags ?? []).join(', '),
    responsibilitiesText: (job?.responsibilities ?? []).join('\n'),
    requirementsText: (job?.requirements ?? []).join('\n'),
    perksText: (job?.perks ?? []).join('\n'),
  }
}

export function PartnerPage() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [partnerCompanies, setPartnerCompanies] = useState([])
  const [activeCompanyId, setActiveCompanyId] = useState('')
  const [jobEditorId, setJobEditorId] = useState('')
  const [jobDraft, setJobDraft] = useState(createEmptyJobDraft)
  const [companyDraft, setCompanyDraft] = useState(buildCompanyDraft(null))
  const [infoRequestAnswerDrafts, setInfoRequestAnswerDrafts] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState({ tone: 'neutral', message: '' })

  const company = dashboard?.company ?? null
  const jobs = dashboard?.jobs ?? []
  const applications = dashboard?.applications ?? []
  const companyInfoRequests = dashboard?.companyInfoRequests ?? []
  const teamMembers = dashboard?.teamMembers ?? []
  const metrics = dashboard?.metrics ?? []
  const memberships = dashboard?.memberships ?? []

  useEffect(() => {
    let ignore = false

    async function loadPartnerData() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      setLoading(true)

      const [{ data: companies, error: companyListError }, { data: dashboardData, error }] = await Promise.all([
        listPartnerCompanies(),
        fetchPartnerDashboard(user.id, activeCompanyId || null),
      ])

      if (ignore) {
        return
      }

      setPartnerCompanies(companies ?? [])
      setDashboard(dashboardData ?? null)
      setActiveCompanyId((currentCompanyId) => currentCompanyId || dashboardData?.company?.id || '')
      setCompanyDraft(buildCompanyDraft(dashboardData?.company ?? null))
      setJobEditorId(dashboardData?.jobs?.[0]?.id ?? '')
      setJobDraft(buildJobDraft(dashboardData?.jobs?.[0] ?? null))
      setStatus(
        error || companyListError
          ? { tone: 'error', message: (error ?? companyListError)?.message ?? '파트너 데이터를 불러오지 못했습니다.' }
          : { tone: 'neutral', message: '' },
      )
      setLoading(false)
    }

    loadPartnerData()

    return () => {
      ignore = true
    }
  }, [user?.id, activeCompanyId])

  const openInfoRequests = useMemo(
    () => companyInfoRequests.filter((item) => item.status !== 'answered'),
    [companyInfoRequests],
  )

  async function handleActivateDemoWorkspace() {
    const defaultSlug = partnerCompanies[0]?.slug ?? 'tensor-labs'

    setSubmitting(true)
    setStatus({ tone: 'neutral', message: '' })

    const { error } = await activateDemoPartnerWorkspace({ companySlug: defaultSlug })

    if (error) {
      setStatus({ tone: 'error', message: error.message })
      setSubmitting(false)
      return
    }

    setStatus({ tone: 'success', message: '데모 파트너 워크스페이스를 활성화했습니다.' })
    setActiveCompanyId('')
    setSubmitting(false)
  }

  async function handleSaveCompanyProfile() {
    if (!company?.id) {
      return
    }

    setSubmitting(true)
    setStatus({ tone: 'neutral', message: '' })

    const { error } = await savePartnerCompanyProfile({
      companyId: company.id,
      draft: companyDraft,
    })

    if (error) {
      setStatus({ tone: 'error', message: error.message })
      setSubmitting(false)
      return
    }

    setDashboard((currentDashboard) =>
      currentDashboard
        ? {
            ...currentDashboard,
            company: {
              ...currentDashboard.company,
              ...companyDraft,
              benefits: companyDraft.benefitsText.split('\n').map((item) => item.trim()).filter(Boolean),
              hiringProcess: companyDraft.hiringProcessText.split('\n').map((item) => item.trim()).filter(Boolean),
            },
          }
        : currentDashboard,
    )
    setStatus({ tone: 'success', message: '기업 정보를 저장했습니다.' })
    setSubmitting(false)
  }

  function handleEditJob(job) {
    setJobEditorId(job.id)
    setJobDraft(buildJobDraft(job))
  }

  function handleCreateNewJob() {
    setJobEditorId('')
    setJobDraft(createEmptyJobDraft())
  }

  async function handleSaveJob() {
    if (!company?.id || !user?.id) {
      return
    }

    setSubmitting(true)
    setStatus({ tone: 'neutral', message: '' })

    const { data, error } = await savePartnerJob({
      companyId: company.id,
      createdBy: user.id,
      jobId: jobEditorId || null,
      draft: jobDraft,
    })

    if (error) {
      setStatus({ tone: 'error', message: error.message })
      setSubmitting(false)
      return
    }

    const nextJobId = data?.id ?? jobEditorId
    setStatus({ tone: 'success', message: '공고를 저장했습니다.' })
    setJobEditorId(nextJobId ?? '')
    setSubmitting(false)
  }

  async function handleAnswerRequest(requestId) {
    const answer = String(infoRequestAnswerDrafts[requestId] ?? '').trim()

    if (!answer) {
      setStatus({ tone: 'error', message: '답변 내용을 입력해 주세요.' })
      return
    }

    setSubmitting(true)
    setStatus({ tone: 'neutral', message: '' })

    const { data, error } = await answerCompanyInfoRequest({
      requestId,
      answer,
      status: 'answered',
    })

    if (error) {
      setStatus({ tone: 'error', message: error.message })
      setSubmitting(false)
      return
    }

    setDashboard((currentDashboard) =>
      currentDashboard
        ? {
            ...currentDashboard,
            companyInfoRequests: (currentDashboard.companyInfoRequests ?? []).map((item) =>
              item.id === requestId
                ? {
                    ...item,
                    status: data?.status ?? 'answered',
                    answer: data?.answer ?? answer,
                    answeredAt: data?.answeredAt ?? new Date().toISOString(),
                  }
                : item,
            ),
          }
        : currentDashboard,
    )
    setInfoRequestAnswerDrafts((currentDrafts) => ({
      ...currentDrafts,
      [requestId]: '',
    }))
    setStatus({ tone: 'success', message: '학생 질문에 답변했습니다.' })
    setSubmitting(false)
  }

  if (loading) {
    return (
      <section className="section-card not-found-panel">
        <p className="eyebrow">Loading</p>
        <h1>파트너 워크스페이스를 불러오는 중입니다</h1>
        <p>잠시만 기다리면 회사 정보와 공고 관리 화면이 표시됩니다.</p>
      </section>
    )
  }

  if (!company) {
    return (
      <>
        <section className="page-hero section-card compact-hero">
          <div>
            <p className="eyebrow">Partner Workspace</p>
            <h1>회사 워크스페이스를 먼저 연결해 주세요</h1>
            <p>지금은 핵심 MVP 기준으로 기업 정보 수정, 공고 관리, 지원자 확인, 질문 답변만 남겼습니다.</p>
          </div>
          <div className="compact-hero-card">
            <span className="compact-kicker">Partner Companies</span>
            <strong>{partnerCompanies.length}개 파트너 기업</strong>
            <p>데모 계정을 쓰고 있으면 아래 버튼으로 워크스페이스를 바로 활성화할 수 있습니다.</p>
          </div>
        </section>

        {status.message ? (
          <section className={`status-banner status-${status.tone}`}>
            <strong>{status.tone === 'error' ? '오류' : status.tone === 'success' ? '완료' : '안내'}</strong>
            <p>{status.message}</p>
          </section>
        ) : null}

        <section className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Get Started</p>
              <h2>데모 파트너사 연결</h2>
            </div>
            <p>아직 연결된 회사가 없다면, 먼저 seeded partner company에 데모 멤버십을 붙이면 됩니다.</p>
          </div>

          <div className="sidebar-actions">
            <button className="primary-button" disabled={submitting} type="button" onClick={handleActivateDemoWorkspace}>
              {submitting ? '활성화 중...' : '데모 워크스페이스 활성화'}
            </button>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <section className="page-hero section-card compact-hero">
        <div>
          <p className="eyebrow">Partner Workspace</p>
          <h1>{company.name} 채용 관리</h1>
          <p>기업 정보, 공고, 지원자, 학생 질문을 한 화면에서 확인하는 축소형 파트너 대시보드입니다.</p>
        </div>
        <div className="compact-hero-card">
          <span className="compact-kicker">{company.category || 'Partner Company'}</span>
          <strong>{company.headquarters || '위치 협의'}</strong>
          <p>{company.tagline || company.description || '기업 소개를 입력해 주세요.'}</p>
        </div>
      </section>

      <section className="metric-grid">
        {metrics.map((metric) => (
          <article className="section-card metric-panel" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>

      {status.message ? (
        <section className={`status-banner status-${status.tone}`}>
          <strong>{status.tone === 'error' ? '오류' : status.tone === 'success' ? '완료' : '안내'}</strong>
          <p>{status.message}</p>
        </section>
      ) : null}

      <section className="jobs-layout">
        <article className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Workspace</p>
              <h2>현재 회사와 팀</h2>
            </div>
            <p>연결된 회사가 여러 개면 여기서 워크스페이스를 바꿀 수 있습니다.</p>
          </div>

          <label className="field">
            <span>활성 회사</span>
            <select value={activeCompanyId} onChange={(event) => setActiveCompanyId(event.target.value)}>
              {memberships.map((membership) => (
                <option key={membership.companyId} value={membership.companyId}>
                  {membership.company?.name ?? membership.companyId}
                </option>
              ))}
            </select>
          </label>

          <div className="notification-list">
            {teamMembers.map((member) => (
              <article className="notification-card" key={member.userId}>
                <strong>{member.name}</strong>
                <p>
                  {member.memberRole}
                  {member.isOwner ? ' · Owner' : ''}
                  {member.university ? ` · ${member.university}` : ''}
                </p>
              </article>
            ))}
          </div>
        </article>

        <article className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Company Profile</p>
              <h2>기업 정보 편집</h2>
            </div>
            <p>학생이 보는 기업 상세에 바로 반영되는 정보만 남겼습니다.</p>
          </div>

          <div className="resume-editor-grid">
            <label className="field">
              <span>회사명</span>
              <input value={companyDraft.name} onChange={(event) => setCompanyDraft((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label className="field">
              <span>카테고리</span>
              <input value={companyDraft.category} onChange={(event) => setCompanyDraft((current) => ({ ...current, category: event.target.value }))} />
            </label>
            <label className="field">
              <span>웹사이트</span>
              <input value={companyDraft.websiteUrl} onChange={(event) => setCompanyDraft((current) => ({ ...current, websiteUrl: event.target.value }))} />
            </label>
            <label className="field">
              <span>본사 위치</span>
              <input value={companyDraft.headquarters} onChange={(event) => setCompanyDraft((current) => ({ ...current, headquarters: event.target.value }))} />
            </label>
            <label className="field resume-editor-full">
              <span>한 줄 소개</span>
              <input value={companyDraft.tagline} onChange={(event) => setCompanyDraft((current) => ({ ...current, tagline: event.target.value }))} />
            </label>
            <label className="field resume-editor-full">
              <span>회사 소개</span>
              <textarea value={companyDraft.description} onChange={(event) => setCompanyDraft((current) => ({ ...current, description: event.target.value }))} />
            </label>
            <label className="field resume-editor-full">
              <span>미션</span>
              <textarea value={companyDraft.mission} onChange={(event) => setCompanyDraft((current) => ({ ...current, mission: event.target.value }))} />
            </label>
            <label className="field resume-editor-full">
              <span>문화</span>
              <textarea value={companyDraft.culture} onChange={(event) => setCompanyDraft((current) => ({ ...current, culture: event.target.value }))} />
            </label>
            <label className="field">
              <span>복지/환경</span>
              <textarea value={companyDraft.benefitsText} onChange={(event) => setCompanyDraft((current) => ({ ...current, benefitsText: event.target.value }))} />
            </label>
            <label className="field">
              <span>채용 프로세스</span>
              <textarea value={companyDraft.hiringProcessText} onChange={(event) => setCompanyDraft((current) => ({ ...current, hiringProcessText: event.target.value }))} />
            </label>
          </div>

          <div className="sidebar-actions">
            <button className="primary-button" disabled={submitting} type="button" onClick={handleSaveCompanyProfile}>
              {submitting ? '저장 중...' : '기업 정보 저장'}
            </button>
          </div>
        </article>
      </section>

      <section className="jobs-layout">
        <article className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Jobs</p>
              <h2>공고 목록</h2>
            </div>
            <p>핵심 공고만 빠르게 관리할 수 있도록 단순화했습니다.</p>
          </div>

          <div className="sidebar-actions">
            <button className="secondary-button" type="button" onClick={handleCreateNewJob}>
              새 공고 작성
            </button>
          </div>

          <div className="notification-list">
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <article className={`notification-card ${jobEditorId === job.id ? 'unread' : ''}`} key={job.id}>
                  <div className="notification-actions">
                    <div>
                      <strong>{job.title}</strong>
                      <p>
                        {job.role || '직군 미정'} · {job.location || '위치 협의'} · {job.status}
                      </p>
                    </div>
                    <button className="text-link button-reset" type="button" onClick={() => handleEditJob(job)}>
                      편집
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <strong>아직 등록된 공고가 없습니다.</strong>
                <p>첫 공고를 추가하면 학생이 기업 상세와 채용 보드에서 바로 볼 수 있습니다.</p>
              </div>
            )}
          </div>
        </article>

        <article className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Job Editor</p>
              <h2>{jobEditorId ? '공고 수정' : '새 공고 작성'}</h2>
            </div>
            <p>공고 제목과 요약, 주요 요구사항만 잘 적어도 데모엔 충분합니다.</p>
          </div>

          <div className="resume-editor-grid">
            <label className="field resume-editor-full">
              <span>공고 제목</span>
              <input value={jobDraft.title} onChange={(event) => setJobDraft((current) => ({ ...current, title: event.target.value }))} />
            </label>
            <label className="field">
              <span>직군</span>
              <input value={jobDraft.role} onChange={(event) => setJobDraft((current) => ({ ...current, role: event.target.value }))} />
            </label>
            <label className="field">
              <span>근무지</span>
              <input value={jobDraft.location} onChange={(event) => setJobDraft((current) => ({ ...current, location: event.target.value }))} />
            </label>
            <label className="field">
              <span>근무 형태</span>
              <input value={jobDraft.arrangement} onChange={(event) => setJobDraft((current) => ({ ...current, arrangement: event.target.value }))} />
            </label>
            <label className="field">
              <span>경력</span>
              <input value={jobDraft.experience} onChange={(event) => setJobDraft((current) => ({ ...current, experience: event.target.value }))} />
            </label>
            <label className="field">
              <span>학력</span>
              <input value={jobDraft.education} onChange={(event) => setJobDraft((current) => ({ ...current, education: event.target.value }))} />
            </label>
            <label className="field">
              <span>상태</span>
              <select value={jobDraft.status} onChange={(event) => setJobDraft((current) => ({ ...current, status: event.target.value }))}>
                {partnerJobStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>마감일</span>
              <input type="date" value={jobDraft.deadlineAt} onChange={(event) => setJobDraft((current) => ({ ...current, deadlineAt: event.target.value }))} />
            </label>
            <label className="field resume-editor-full">
              <span>한 줄 요약</span>
              <textarea value={jobDraft.summary} onChange={(event) => setJobDraft((current) => ({ ...current, summary: event.target.value }))} />
            </label>
            <label className="field resume-editor-full">
              <span>상세 설명</span>
              <textarea value={jobDraft.description} onChange={(event) => setJobDraft((current) => ({ ...current, description: event.target.value }))} />
            </label>
            <label className="field">
              <span>태그</span>
              <textarea value={jobDraft.tagsText} onChange={(event) => setJobDraft((current) => ({ ...current, tagsText: event.target.value }))} />
            </label>
            <label className="field">
              <span>주요 업무</span>
              <textarea value={jobDraft.responsibilitiesText} onChange={(event) => setJobDraft((current) => ({ ...current, responsibilitiesText: event.target.value }))} />
            </label>
            <label className="field">
              <span>자격 요건</span>
              <textarea value={jobDraft.requirementsText} onChange={(event) => setJobDraft((current) => ({ ...current, requirementsText: event.target.value }))} />
            </label>
            <label className="field">
              <span>혜택</span>
              <textarea value={jobDraft.perksText} onChange={(event) => setJobDraft((current) => ({ ...current, perksText: event.target.value }))} />
            </label>
          </div>

          <div className="sidebar-actions">
            <button className="primary-button" disabled={submitting} type="button" onClick={handleSaveJob}>
              {submitting ? '저장 중...' : '공고 저장'}
            </button>
          </div>
        </article>
      </section>

      <section className="jobs-layout">
        <article className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Applications</p>
              <h2>지원자 현황</h2>
            </div>
            <p>이제는 지원 상태를 보는 것만으로도 충분합니다. 불필요한 부가 기능은 뺐습니다.</p>
          </div>

          <div className="notification-list">
            {applications.length > 0 ? (
              applications.map((application) => (
                <article className="notification-card" key={application.id}>
                  <div className="notification-meta">
                    <span className="check-pill complete">{application.status}</span>
                    <span>{application.appliedAt}</span>
                  </div>
                  <strong>{application.applicant}</strong>
                  <p>
                    {application.title}
                    {application.applicantUniversity ? ` · ${application.applicantUniversity}` : ''}
                    {application.applicantMajor ? ` · ${application.applicantMajor}` : ''}
                  </p>
                  {application.applicantHeadline ? <p>{application.applicantHeadline}</p> : null}
                  {application.coverNote ? <p>지원 메모: {application.coverNote}</p> : null}
                </article>
              ))
            ) : (
              <div className="empty-state">
                <strong>아직 지원자가 없습니다.</strong>
                <p>공개 공고와 기업 정보가 정리되면 학생 유입이 훨씬 쉬워집니다.</p>
              </div>
            )}
          </div>
        </article>

        <article className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Student Questions</p>
              <h2>기업 정보 질문</h2>
            </div>
            <p>학생이 기업 상세에서 남긴 질문에 답하면, 그 답변이 공개 Q&A로 쌓입니다.</p>
          </div>

          <div className="notification-list">
            {companyInfoRequests.length > 0 ? (
              companyInfoRequests.map((request) => (
                <article className={`notification-card ${request.status !== 'answered' ? 'unread' : ''}`} key={request.id}>
                  <div className="notification-meta">
                    <span className="check-pill complete">{request.status === 'answered' ? '답변 완료' : '답변 대기'}</span>
                    <span>{request.requester}{request.requesterUniversity ? ` · ${request.requesterUniversity}` : ''}</span>
                  </div>
                  <strong>Q. {request.question}</strong>
                  {request.answer ? <p>A. {request.answer}</p> : null}
                  {request.status !== 'answered' ? (
                    <label className="field">
                      <span>답변</span>
                      <textarea
                        value={infoRequestAnswerDrafts[request.id] ?? ''}
                        onChange={(event) =>
                          setInfoRequestAnswerDrafts((current) => ({
                            ...current,
                            [request.id]: event.target.value,
                          }))
                        }
                      />
                    </label>
                  ) : null}
                  {request.status !== 'answered' ? (
                    <div className="sidebar-actions">
                      <button className="primary-button" disabled={submitting} type="button" onClick={() => handleAnswerRequest(request.id)}>
                        {submitting ? '저장 중...' : '답변 저장'}
                      </button>
                    </div>
                  ) : null}
                </article>
              ))
            ) : (
              <div className="empty-state">
                <strong>아직 학생 질문이 없습니다.</strong>
                <p>기업 상세에 정보가 잘 들어가면 질문도 훨씬 구체적으로 들어오기 시작합니다.</p>
              </div>
            )}
          </div>

          {openInfoRequests.length > 0 ? (
            <div className="results-meta">
              <span>답변 대기 {openInfoRequests.length}건</span>
              <span>전체 질문 {companyInfoRequests.length}건</span>
            </div>
          ) : null}
        </article>
      </section>
    </>
  )
}
