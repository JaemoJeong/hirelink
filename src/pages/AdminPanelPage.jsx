import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  adminListCompanies, adminCreateCompany, adminUpdateCompany, adminDeleteCompany,
  adminListJobs, adminCreateJob, adminUpdateJob, adminDeleteJob,
} from '../lib/platformApi.js'
import { useAuth } from '../providers/AuthProvider.jsx'

const jobStatusOptions = [
  { value: 'published', label: '공개' },
  { value: 'pending_review', label: '검수대기' },
  { value: 'closed', label: '마감' },
  { value: 'rejected', label: '반려' },
]

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || `item-${Date.now()}`
}

export function AdminPanelPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('jobs')
  const [companies, setCompanies] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState({ tone: 'neutral', message: '' })
  const [submitting, setSubmitting] = useState(false)

  // Job form
  const [editingJob, setEditingJob] = useState(null)
  const [jobForm, setJobForm] = useState({ title: '', companyId: '', role: '', location: '', arrangement: '하이브리드', experience: '', education: '학사 이상', summary: '', description: '', status: 'published', deadlineAt: '' })

  // Company form
  const [editingCompany, setEditingCompany] = useState(null)
  const [companyForm, setCompanyForm] = useState({ name: '', category: '', headquarters: '', websiteUrl: '', description: '', tagline: '' })

  useEffect(() => {
    load()
  }, [user?.id])

  async function load() {
    setLoading(true)
    const [compResult, jobResult] = await Promise.all([adminListCompanies(), adminListJobs()])
    setCompanies(compResult.data ?? [])
    setJobs(jobResult.data ?? [])
    if (compResult.error) setStatus({ tone: 'error', message: compResult.error.message })
    if (jobResult.error) setStatus({ tone: 'error', message: jobResult.error.message })
    setLoading(false)
  }

  // === Job handlers ===
  function handleNewJob() {
    setEditingJob('new')
    setJobForm({ title: '', companyId: companies[0]?.id ?? '', role: '개발', location: '서울', arrangement: '하이브리드', experience: '경력 무관', education: '학사 이상', summary: '', description: '', status: 'published', deadlineAt: '' })
    setStatus({ tone: 'neutral', message: '' })
  }

  function handleEditJob(job) {
    setEditingJob(job.id)
    setJobForm({
      title: job.title, companyId: job.company_id, role: job.role || '', location: job.location || '',
      arrangement: job.arrangement || '하이브리드', experience: job.experience_label || '', education: job.education_label || '',
      summary: job.summary || '', description: '', status: job.status, deadlineAt: job.deadline_at?.slice(0, 10) || '',
    })
    setStatus({ tone: 'neutral', message: '' })
  }

  async function handleSaveJob(e) {
    e.preventDefault()
    if (!jobForm.title.trim() || !jobForm.companyId) {
      setStatus({ tone: 'error', message: '공고명과 기업을 선택해주세요.' })
      return
    }
    setSubmitting(true)
    setStatus({ tone: 'neutral', message: '' })

    if (editingJob === 'new') {
      const { error } = await adminCreateJob({ ...jobForm, slug: slugify(jobForm.title) })
      if (error) { setStatus({ tone: 'error', message: error.message }); setSubmitting(false); return }
      setStatus({ tone: 'success', message: '공고가 등록되었습니다.' })
    } else {
      const { error } = await adminUpdateJob(editingJob, jobForm)
      if (error) { setStatus({ tone: 'error', message: error.message }); setSubmitting(false); return }
      setStatus({ tone: 'success', message: '공고가 수정되었습니다.' })
    }
    setEditingJob(null)
    setSubmitting(false)
    await load()
  }

  async function handleDeleteJob(jobId) {
    setSubmitting(true)
    const { error } = await adminDeleteJob(jobId)
    if (error) { setStatus({ tone: 'error', message: error.message }); setSubmitting(false); return }
    setStatus({ tone: 'success', message: '공고가 삭제되었습니다.' })
    setSubmitting(false)
    setEditingJob(null)
    await load()
  }

  // === Company handlers ===
  function handleNewCompany() {
    setEditingCompany('new')
    setCompanyForm({ name: '', category: '', headquarters: '', websiteUrl: '', description: '', tagline: '' })
    setStatus({ tone: 'neutral', message: '' })
  }

  function handleEditCompany(company) {
    setEditingCompany(company.id)
    setCompanyForm({
      name: company.name, category: company.category || '', headquarters: company.headquarters || '',
      websiteUrl: company.website_url || '', description: company.description || '', tagline: company.tagline || '',
    })
    setStatus({ tone: 'neutral', message: '' })
  }

  async function handleSaveCompany(e) {
    e.preventDefault()
    if (!companyForm.name.trim()) {
      setStatus({ tone: 'error', message: '기업명을 입력해주세요.' })
      return
    }
    setSubmitting(true)
    setStatus({ tone: 'neutral', message: '' })

    if (editingCompany === 'new') {
      const { error } = await adminCreateCompany({ ...companyForm, slug: slugify(companyForm.name), isPartner: true })
      if (error) { setStatus({ tone: 'error', message: error.message }); setSubmitting(false); return }
      setStatus({ tone: 'success', message: '기업이 등록되었습니다.' })
    } else {
      const { error } = await adminUpdateCompany(editingCompany, companyForm)
      if (error) { setStatus({ tone: 'error', message: error.message }); setSubmitting(false); return }
      setStatus({ tone: 'success', message: '기업 정보가 수정되었습니다.' })
    }
    setEditingCompany(null)
    setSubmitting(false)
    await load()
  }

  async function handleDeleteCompany(companyId) {
    setSubmitting(true)
    const { error } = await adminDeleteCompany(companyId)
    if (error) { setStatus({ tone: 'error', message: error.message }); setSubmitting(false); return }
    setStatus({ tone: 'success', message: '기업이 삭제되었습니다.' })
    setSubmitting(false)
    setEditingCompany(null)
    await load()
  }

  return (
    <>
      <section className="page-hero section-card compact-hero">
        <div>
          <p className="eyebrow">관리자</p>
          <h1>공고 · 기업 관리</h1>
          <p>공고를 등록/수정하고, 파트너 기업을 관리합니다.</p>
        </div>
        <div className="compact-hero-card">
          <span className="compact-kicker">현황</span>
          <strong>{loading ? '불러오는 중...' : `기업 ${companies.length}개 · 공고 ${jobs.length}개`}</strong>
          <p>
            <Link className="text-link" to="/admin/applications">지원 관리 →</Link>
          </p>
        </div>
      </section>

      {status.message ? (
        <section className={`status-banner status-${status.tone}`}>
          <strong>{status.tone === 'error' ? '오류' : '완료'}</strong>
          <p>{status.message}</p>
        </section>
      ) : null}

      <section className="section-card">
        <div className="auth-tabs" role="tablist">
          <button className={`auth-tab ${tab === 'jobs' ? 'active' : ''}`} type="button" onClick={() => { setTab('jobs'); setEditingJob(null); setEditingCompany(null) }}>
            공고 관리
          </button>
          <button className={`auth-tab ${tab === 'companies' ? 'active' : ''}`} type="button" onClick={() => { setTab('companies'); setEditingJob(null); setEditingCompany(null) }}>
            기업 관리
          </button>
        </div>
      </section>

      {/* === JOBS TAB === */}
      {tab === 'jobs' ? (
        <section className="jobs-layout">
          <article className="section-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">공고 목록</p>
                <h2>등록된 공고 {jobs.length}개</h2>
              </div>
              <button className="primary-button" type="button" onClick={handleNewJob}>새 공고 등록</button>
            </div>

            {loading ? (
              <div className="empty-state"><strong>불러오는 중...</strong></div>
            ) : jobs.length > 0 ? (
              <div className="notification-list">
                {jobs.map((job) => (
                  <article className={`notification-card ${editingJob === job.id ? 'unread' : ''}`} key={job.id}>
                    <div className="notification-meta">
                      <span className={`check-pill ${job.status === 'published' ? 'complete' : ''}`}>
                        {jobStatusOptions.find((o) => o.value === job.status)?.label ?? job.status}
                      </span>
                      <span>{job.company?.name || '-'}</span>
                    </div>
                    <strong>{job.title}</strong>
                    <p>{job.role} · {job.location} · {job.arrangement}</p>
                    <div className="notification-actions">
                      <span>{job.experience_label}</span>
                      <div className="notification-action-group">
                        <button className="text-link button-reset" type="button" onClick={() => handleEditJob(job)}>수정</button>
                        <button className="text-link button-reset" style={{ color: '#b91c1c' }} type="button" onClick={() => handleDeleteJob(job.id)}>삭제</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state"><strong>등록된 공고가 없습니다</strong></div>
            )}
          </article>

          <aside className="section-card jobs-sidebar-card">
            {editingJob ? (
              <>
                <p className="eyebrow">{editingJob === 'new' ? '새 공고' : '공고 수정'}</p>
                <h2>{editingJob === 'new' ? '공고 등록' : '공고 편집'}</h2>
                <form className="form-grid" onSubmit={handleSaveJob}>
                  <label className="field">
                    <span>기업</span>
                    <select value={jobForm.companyId} onChange={(e) => setJobForm((f) => ({ ...f, companyId: e.target.value }))}>
                      <option value="">기업 선택</option>
                      {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </label>
                  <label className="field"><span>공고명</span><input value={jobForm.title} onChange={(e) => setJobForm((f) => ({ ...f, title: e.target.value }))} placeholder="Product Engineer" /></label>
                  <label className="field"><span>직군</span><input value={jobForm.role} onChange={(e) => setJobForm((f) => ({ ...f, role: e.target.value }))} placeholder="개발" /></label>
                  <label className="field"><span>위치</span><input value={jobForm.location} onChange={(e) => setJobForm((f) => ({ ...f, location: e.target.value }))} placeholder="서울 강남구" /></label>
                  <label className="field"><span>근무형태</span>
                    <select value={jobForm.arrangement} onChange={(e) => setJobForm((f) => ({ ...f, arrangement: e.target.value }))}>
                      <option>하이브리드</option><option>오프라인</option><option>원격</option>
                    </select>
                  </label>
                  <label className="field"><span>경력</span><input value={jobForm.experience} onChange={(e) => setJobForm((f) => ({ ...f, experience: e.target.value }))} placeholder="경력 3년+" /></label>
                  <label className="field"><span>학력</span><input value={jobForm.education} onChange={(e) => setJobForm((f) => ({ ...f, education: e.target.value }))} placeholder="학사 이상" /></label>
                  <label className="field"><span>상태</span>
                    <select value={jobForm.status} onChange={(e) => setJobForm((f) => ({ ...f, status: e.target.value }))}>
                      {jobStatusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </label>
                  <label className="field"><span>마감일</span><input type="date" value={jobForm.deadlineAt} onChange={(e) => setJobForm((f) => ({ ...f, deadlineAt: e.target.value }))} /></label>
                  <label className="field resume-editor-full"><span>요약</span><textarea rows="3" value={jobForm.summary} onChange={(e) => setJobForm((f) => ({ ...f, summary: e.target.value }))} placeholder="포지션 한 줄 요약" /></label>
                  <div className="sidebar-actions stacked">
                    <button className="primary-button full-width" disabled={submitting} type="submit">{submitting ? '저장 중...' : '저장'}</button>
                    <button className="secondary-button full-width" type="button" onClick={() => setEditingJob(null)}>취소</button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <p className="eyebrow">안내</p>
                <h2>공고를 선택하세요</h2>
                <p>목록에서 "수정"을 클릭하거나 "새 공고 등록"을 눌러 시작하세요.</p>
                <div className="sidebar-actions stacked">
                  <button className="primary-button full-width" type="button" onClick={handleNewJob}>새 공고 등록</button>
                </div>
              </>
            )}
          </aside>
        </section>
      ) : null}

      {/* === COMPANIES TAB === */}
      {tab === 'companies' ? (
        <section className="jobs-layout">
          <article className="section-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">기업 목록</p>
                <h2>등록된 기업 {companies.length}개</h2>
              </div>
              <button className="primary-button" type="button" onClick={handleNewCompany}>새 기업 등록</button>
            </div>

            {loading ? (
              <div className="empty-state"><strong>불러오는 중...</strong></div>
            ) : companies.length > 0 ? (
              <div className="notification-list">
                {companies.map((company) => (
                  <article className={`notification-card ${editingCompany === company.id ? 'unread' : ''}`} key={company.id}>
                    <div className="notification-meta">
                      <span className="check-pill complete">{company.category || '미분류'}</span>
                      <span>{company.headquarters}</span>
                    </div>
                    <strong>{company.name}</strong>
                    <p>{company.tagline || company.description || '-'}</p>
                    <div className="notification-actions">
                      <span>{company.is_partner ? '파트너' : '일반'}</span>
                      <div className="notification-action-group">
                        <button className="text-link button-reset" type="button" onClick={() => handleEditCompany(company)}>수정</button>
                        <button className="text-link button-reset" style={{ color: '#b91c1c' }} type="button" onClick={() => handleDeleteCompany(company.id)}>삭제</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state"><strong>등록된 기업이 없습니다</strong></div>
            )}
          </article>

          <aside className="section-card jobs-sidebar-card">
            {editingCompany ? (
              <>
                <p className="eyebrow">{editingCompany === 'new' ? '새 기업' : '기업 수정'}</p>
                <h2>{editingCompany === 'new' ? '기업 등록' : '기업 편집'}</h2>
                <form className="form-grid" onSubmit={handleSaveCompany}>
                  <label className="field"><span>기업명</span><input value={companyForm.name} onChange={(e) => setCompanyForm((f) => ({ ...f, name: e.target.value }))} placeholder="회사 이름" /></label>
                  <label className="field"><span>카테고리</span><input value={companyForm.category} onChange={(e) => setCompanyForm((f) => ({ ...f, category: e.target.value }))} placeholder="AI, 핀테크, 게임 등" /></label>
                  <label className="field"><span>위치</span><input value={companyForm.headquarters} onChange={(e) => setCompanyForm((f) => ({ ...f, headquarters: e.target.value }))} placeholder="서울 강남구" /></label>
                  <label className="field"><span>웹사이트</span><input value={companyForm.websiteUrl} onChange={(e) => setCompanyForm((f) => ({ ...f, websiteUrl: e.target.value }))} placeholder="https://" /></label>
                  <label className="field"><span>한줄 소개</span><input value={companyForm.tagline} onChange={(e) => setCompanyForm((f) => ({ ...f, tagline: e.target.value }))} placeholder="짧은 슬로건" /></label>
                  <label className="field resume-editor-full"><span>설명</span><textarea rows="3" value={companyForm.description} onChange={(e) => setCompanyForm((f) => ({ ...f, description: e.target.value }))} placeholder="기업 소개" /></label>
                  <div className="sidebar-actions stacked">
                    <button className="primary-button full-width" disabled={submitting} type="submit">{submitting ? '저장 중...' : '저장'}</button>
                    <button className="secondary-button full-width" type="button" onClick={() => setEditingCompany(null)}>취소</button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <p className="eyebrow">안내</p>
                <h2>기업을 선택하세요</h2>
                <p>목록에서 "수정"을 클릭하거나 "새 기업 등록"을 눌러 시작하세요.</p>
                <div className="sidebar-actions stacked">
                  <button className="primary-button full-width" type="button" onClick={handleNewCompany}>새 기업 등록</button>
                </div>
              </>
            )}
          </aside>
        </section>
      ) : null}
    </>
  )
}
