import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createResumeAttachmentSignedUrl,
  fetchResumeDraft,
  listJobs,
  listResumeVersions,
  listUniversities,
  saveResumeDraft,
  uploadResumeAttachment,
} from '../lib/platformApi.js'
import { useAuth } from '../providers/AuthProvider.jsx'
import {
  resumeFocusPrompts,
  resumeSections,
  resumeTemplates,
} from '../data/mockData.js'

const completionFields = [
  'name',
  'school',
  'major',
  'headline',
  'summary',
  'impact',
  'experience',
  'links',
]

const emptyResumeProfile = {
  name: '',
  school: '',
  major: '',
  headline: '',
  summary: '',
  impact: '',
  experience: '',
  links: '',
}

export function ResumeMakerPage() {
  const { user, profile: authProfile } = useAuth()
  const [jobs, setJobs] = useState([])
  const [selectedTemplateName, setSelectedTemplateName] = useState(resumeTemplates[1].name)
  const [targetJobSlug, setTargetJobSlug] = useState('')
  const [profile, setProfile] = useState(emptyResumeProfile)
  const [resumeMeta, setResumeMeta] = useState({
    resumeId: null,
    title: 'Builder Profile Resume',
    versionNumber: 0,
    fileName: '',
    filePath: '',
    fileMimeType: '',
    fileSize: 0,
  })
  const [versionHistory, setVersionHistory] = useState([])
  const [selectedVersionId, setSelectedVersionId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingResumeFile, setUploadingResumeFile] = useState(false)
  const [status, setStatus] = useState({ tone: 'neutral', message: '' })

  useEffect(() => {
    let ignore = false

    async function loadResumeBuilder() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      setLoading(true)

      const [{ data: nextJobs, error: jobsError }, draftResult, universityOptions] = await Promise.all([
        listJobs(),
        fetchResumeDraft(user.id),
        listUniversities(),
      ])

      if (ignore) {
        return
      }

      const universityMap = new Map((universityOptions ?? []).map((school) => [school.id, school.name]))
      const draft = draftResult.data ?? null
      const savedContent = draft?.content ?? {}
      const versionResult = draft?.resumeId
        ? await listResumeVersions(user.id, draft.resumeId)
        : { data: [], error: null }
      const nextTargetJobSlug = savedContent.targetJobSlug ?? nextJobs?.[0]?.slug ?? ''
      const nextTemplateName = resumeTemplates.some((template) => template.name === draft?.templateKey)
        ? draft.templateKey
        : resumeTemplates[1].name

      setJobs(nextJobs ?? [])
      setSelectedTemplateName(nextTemplateName)
      setTargetJobSlug(nextTargetJobSlug)
      setProfile({
        ...emptyResumeProfile,
        name: authProfile?.full_name ?? '',
        school: authProfile?.university_id ? universityMap.get(authProfile.university_id) ?? '' : '',
        major: authProfile?.major ?? '',
        headline: authProfile?.headline ?? '',
        summary: authProfile?.bio ?? '',
        ...savedContent,
      })
      setResumeMeta({
        resumeId: draft?.resumeId ?? null,
        title: draft?.title ?? 'Builder Profile Resume',
        versionNumber: draft?.versionNumber ?? 0,
        fileName: draft?.fileName ?? '',
        filePath: draft?.filePath ?? '',
        fileMimeType: draft?.fileMimeType ?? '',
        fileSize: draft?.fileSize ?? 0,
      })
      setVersionHistory(versionResult.data ?? [])
      setSelectedVersionId(versionResult.data?.[0]?.id ?? '')
      setStatus(
        draft?.resumeId
          ? {
              tone: 'success',
              message: `마지막 저장본을 불러왔습니다. 현재 버전 ${draft.versionNumber ?? 0}입니다.`,
            }
          : jobsError
            ? {
                tone: 'neutral',
                message: '공고 조회에 실패해도 이력서 편집과 저장은 계속 사용할 수 있습니다.',
              }
            : { tone: 'neutral', message: '' },
      )
      setLoading(false)
    }

    loadResumeBuilder()

    return () => {
      ignore = true
    }
  }, [authProfile?.id, user?.id])

  const selectedTemplate =
    resumeTemplates.find((template) => template.name === selectedTemplateName) ?? resumeTemplates[0]
  const targetJob = jobs.find((job) => job.slug === targetJobSlug) ?? jobs[0] ?? null
  const filledCount = completionFields.filter((field) => String(profile[field] ?? '').trim()).length
  const progress = Math.round((filledCount / completionFields.length) * 100)
  const hasMockJobs = jobs.length > 0 && jobs.every((job) => job.isMock)

  const sectionStatus = {
    '기본 정보': Boolean(profile.name && profile.school && profile.major),
    '경험 요약': Boolean(profile.summary && profile.impact && profile.experience),
    '링크와 첨부': Boolean(profile.links),
  }

  function updateField(field, value) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }))
  }

  function handleLoadVersion(versionEntry) {
    if (!versionEntry) {
      return
    }

    setProfile({
      ...emptyResumeProfile,
      name: authProfile?.full_name ?? '',
      school: authProfile?.university_id ? profile.school : '',
      major: authProfile?.major ?? '',
      headline: authProfile?.headline ?? '',
      summary: authProfile?.bio ?? '',
      ...versionEntry.content,
    })
    setSelectedVersionId(versionEntry.id)
    setTargetJobSlug(versionEntry.targetJobSlug || jobs[0]?.slug || '')
    setStatus({
      tone: 'success',
      message: `버전 ${versionEntry.versionNumber} 저장본을 편집기로 불러왔습니다. 저장하면 새 버전으로 다시 기록됩니다.`,
    })
  }

  async function handleSaveResume() {
    if (!user?.id) {
      return
    }

    setSaving(true)
    setStatus({ tone: 'neutral', message: '' })

    const { data, error } = await saveResumeDraft({
      userId: user.id,
      resumeId: resumeMeta.resumeId,
      title: `${profile.name?.trim() || 'Candidate'} Resume`,
      templateKey: selectedTemplate.name,
      headline: profile.headline,
      summary: profile.summary,
      content: {
        ...profile,
        targetJobSlug: targetJob?.slug ?? '',
      },
    })

    if (error || !data) {
      setStatus({ tone: 'error', message: error?.message ?? '이력서를 저장하지 못했습니다.' })
      setSaving(false)
      return
    }

    setResumeMeta({
      resumeId: data.resumeId,
      title: data.title,
      versionNumber: data.versionNumber ?? resumeMeta.versionNumber,
      fileName: data.fileName ?? resumeMeta.fileName ?? '',
      filePath: data.filePath ?? resumeMeta.filePath ?? '',
      fileMimeType: data.fileMimeType ?? resumeMeta.fileMimeType ?? '',
      fileSize: data.fileSize ?? resumeMeta.fileSize ?? 0,
    })
    const versionResult = await listResumeVersions(user.id, data.resumeId)
    setVersionHistory(versionResult.data ?? [])
    setSelectedVersionId(versionResult.data?.[0]?.id ?? '')
    setStatus({
      tone: 'success',
      message: `이력서를 저장했습니다. resumes / resume_versions 기준 버전 ${data.versionNumber ?? 1}이 생성되었습니다.`,
    })
    setSaving(false)
  }

  async function handleResumeFileUpload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || !user?.id) {
      return
    }

    if (!resumeMeta.resumeId) {
      setStatus({ tone: 'error', message: '파일을 첨부하려면 먼저 이력서를 한 번 저장해 주세요.' })
      return
    }

    setUploadingResumeFile(true)
    setStatus({ tone: 'neutral', message: '이력서 원본 파일을 안전한 Storage bucket에 업로드하는 중입니다.' })

    const { data, error } = await uploadResumeAttachment({
      userId: user.id,
      resumeId: resumeMeta.resumeId,
      file,
    })

    if (error || !data) {
      setStatus({ tone: 'error', message: error?.message ?? '이력서 파일을 첨부하지 못했습니다.' })
      setUploadingResumeFile(false)
      return
    }

    setResumeMeta((currentMeta) => ({
      ...currentMeta,
      fileName: data.fileName,
      filePath: data.filePath,
      fileMimeType: data.fileMimeType,
      fileSize: data.fileSize,
    }))
    setStatus({ tone: 'success', message: `${data.fileName} 파일을 비공개 이력서 첨부로 연결했습니다.` })
    setUploadingResumeFile(false)
  }

  async function handleOpenResumeAttachment() {
    if (!resumeMeta.filePath) {
      setStatus({ tone: 'neutral', message: '아직 연결된 이력서 파일이 없습니다.' })
      return
    }

    const { data, error } = await createResumeAttachmentSignedUrl(resumeMeta.filePath)

    if (error || !data?.signedUrl) {
      setStatus({ tone: 'error', message: error?.message ?? '이력서 파일 링크를 만들지 못했습니다.' })
      return
    }

    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
    setStatus({ tone: 'success', message: '5분 동안 열 수 있는 비공개 이력서 파일 링크를 생성했습니다.' })
  }

  return (
    <>
      <section className="page-hero section-card compact-hero">
        <div>
          <p className="eyebrow">Resume Maker</p>
          <h1>입력한 내용을 실제 저장하고 다시 불러오는 이력서 메이커</h1>
          <p>
            이제는 데모 입력창이 아니라, 로그인한 사용자 기준으로 Supabase에 이력서와
            버전 기록을 저장하고 다음 방문 때 다시 이어서 편집할 수 있습니다.
          </p>
        </div>
        <div className="compact-hero-card">
          <span className="compact-kicker">Progress</span>
          <strong>{loading ? '초기 데이터 불러오는 중...' : `작성 진행률 ${progress}%`}</strong>
          <p>{selectedTemplate.name} 템플릿 기준으로 현재 입력 상태와 저장 버전을 관리합니다.</p>
        </div>
      </section>

      <section className="resume-layout">
        <article className="section-card resume-main-card">
          {hasMockJobs ? (
            <div className="status-banner status-neutral">
              <strong>공고 미리보기는 샘플 데이터를 사용 중입니다</strong>
              <p>
                이력서 저장은 실제로 동작하지만, 타깃 공고를 실데이터로 연결하려면
                `0003_demo_jobs_seed.sql`을 실행해 주세요.
              </p>
            </div>
          ) : null}

          {status.message ? (
            <div className={`status-banner status-${status.tone}`}>
              <strong>{status.tone === 'error' ? '오류' : status.tone === 'success' ? '완료' : '안내'}</strong>
              <p>{status.message}</p>
            </div>
          ) : null}

          <div className="section-heading">
            <div>
              <p className="eyebrow">Builder</p>
              <h2>직무 톤에 맞춘 이력서 편집기</h2>
            </div>
            <p>지원 공고와 템플릿을 고르면 오른쪽 미리보기가 바로 업데이트되고 저장됩니다.</p>
          </div>

          <div className="template-grid">
            {resumeTemplates.map((template) => (
              <button
                className={`template-card template-button ${
                  selectedTemplate.name === template.name ? 'active' : ''
                }`}
                key={template.name}
                type="button"
                onClick={() => setSelectedTemplateName(template.name)}
              >
                <strong>{template.name}</strong>
                <p>{template.description}</p>
              </button>
            ))}
          </div>

          <div className="resume-editor-grid">
            <label className="field">
              <span>타깃 공고</span>
              <select
                disabled={loading || jobs.length === 0}
                value={targetJobSlug}
                onChange={(event) => setTargetJobSlug(event.target.value)}
              >
                {jobs.length > 0 ? (
                  jobs.map((job) => (
                    <option key={job.slug} value={job.slug}>
                      {job.company} · {job.title}
                    </option>
                  ))
                ) : (
                  <option value="">공고를 불러오는 중입니다</option>
                )}
              </select>
            </label>

            <label className="field">
              <span>이름</span>
              <input value={profile.name} onChange={(event) => updateField('name', event.target.value)} />
            </label>

            <label className="field">
              <span>학교</span>
              <input value={profile.school} onChange={(event) => updateField('school', event.target.value)} />
            </label>

            <label className="field">
              <span>전공</span>
              <input value={profile.major} onChange={(event) => updateField('major', event.target.value)} />
            </label>

            <label className="field resume-editor-full">
              <span>한 줄 헤드라인</span>
              <input value={profile.headline} onChange={(event) => updateField('headline', event.target.value)} />
            </label>

            <label className="field resume-editor-full">
              <span>요약</span>
              <textarea
                rows="4"
                value={profile.summary}
                onChange={(event) => updateField('summary', event.target.value)}
              />
            </label>

            <label className="field resume-editor-full">
              <span>정량 성과</span>
              <textarea
                rows="3"
                value={profile.impact}
                onChange={(event) => updateField('impact', event.target.value)}
              />
            </label>

            <label className="field resume-editor-full">
              <span>대표 경험</span>
              <textarea
                rows="4"
                value={profile.experience}
                onChange={(event) => updateField('experience', event.target.value)}
              />
            </label>

            <label className="field resume-editor-full">
              <span>링크와 첨부</span>
              <input value={profile.links} onChange={(event) => updateField('links', event.target.value)} />
            </label>
          </div>

          <article className="resume-preview-card dark-card">
            <p className="eyebrow bright">Live Preview</p>
            <div className="resume-preview-header">
              <div>
                <h3>{profile.name || '이름을 입력해주세요'}</h3>
                <p>{profile.headline || '헤드라인을 입력하면 여기에 반영됩니다.'}</p>
              </div>
              <span className="resume-template-pill">{selectedTemplate.name}</span>
            </div>

            <div className="job-detail-row inverse">
              <span>{profile.school || '학교'}</span>
              <span>{profile.major || '전공'}</span>
              <span>{targetJob?.role ?? '직군 선택 전'}</span>
            </div>

            <div className="resume-preview-section">
              <strong>지원 공고</strong>
              <p>
                {targetJob
                  ? `${targetJob.company} · ${targetJob.title}`
                  : '공고를 선택하면 직무 미리보기가 여기에 표시됩니다.'}
              </p>
            </div>

            <div className="resume-preview-section">
              <strong>요약</strong>
              <p>{profile.summary || '요약 문장을 입력해보세요.'}</p>
            </div>

            <div className="resume-preview-section">
              <strong>정량 성과</strong>
              <p>{profile.impact || '숫자로 표현할 수 있는 성과를 남겨두세요.'}</p>
            </div>

            <div className="resume-preview-section">
              <strong>대표 경험</strong>
              <p>{profile.experience || '핵심 프로젝트 흐름을 적어보세요.'}</p>
            </div>

            <div className="resume-preview-section">
              <strong>링크</strong>
              <p>{profile.links || '포트폴리오, GitHub, LinkedIn 링크를 넣을 수 있습니다.'}</p>
            </div>
          </article>
        </article>

        <aside className="section-card jobs-sidebar-card resume-sidebar">
          <article className="resume-progress-card">
            <p className="eyebrow">Progress</p>
            <h2>현재 입력 상태</h2>
            <div className="meter-track">
              <div className="meter-fill" style={{ width: `${progress}%` }} />
            </div>
            <p>
              {filledCount} / {completionFields.length} 항목 입력 완료
            </p>
            <p>저장 버전 {resumeMeta.versionNumber}</p>
          </article>

          <article className="resume-progress-card resume-file-card">
            <p className="eyebrow">Attachment</p>
            <h2>이력서 원본 파일</h2>
            <p>
              PDF/DOC/DOCX 원본을 private bucket에 보관합니다. 파트너에게는 우선 파일명과 첨부 여부만 노출됩니다.
            </p>
            {resumeMeta.fileName ? (
              <div className="resume-file-meta">
                <strong>{resumeMeta.fileName}</strong>
                <span>{resumeMeta.fileSize ? `${Math.round(resumeMeta.fileSize / 1024)}KB` : '크기 정보 없음'}</span>
                <button className="text-link button-reset" type="button" onClick={handleOpenResumeAttachment}>
                  내 원본 파일 열기
                </button>
              </div>
            ) : (
              <div className="resume-file-meta">
                <strong>첨부 파일 없음</strong>
                <span>지원 전에 저장본과 원본 파일을 함께 준비해두세요.</span>
              </div>
            )}
            <label className={`secondary-button full-width file-upload-button ${!resumeMeta.resumeId ? 'disabled' : ''}`}>
              {uploadingResumeFile ? '업로드 중...' : '파일 첨부하기'}
              <input
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                disabled={uploadingResumeFile || loading || !resumeMeta.resumeId}
                type="file"
                onChange={handleResumeFileUpload}
              />
            </label>
            {!resumeMeta.resumeId ? <p>먼저 이력서 저장을 누르면 파일 첨부가 활성화됩니다.</p> : null}
          </article>

          <div className="resume-checklist">
            {resumeSections.map((section) => (
              <article className="resume-check-item" key={section.title}>
                <div className="resume-check-head">
                  <strong>{section.title}</strong>
                  <span className={`check-pill ${sectionStatus[section.title] ? 'complete' : ''}`}>
                    {sectionStatus[section.title] ? '완료' : '작성중'}
                  </span>
                </div>
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="resume-prompt-stack">
            {resumeFocusPrompts.map((prompt) => (
              <article className="resume-prompt-card" key={prompt.title}>
                <strong>{prompt.title}</strong>
                <p>{prompt.copy}</p>
              </article>
            ))}
          </div>

          <div className="section-heading">
            <div>
              <p className="eyebrow">Version History</p>
              <h2>저장본 불러오기</h2>
            </div>
            <p>이전 저장본을 불러와 비교하거나 다시 편집할 수 있습니다.</p>
          </div>

          {versionHistory.length > 0 ? (
            <div className="notification-list">
              {versionHistory.map((version) => (
                <article
                  className={`notification-card ${selectedVersionId === version.id ? 'unread' : ''}`}
                  key={version.id}
                >
                  <strong>버전 {version.versionNumber}</strong>
                  <p>{version.summary || version.headline || '저장된 본문 요약이 없습니다.'}</p>
                  <div className="results-chip-row">
                    <span className="results-chip">{version.templateKey || '기본 템플릿'}</span>
                    <span className="results-chip">{version.createdAt || '-'}</span>
                    {version.targetJobSlug ? (
                      <span className="results-chip">{version.targetJobSlug}</span>
                    ) : null}
                  </div>
                  <div className="notification-actions">
                    <span>{selectedVersionId === version.id ? '현재 편집기에 반영된 저장본' : '클릭하면 편집기로 불러옵니다.'}</span>
                    <button
                      className="text-link button-reset"
                      type="button"
                      onClick={() => handleLoadVersion(version)}
                    >
                      저장본 불러오기
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>아직 저장된 버전이 없습니다.</strong>
              <p>첫 저장 이후부터 버전 히스토리가 여기에 쌓입니다.</p>
            </div>
          )}

          <div className="sidebar-actions stacked">
            <button className="primary-button full-width" disabled={saving || loading} type="button" onClick={handleSaveResume}>
              {saving ? '저장 중...' : '이력서 저장'}
            </button>
            {targetJob ? (
              <Link className="secondary-button full-width" to={`/jobs/${targetJob.slug}`}>
                타깃 공고 상세 보기
              </Link>
            ) : (
              <Link className="secondary-button full-width" to="/jobs">
                공고 목록 보기
              </Link>
            )}
            <Link className="secondary-button full-width" to="/verify">
              학교 인증 설정 보기
            </Link>
          </div>
        </aside>
      </section>
    </>
  )
}
