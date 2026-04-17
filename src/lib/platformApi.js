import {
  communityPosts as mockCommunityPosts,
  communityTopics,
  inboxThreads as mockInboxThreads,
  jobs as mockJobs,
  resumeSeed,
  universities as mockUniversities,
} from '../data/mockData.js'
import {
  isSupabaseConfigured,
  supabase,
  supabaseSetupMessage,
} from './supabase.js'

function formatDateLabel(value) {
  if (!value) {
    return ''
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return parsed.toISOString().slice(0, 10)
}

function formatDeadlineLabel(value) {
  if (!value) {
    return '상시'
  }

  const deadline = new Date(value)
  const now = new Date()

  if (Number.isNaN(deadline.getTime())) {
    return '상시'
  }

  const diff = deadline.getTime() - now.getTime()

  if (diff <= 0) {
    return '마감'
  }

  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return `D-${days}`
}

function buildReadTimeLabel(text) {
  const sourceText = String(text ?? '').trim()

  if (!sourceText) {
    return '1분 읽기'
  }

  const minutes = Math.max(1, Math.round(sourceText.length / 320))
  return `${minutes}분 읽기`
}

function buildExcerpt(text) {
  const normalized = String(text ?? '').replace(/\s+/g, ' ').trim()

  if (!normalized) {
    return ''
  }

  return normalized.length > 110 ? `${normalized.slice(0, 107)}...` : normalized
}

function formatDateTimeLabel(value) {
  if (!value) {
    return ''
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return parsed.toISOString().slice(0, 16).replace('T', ' ')
}

function splitParagraphs(text) {
  return String(text ?? '')
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function arrayFromJson(value) {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

function isRealRecordId(value) {
  return typeof value === 'string' && !value.startsWith('mock-')
}

function isMissingRelationError(error) {
  const code = String(error?.code ?? '')
  const message = String(error?.message ?? '')
  const details = String(error?.details ?? '')
  const hint = String(error?.hint ?? '')
  const source = `${message}\n${details}\n${hint}`

  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    /relation .* does not exist/i.test(source) ||
    /could not find the table .* in the schema cache/i.test(source)
  )
}

function isMissingColumnError(error) {
  return error?.code === '42703' || /column .* does not exist/i.test(error?.message ?? '')
}

function createTimeoutError(label = 'request') {
  const error = new Error(`${label} timeout`)
  error.code = 'REQUEST_TIMEOUT'
  return error
}

function isTimeoutError(error) {
  return error?.code === 'REQUEST_TIMEOUT'
}

async function withTimeout(promise, timeoutMs = 2500, label = 'request') {
  let timeoutId

  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(createTimeoutError(label)), timeoutMs)
      }),
    ])
  } finally {
    clearTimeout(timeoutId)
  }
}

const resourceCache = new Map()
const RESOURCE_CACHE_TTL_MS = 1000 * 60 * 6

function readCachedResource(key) {
  const now = Date.now()
  const memoryEntry = resourceCache.get(key)

  if (memoryEntry && now - memoryEntry.savedAt < RESOURCE_CACHE_TTL_MS) {
    return memoryEntry.data
  }

  if (typeof window === 'undefined') {
    return null
  }

  try {
    const rawValue = window.sessionStorage.getItem(`elite-cache:${key}`)

    if (!rawValue) {
      return null
    }

    const parsedValue = JSON.parse(rawValue)

    if (!parsedValue?.savedAt || now - parsedValue.savedAt >= RESOURCE_CACHE_TTL_MS) {
      window.sessionStorage.removeItem(`elite-cache:${key}`)
      return null
    }

    resourceCache.set(key, parsedValue)
    return parsedValue.data ?? null
  } catch {
    return null
  }
}

function writeCachedResource(key, data) {
  const entry = {
    savedAt: Date.now(),
    data,
  }

  resourceCache.set(key, entry)

  if (typeof window === 'undefined') {
    return
  }

  try {
    window.sessionStorage.setItem(`elite-cache:${key}`, JSON.stringify(entry))
  } catch {
    // Ignore session cache write failures in constrained browsers.
  }
}

const companyBaseSelect = 'id, slug, name, category, website_url, description, headquarters, is_partner'
const companyExtendedSelect =
  'id, slug, name, category, website_url, tagline, description, mission, culture, benefits, hiring_process, logo_url, cover_image_url, brand_color, headquarters, is_partner'
const resumeBaseSelect = 'id, title, template_key, headline, summary, updated_at'
const resumeExtendedSelect = `${resumeBaseSelect}, file_path, file_name, file_mime_type, file_size`

function sanitizeProfileUpdates(userId, updates = {}) {
  const payload = { id: userId }
  const editableFields = [
    'username',
    'full_name',
    'school_email',
    'university_id',
    'major',
    'graduation_year',
    'headline',
    'bio',
    'avatar_path',
  ]

  for (const field of editableFields) {
    if (updates[field] !== undefined) {
      payload[field] = updates[field]
    }
  }

  if (updates.verification_status === 'submitted') {
    payload.verification_status = 'submitted'
  }

  return payload
}

function buildJobBadge({ arrangement, tags }) {
  if (tags?.length) {
    return tags[0]
  }

  if (arrangement === '원격') {
    return 'Remote'
  }

  if (arrangement === '하이브리드') {
    return 'Hybrid'
  }

  return 'Open'
}

function slugify(value) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || `post-${Date.now().toString(36)}`
}

function buildReferralCode(companySlug, jobSlug) {
  const companyPart = String(companySlug ?? 'partner')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toUpperCase()
    .slice(0, 10)
  const jobPart = jobSlug
    ? String(jobSlug).replace(/[^a-zA-Z0-9]+/g, '').toUpperCase().slice(0, 8)
    : 'SIGNUP'
  const suffix = Date.now().toString(36).toUpperCase().slice(-5)

  return `${companyPart}-${jobPart}-${suffix}`
}

function parseMultilineList(value) {
  return String(value ?? '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseTagList(value) {
  return [...new Set(String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean))]
}

function safeStorageFilename(filename) {
  return String(filename ?? 'asset')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || `asset-${Date.now().toString(36)}`
}

function normalizeResumeFileMetadata(row) {
  return {
    filePath: row?.file_path ?? '',
    fileName: row?.file_name ?? '',
    fileMimeType: row?.file_mime_type ?? '',
    fileSize: Number(row?.file_size ?? 0) || 0,
  }
}

function inferResumeMimeType(file) {
  if (file?.type) {
    return file.type
  }

  const filename = String(file?.name ?? '').toLowerCase()

  if (filename.endsWith('.pdf')) {
    return 'application/pdf'
  }

  if (filename.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }

  if (filename.endsWith('.doc')) {
    return 'application/msword'
  }

  return ''
}

function toIsoDeadline(value) {
  const normalized = String(value ?? '').trim()

  if (!normalized) {
    return null
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return new Date(`${normalized}T23:59:59+09:00`).toISOString()
  }

  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function mockUniversityRecords() {
  return mockUniversities.map((school) => ({
    id: school.domain,
    name: school.name,
    region: school.region,
    domain: school.domain,
  }))
}

function normalizeMockJob(job) {
  return {
    id: `mock-${job.slug}`,
    companyId: null,
    slug: job.slug,
    badge: job.badge,
    company: job.company,
    companySlug: null,
    title: job.title,
    role: job.role,
    location: job.location,
    arrangement: job.arrangement,
    experience: job.experience,
    education: job.education,
    deadline: job.deadline,
    deadlineAt: null,
    summary: job.summary,
    description: job.companyIntro,
    companyIntro: job.companyIntro,
    responsibilities: job.responsibilities,
    requirements: job.requirements,
    perks: job.perks,
    tags: [],
    publishedAt: null,
    createdAt: null,
    isMock: true,
    source: 'mock',
  }
}

function normalizeMockCommunityPost(post) {
  const content = Array.isArray(post.content) ? post.content : splitParagraphs(post.body)

  return {
    id: `mock-${post.slug}`,
    slug: post.slug,
    categoryId: null,
    category: post.category,
    title: post.title,
    excerpt: post.excerpt,
    body: content.join('\n\n'),
    content,
    authorId: null,
    author: post.author,
    university: post.university,
    createdAt: post.createdAt,
    createdAtRaw: post.createdAt,
    readTime: post.readTime,
    likes: post.likes,
    comments: post.comments,
    tags: post.tags ?? [],
    replies: (post.replies ?? []).map((reply, index) => ({
      id: `mock-reply-${post.slug}-${index}`,
      author: reply.author,
      body: reply.body,
      createdAt: post.createdAt,
    })),
    likedByViewer: false,
    isMock: true,
    source: 'mock',
  }
}

function normalizeMockInboxThread(thread) {
  return {
    id: `mock-${thread.id}`,
    name: thread.name,
    company: thread.company,
    role: thread.role,
    stage: thread.stage,
    subject: thread.role ?? thread.name,
    lastActive: thread.lastActive,
    lastMessage: thread.lastMessage,
    unread: thread.unread ?? 0,
    companyId: null,
    jobId: null,
    isMock: true,
    messages: (thread.messages ?? []).map((message, index) => ({
      id: `mock-message-${thread.id}-${index}`,
      from: message.from,
      body: message.body,
      time: message.time,
    })),
  }
}

function normalizeMockCompany(companyName) {
  const companyJobs = mockJobs.filter((job) => job.company === companyName)
  const slug = slugify(companyName)

  return {
    id: `mock-company-${slug}`,
    slug,
    name: companyName,
    category: companyJobs[0]?.role ?? 'Partner Company',
    websiteUrl: '',
    logoUrl: '',
    coverImageUrl: '',
    brandColor: '',
    tagline: companyJobs[0]?.summary ?? '',
    description: companyJobs[0]?.companyIntro ?? companyJobs[0]?.summary ?? '파트너 기업 소개가 준비 중입니다.',
    mission: '',
    culture: '',
    benefits: [],
    hiringProcess: [],
    headquarters: companyJobs[0]?.location ?? '위치 협의',
    jobCount: companyJobs.length,
    isPartner: true,
    isMock: true,
    jobs: companyJobs.map(normalizeMockJob),
  }
}

function buildMockJobList() {
  return mockJobs.map(normalizeMockJob)
}

function buildMockCompanyList() {
  return [...new Set(mockJobs.map((job) => job.company))]
    .filter(Boolean)
    .map(normalizeMockCompany)
}

function cacheJobCollection(jobs) {
  writeCachedResource('jobs:list', jobs)

  for (const job of jobs ?? []) {
    if (job?.slug) {
      writeCachedResource(`job:${job.slug}`, job)
    }
  }
}

function cacheCompanyCollection(companies) {
  writeCachedResource('companies:list', companies)

  for (const company of companies ?? []) {
    if (company?.slug) {
      writeCachedResource(`company:${company.slug}`, company)
    }
  }
}

export function getJobListSnapshot() {
  const cachedJobs = readCachedResource('jobs:list')

  return cachedJobs?.length ? cachedJobs : buildMockJobList()
}

export function getCompanyListSnapshot() {
  const cachedCompanies = readCachedResource('companies:list')

  return cachedCompanies?.length ? cachedCompanies : buildMockCompanyList()
}

function normalizeCompanyRow(company, jobs = []) {
  return {
    id: company.id,
    slug: company.slug,
    name: company.name,
    category: company.category ?? 'Partner Company',
    websiteUrl: company.website_url ?? '',
    logoUrl: company.logo_url ?? '',
    coverImageUrl: company.cover_image_url ?? '',
    brandColor: company.brand_color ?? '',
    tagline: company.tagline ?? '',
    description: company.description ?? '기업 소개가 준비 중입니다.',
    mission: company.mission ?? '',
    culture: company.culture ?? '',
    benefits: arrayFromJson(company.benefits),
    hiringProcess: arrayFromJson(company.hiring_process),
    headquarters: company.headquarters ?? '위치 협의',
    jobCount: jobs.length,
    isPartner: Boolean(company.is_partner),
    isMock: false,
    jobs,
  }
}

async function fetchCompaniesByIds(companyIds) {
  if (!isSupabaseConfigured || !supabase || companyIds.length === 0) {
    return new Map()
  }

  try {
    const { data } = await withTimeout(
      supabase
        .from('companies')
        .select('id, slug, name, description')
        .in('id', companyIds),
      2200,
      'fetchCompaniesByIds',
    )

    return new Map((data ?? []).map((company) => [company.id, company]))
  } catch (error) {
    if (isTimeoutError(error)) {
      return new Map()
    }

    throw error
  }
}

async function fetchJobTagsByJobIds(jobIds) {
  if (!isSupabaseConfigured || !supabase || jobIds.length === 0) {
    return new Map()
  }

  try {
    const { data } = await withTimeout(
      supabase
        .from('job_tags')
        .select('job_id, tag')
        .in('job_id', jobIds),
      1800,
      'fetchJobTagsByJobIds',
    )

    const tagMap = new Map()

    for (const row of data ?? []) {
      const currentTags = tagMap.get(row.job_id) ?? []
      currentTags.push(row.tag)
      tagMap.set(row.job_id, currentTags)
    }

    return tagMap
  } catch (error) {
    if (isTimeoutError(error)) {
      return new Map()
    }

    throw error
  }
}

async function fetchCategoryMap(categoryIds) {
  if (!isSupabaseConfigured || !supabase || categoryIds.length === 0) {
    return new Map()
  }

  const { data } = await supabase
    .from('community_categories')
    .select('id, slug, name')
    .in('id', categoryIds)

  return new Map((data ?? []).map((category) => [category.id, category]))
}

async function fetchProfileDisplayMap(userIds) {
  if (!isSupabaseConfigured || !supabase || userIds.length === 0) {
    return new Map()
  }

  const { data: publicProfileRows } = await supabase.rpc('get_profile_cards', {
    requested_user_ids: userIds,
  })

  if (publicProfileRows?.length) {
    return new Map(
      publicProfileRows.map((profile) => [
        profile.id,
        {
          fullName: profile.full_name ?? '익명 사용자',
          universityName: profile.university_name ?? '',
        },
      ]),
    )
  }

  const { data: profileRows } = await supabase
    .from('profiles')
    .select('id, full_name, username, university_id')
    .in('id', userIds)

  const universityIds = [...new Set((profileRows ?? []).map((profile) => profile.university_id).filter(Boolean))]
  const { data: universityRows } = universityIds.length
    ? await supabase.from('universities').select('id, name').in('id', universityIds)
    : { data: [] }

  const universityMap = new Map((universityRows ?? []).map((university) => [university.id, university.name]))

  return new Map(
    (profileRows ?? []).map((profile) => [
      profile.id,
      {
        fullName: profile.full_name ?? profile.username ?? '익명 사용자',
        universityName: profile.university_id ? universityMap.get(profile.university_id) ?? '' : '',
      },
    ]),
  )
}

function normalizeJobRow(job, companyMap, tagMap) {
  const company = companyMap.get(job.company_id)
  const tags = tagMap.get(job.id) ?? []

  return {
    id: job.id,
    companyId: job.company_id,
    slug: job.slug,
    badge: buildJobBadge({ arrangement: job.arrangement, tags }),
    company: company?.name ?? '파트너 기업',
    companySlug: company?.slug ?? null,
    title: job.title,
    role: job.role ?? '직군 미정',
    location: job.location ?? '위치 협의',
    arrangement: job.arrangement ?? '근무 형태 협의',
    experience: job.experience_label ?? '경력 무관',
    education: job.education_label ?? '학력 무관',
    deadline: formatDeadlineLabel(job.deadline_at),
    deadlineAt: job.deadline_at,
    summary: job.summary ?? buildExcerpt(job.description),
    description: job.description ?? '',
    companyIntro: company?.description ?? job.summary ?? '',
    responsibilities: arrayFromJson(job.responsibilities),
    requirements: arrayFromJson(job.requirements),
    perks: arrayFromJson(job.perks),
    tags,
    publishedAt: job.published_at,
    createdAt: job.created_at,
    isMock: false,
    source: 'supabase',
  }
}

function normalizeCommunityRow(post, categoryMap, profileMap) {
  const category = categoryMap.get(post.category_id)
  const profile = profileMap.get(post.author_id)
  const body = post.body ?? ''

  return {
    id: post.id,
    slug: post.slug,
    categoryId: post.category_id,
    category: category?.name ?? '커뮤니티',
    title: post.title,
    excerpt: post.excerpt ?? buildExcerpt(body),
    body,
    content: splitParagraphs(body),
    authorId: post.author_id,
    author: profile?.fullName ?? '익명 사용자',
    university: profile?.universityName ?? '',
    createdAt: formatDateLabel(post.published_at ?? post.created_at),
    createdAtRaw: post.published_at ?? post.created_at,
    readTime: buildReadTimeLabel(body),
    likes: post.like_count ?? 0,
    comments: post.comment_count ?? 0,
    tags: post.tags ?? [],
    replies: [],
    likedByViewer: false,
    isMock: false,
    source: 'supabase',
  }
}

function normalizePartnerJobRow(job, tagMap) {
  return {
    id: job.id,
    slug: job.slug,
    title: job.title,
    role: job.role ?? '',
    location: job.location ?? '',
    arrangement: job.arrangement ?? '',
    experience: job.experience_label ?? '',
    education: job.education_label ?? '',
    summary: job.summary ?? '',
    description: job.description ?? '',
    responsibilities: arrayFromJson(job.responsibilities),
    requirements: arrayFromJson(job.requirements),
    perks: arrayFromJson(job.perks),
    status: job.status ?? 'draft',
    deadlineAt: formatDateLabel(job.deadline_at),
    publishedAt: job.published_at ?? null,
    createdAt: formatDateLabel(job.created_at),
    tags: tagMap.get(job.id) ?? [],
  }
}

function normalizePartnerResumePreview(row) {
  const content = row?.version_content ?? {}

  return {
    applicationId: row?.application_id ?? '',
    resumeId: row?.resume_id ?? '',
    title: row?.resume_title ?? '제목 없는 이력서',
    templateKey: row?.template_key ?? '',
    headline: row?.headline ?? content.headline ?? '',
    summary: row?.summary ?? content.summary ?? '',
    versionNumber: row?.version_number ?? 0,
    versionCreatedAt: formatDateTimeLabel(row?.version_created_at),
    ...normalizeResumeFileMetadata(row),
    content,
    name: content.name ?? '',
    school: content.school ?? '',
    major: content.major ?? '',
    impact: content.impact ?? '',
    experience: content.experience ?? '',
    links: content.links ?? '',
  }
}

export async function listUniversities() {
  if (!isSupabaseConfigured || !supabase) {
    return mockUniversityRecords()
  }

  const { data, error } = await supabase
    .from('universities')
    .select('id, name, region_code, university_domains(domain, is_primary)')
    .eq('is_active', true)
    .order('name')

  if (error || !data?.length) {
    return mockUniversityRecords()
  }

  return data.map((school) => ({
    id: school.id,
    name: school.name,
    region: school.region_code,
    domain:
      school.university_domains?.find((domain) => domain.is_primary)?.domain ??
      school.university_domains?.[0]?.domain ??
      '',
  }))
}

export async function fetchProfile(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: null }
  }

  return supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
}

export async function updateProfile(userId, updates) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  return supabase
    .from('profiles')
    .upsert(
      sanitizeProfileUpdates(userId, updates),
      { onConflict: 'id' },
    )
    .select('*')
    .maybeSingle()
}

export async function submitVerificationRequest({ userId, updates }) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  const result = await supabase
    .rpc('candidate_submit_verification_request', {
      target_university_id: updates.university_id,
      target_school_email: updates.school_email,
      target_major: updates.major ?? null,
      target_graduation_year: updates.graduation_year ?? null,
      target_headline: updates.headline ?? null,
      target_bio: updates.bio ?? null,
    })
    .single()

  if (
    result.error &&
    (result.error.code === 'PGRST202' ||
      /candidate_submit_verification_request/.test(result.error.message ?? ''))
  ) {
    return updateProfile(userId, updates)
  }

  return result
}

export async function requestSchoolEmailVerificationCode({
  universityId,
  schoolEmail,
  major,
  graduationYear,
  headline,
  bio,
}) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  const normalizedEmail = String(schoolEmail ?? '').trim().toLowerCase()
  const parsedGraduationYear = Number.parseInt(String(graduationYear ?? '').trim(), 10)

  const rpcParams = {
    target_university_id: universityId,
    target_school_email: normalizedEmail,
    target_major: String(major ?? '').trim() || null,
    target_graduation_year: Number.isNaN(parsedGraduationYear) ? null : parsedGraduationYear,
    target_headline: String(headline ?? '').trim() || null,
    target_bio: String(bio ?? '').trim() || null,
  }

  const edgeFnBody = {
    universityId,
    schoolEmail: normalizedEmail,
    major: rpcParams.target_major,
    graduationYear: rpcParams.target_graduation_year,
    headline: rpcParams.target_headline,
    bio: rpcParams.target_bio,
  }

  let data = null
  let error = null

  const edgeResult = await supabase.functions.invoke('send-school-verification-code', { body: edgeFnBody })

  if (edgeResult.error) {
    const msg = String(edgeResult.error.message ?? '')
    const edgeFnUnavailable =
      /edge function/i.test(msg) ||
      /failed to send a request/i.test(msg) ||
      /non-2xx status code/i.test(msg) ||
      /fetch/i.test(msg)

    if (edgeFnUnavailable) {
      const rpcResult = await supabase.rpc('dev_request_school_email_verification_code', rpcParams).single()

      if (rpcResult.error) {
        return { data: null, error: new Error(rpcResult.error.message) }
      }

      data = rpcResult.data
    } else {
      error = edgeResult.error
    }
  } else {
    data = edgeResult.data
  }

  if (error) {
    return { data: null, error: new Error(error.message || '인증 코드를 보내지 못했습니다.') }
  }

  if (data?.error) {
    return { data: null, error: new Error(data.error) }
  }

  return {
    data: {
      challengeId: data?.challengeId ?? '',
      maskedEmail: data?.maskedEmail ?? normalizedEmail,
      expiresAt: data?.expiresAt ?? '',
      debugCode: data?.debugCode ?? '',
    },
    error: null,
  }
}

export async function confirmSchoolEmailVerificationCode({
  challengeId,
  code,
}) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  const normalizedCode = String(code ?? '').trim()

  if (!challengeId || normalizedCode.length < 4) {
    return { data: null, error: new Error('인증 코드를 확인해 주세요.') }
  }

  const result = await supabase
    .rpc('candidate_confirm_school_email_verification', {
      target_challenge_id: challengeId,
      submitted_code: normalizedCode,
    })

  if (result.error) {
    const msg = result.error.message ?? ''

    if (result.error.code === 'PGRST202' || /candidate_confirm_school_email_verification/.test(msg)) {
      return { data: null, error: new Error('인증 확인 기능이 아직 준비되지 않았습니다.') }
    }

    return { data: null, error: new Error(msg || '인증 코드 확인에 실패했습니다.') }
  }

  return { data: result.data?.[0] ?? result.data, error: null }
}

export async function ensureProfileFromAuth({
  user,
  fullName,
  schoolEmail,
  universityId,
}) {
  if (!isSupabaseConfigured || !supabase || !user?.id) {
    return { data: null, error: null }
  }

  return supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        full_name: fullName ?? user.user_metadata?.full_name ?? null,
        school_email: schoolEmail ?? user.user_metadata?.school_email ?? null,
        university_id: universityId ?? user.user_metadata?.university_id ?? null,
        user_role: 'candidate',
      },
      { onConflict: 'id' },
    )
    .select()
    .maybeSingle()
}

export async function listJobs() {
  const cachedJobs = readCachedResource('jobs:list')
  const cachedHasRealData = cachedJobs?.length && cachedJobs.some((j) => !j.isMock)

  if (cachedHasRealData) {
    return { data: cachedJobs, error: null }
  }

  if (!isSupabaseConfigured || !supabase) {
    const fallbackJobs = buildMockJobList()
    cacheJobCollection(fallbackJobs)
    return { data: fallbackJobs, error: null }
  }

  let jobRows
  let error

  try {
    const result = await withTimeout(
      supabase
        .from('jobs')
        .select(
          'id, company_id, slug, title, role, location, arrangement, experience_label, education_label, summary, description, responsibilities, requirements, perks, deadline_at, published_at, created_at, status',
        )
        .eq('status', 'published')
        .order('published_at', { ascending: false }),
      2500,
      'listJobs',
    )

    jobRows = result.data
    error = result.error
  } catch (requestError) {
    if (isTimeoutError(requestError)) {
      const fallbackJobs = buildMockJobList()
      cacheJobCollection(fallbackJobs)
      return { data: fallbackJobs, error: null }
    }

    throw requestError
  }

  if (error || !jobRows?.length) {
    const fallbackJobs = buildMockJobList()
    cacheJobCollection(fallbackJobs)
    return { data: fallbackJobs, error }
  }

  const companyIds = [...new Set(jobRows.map((job) => job.company_id).filter(Boolean))]
  const companyMap = await fetchCompaniesByIds(companyIds)
  const tagMap = await fetchJobTagsByJobIds(jobRows.map((job) => job.id))
  const normalizedJobs = jobRows.map((job) => normalizeJobRow(job, companyMap, tagMap))

  cacheJobCollection(normalizedJobs)

  return {
    data: normalizedJobs,
    error: null,
  }
}

export async function listCompanies() {
  const mockCompanies = buildMockCompanyList()
  const cachedCompanies = readCachedResource('companies:list')

  if (cachedCompanies?.length) {
    return { data: cachedCompanies, error: null }
  }

  if (!isSupabaseConfigured || !supabase) {
    cacheCompanyCollection(mockCompanies)
    return { data: mockCompanies, error: null }
  }

  let companyRows
  let error

  try {
    const result = await withTimeout(
      supabase
        .from('companies')
        .select(companyExtendedSelect)
        .eq('is_partner', true)
        .order('name'),
      2200,
      'listCompanies',
    )

    companyRows = result.data
    error = result.error
  } catch (requestError) {
    if (isTimeoutError(requestError)) {
      cacheCompanyCollection(mockCompanies)
      return { data: mockCompanies, error: null }
    }

    throw requestError
  }

  if (isMissingColumnError(error)) {
    const fallbackResult = await withTimeout(
      supabase
        .from('companies')
        .select(companyBaseSelect)
        .eq('is_partner', true)
        .order('name'),
      1800,
      'listCompaniesFallback',
    )

    companyRows = fallbackResult.data
    error = fallbackResult.error
  }

  if (error || !companyRows?.length) {
    cacheCompanyCollection(mockCompanies)
    return { data: mockCompanies, error }
  }

  const companyIds = companyRows.map((company) => company.id)
  let jobRows
  let jobError

  try {
    const jobResult = await withTimeout(
      supabase
        .from('jobs')
        .select('id, company_id, slug, title, role, location, arrangement, experience_label, education_label, summary, description, responsibilities, requirements, perks, deadline_at, published_at, created_at, status')
        .in('company_id', companyIds)
        .eq('status', 'published')
        .order('published_at', { ascending: false }),
      2200,
      'listCompaniesJobs',
    )

    jobRows = jobResult.data
    jobError = jobResult.error
  } catch (requestError) {
    if (isTimeoutError(requestError)) {
      const normalizedCompanies = companyRows.map((company) => normalizeCompanyRow(company, []))
      cacheCompanyCollection(normalizedCompanies)
      return { data: normalizedCompanies, error: null }
    }

    throw requestError
  }

  if (jobError) {
    return { data: null, error: jobError }
  }

  const tagMap = await fetchJobTagsByJobIds((jobRows ?? []).map((job) => job.id))
  const companyMap = new Map(companyRows.map((company) => [company.id, company]))
  const jobsByCompany = new Map()

  for (const job of jobRows ?? []) {
    const currentJobs = jobsByCompany.get(job.company_id) ?? []
    currentJobs.push(normalizeJobRow(job, companyMap, tagMap))
    jobsByCompany.set(job.company_id, currentJobs)
  }

  const normalizedCompanies = companyRows.map((company) =>
    normalizeCompanyRow(company, jobsByCompany.get(company.id) ?? []),
  )

  cacheCompanyCollection(normalizedCompanies)

  return {
    data: normalizedCompanies,
    error: null,
  }
}

export async function fetchCompanyBySlug(slug) {
  const mockCompany = buildMockCompanyList().find((company) => company.slug === slug)
  const cacheKey = `company:${slug}`
  const cachedCompany = readCachedResource(cacheKey)

  if (cachedCompany) {
    return { data: cachedCompany, error: null }
  }

  if (!isSupabaseConfigured || !supabase) {
    if (mockCompany) {
      cacheCompanyCollection([mockCompany])
    }

    return { data: mockCompany ?? null, error: null }
  }

  let companyRow
  let error

  try {
    const result = await withTimeout(
      supabase
        .from('companies')
        .select(companyExtendedSelect)
        .eq('slug', slug)
        .maybeSingle(),
      2200,
      'fetchCompanyBySlug',
    )

    companyRow = result.data
    error = result.error
  } catch (requestError) {
    if (isTimeoutError(requestError)) {
      if (mockCompany) {
        cacheCompanyCollection([mockCompany])
      }

      return { data: mockCompany ?? null, error: null }
    }

    throw requestError
  }

  if (isMissingColumnError(error)) {
    const fallbackResult = await withTimeout(
      supabase
        .from('companies')
        .select(companyBaseSelect)
        .eq('slug', slug)
        .maybeSingle(),
      1800,
      'fetchCompanyBySlugFallback',
    )

    companyRow = fallbackResult.data
    error = fallbackResult.error
  }

  if (error || !companyRow) {
    if (mockCompany) {
      cacheCompanyCollection([mockCompany])
    }

    return { data: mockCompany ?? null, error }
  }

  let jobRows
  let jobError

  try {
    const jobResult = await withTimeout(
      supabase
        .from('jobs')
        .select('id, company_id, slug, title, role, location, arrangement, experience_label, education_label, summary, description, responsibilities, requirements, perks, deadline_at, published_at, created_at, status')
        .eq('company_id', companyRow.id)
        .eq('status', 'published')
        .order('published_at', { ascending: false }),
      2200,
      'fetchCompanyBySlugJobs',
    )

    jobRows = jobResult.data
    jobError = jobResult.error
  } catch (requestError) {
    if (isTimeoutError(requestError)) {
      const normalizedCompany = normalizeCompanyRow(companyRow, [])
      cacheCompanyCollection([normalizedCompany])
      return { data: normalizedCompany, error: null }
    }

    throw requestError
  }

  if (jobError) {
    return { data: null, error: jobError }
  }

  const tagMap = await fetchJobTagsByJobIds((jobRows ?? []).map((job) => job.id))
  const companyMap = new Map([[companyRow.id, companyRow]])
  const normalizedCompany = normalizeCompanyRow(
    companyRow,
    (jobRows ?? []).map((job) => normalizeJobRow(job, companyMap, tagMap)),
  )

  cacheCompanyCollection([normalizedCompany])

  return {
    data: normalizedCompany,
    error: null,
  }
}

export async function createCompanyInfoRequest({ companyId, requesterId, question, context }) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  if (!isRealRecordId(companyId) || !requesterId) {
    return { data: null, error: new Error('기업 정보 요청을 남기려면 로그인과 실제 기업 정보가 필요합니다.') }
  }

  const normalizedQuestion = String(question ?? '').trim()

  if (normalizedQuestion.length < 8) {
    return { data: null, error: new Error('궁금한 점을 8자 이상으로 적어 주세요.') }
  }

  const { data, error } = await supabase
    .from('company_info_requests')
    .insert({
      company_id: companyId,
      requester_id: requesterId,
      question: normalizedQuestion,
      context: String(context ?? '').trim() || null,
    })
    .select('id, company_id, requester_id, question, status, created_at')
    .maybeSingle()

  if (isMissingRelationError(error)) {
    return {
      data: null,
      error: new Error('기업 정보 요청 테이블이 아직 없습니다. 0026_company_info_requests.sql 을 실행해 주세요.'),
    }
  }

  if (data) {
    const cacheKey = `companyQuestions:${companyId}`
    const cachedQuestions = readCachedResource(cacheKey) ?? []

    writeCachedResource(cacheKey, [
      {
        id: data.id,
        requesterId: data.requester_id,
        question: data.question,
        status: data.status ?? 'open',
        answer: '',
        answeredAt: '',
        createdAt: formatDateTimeLabel(data.created_at),
      },
      ...cachedQuestions,
    ].slice(0, 12))
  }

  return {
    data: data
      ? {
          id: data.id,
          companyId: data.company_id,
          requesterId: data.requester_id,
          question: data.question,
          status: data.status,
          createdAt: formatDateTimeLabel(data.created_at),
        }
      : null,
    error,
  }
}

export async function listCompanyInfoRequests(companyId) {
  if (!isSupabaseConfigured || !supabase || !isRealRecordId(companyId)) {
    return { data: [], error: null }
  }

  const cacheKey = `companyQuestions:${companyId}`
  const cachedQuestions = readCachedResource(cacheKey)

  if (cachedQuestions?.length) {
    return { data: cachedQuestions, error: null }
  }

  let data
  let error

  try {
    const result = await withTimeout(
      supabase
        .from('company_info_requests')
        .select('id, requester_id, question, status, answer, answered_at, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(12),
      1600,
      'listCompanyInfoRequests',
    )

    data = result.data
    error = result.error
  } catch (requestError) {
    if (isTimeoutError(requestError)) {
      return { data: [], error: null }
    }

    throw requestError
  }

  if (isMissingRelationError(error)) {
    return { data: [], error: null }
  }

  const normalizedRequests = (data ?? []).map((request) => ({
    id: request.id,
    requesterId: request.requester_id,
    question: request.question ?? '',
    status: request.status ?? 'open',
    answer: request.answer ?? '',
    answeredAt: formatDateTimeLabel(request.answered_at),
    createdAt: formatDateTimeLabel(request.created_at),
  }))

  writeCachedResource(cacheKey, normalizedRequests)

  return {
    data: normalizedRequests,
    error,
  }
}

export async function answerCompanyInfoRequest({ requestId, answer, status = 'answered' }) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  if (!isRealRecordId(requestId)) {
    return { data: null, error: new Error('답변할 기업 정보 요청을 선택해 주세요.') }
  }

  const normalizedAnswer = String(answer ?? '').trim()

  if (normalizedAnswer.length < 6) {
    return { data: null, error: new Error('답변을 6자 이상으로 입력해 주세요.') }
  }

  const { data, error } = await supabase
    .rpc('partner_answer_company_info_request', {
      target_request_id: requestId,
      answer_body: normalizedAnswer,
      next_status: status,
    })
    .single()

  if (
    error &&
    (error.code === 'PGRST202' ||
      /partner_answer_company_info_request/.test(error.message ?? ''))
  ) {
    return {
      data: null,
      error: new Error('기업 정보 답변 RPC가 아직 없습니다. 0026_company_info_requests.sql 을 실행해 주세요.'),
    }
  }

  return {
    data: data
      ? {
          id: data.id,
          status: data.status,
          answer: data.answer,
          answeredAt: formatDateTimeLabel(data.answered_at),
        }
      : null,
    error,
  }
}

export async function fetchJobBySlug(slug) {
  const fallback = mockJobs.find((job) => job.slug === slug)

  if (!isSupabaseConfigured || !supabase) {
    const fallbackJob = fallback ? normalizeMockJob(fallback) : null
    return { data: fallbackJob, error: null }
  }

  const cacheKey = `job:${slug}`
  const cachedJob = readCachedResource(cacheKey)
  if (cachedJob && !cachedJob.isMock) {
    return { data: cachedJob, error: null }
  }

  const { data: jobRow, error } = await supabase
    .from('jobs')
    .select(
      'id, company_id, slug, title, role, location, arrangement, experience_label, education_label, summary, description, responsibilities, requirements, perks, deadline_at, published_at, created_at, status',
    )
    .eq('slug', slug)
    .maybeSingle()

  if (error || !jobRow) {
    const fallbackJob = fallback ? normalizeMockJob(fallback) : null

    if (fallbackJob) {
      cacheJobCollection([fallbackJob])
    }

    return { data: fallbackJob, error }
  }

  const companyMap = await fetchCompaniesByIds(jobRow.company_id ? [jobRow.company_id] : [])
  const tagMap = await fetchJobTagsByJobIds([jobRow.id])

  const normalizedJob = normalizeJobRow(jobRow, companyMap, tagMap)
  cacheJobCollection([normalizedJob])

  return {
    data: normalizedJob,
    error: null,
  }
}

export async function fetchMyApplication(jobId, userId) {
  if (!isSupabaseConfigured || !supabase || !userId || !isRealRecordId(jobId)) {
    return { data: null, error: null }
  }

  return supabase
    .from('applications')
    .select('id, status, applied_at, resume_id, cover_note')
    .eq('job_id', jobId)
    .eq('user_id', userId)
    .maybeSingle()
}

export async function listSavedJobs(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from('saved_jobs')
    .select('id, job_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (isMissingRelationError(error)) {
    return { data: [], error: null }
  }

  return {
    data: (data ?? []).map((item) => ({
      id: item.id,
      jobId: item.job_id,
      savedAt: formatDateTimeLabel(item.created_at),
    })),
    error,
  }
}

export async function fetchSavedJob(jobId, userId) {
  if (!isSupabaseConfigured || !supabase || !userId || !isRealRecordId(jobId)) {
    return { data: null, error: null }
  }

  const { data, error } = await supabase
    .from('saved_jobs')
    .select('id, job_id, created_at')
    .eq('job_id', jobId)
    .eq('user_id', userId)
    .maybeSingle()

  if (isMissingRelationError(error)) {
    return { data: null, error: null }
  }

  return {
    data: data
      ? {
          id: data.id,
          jobId: data.job_id,
          savedAt: formatDateTimeLabel(data.created_at),
        }
      : null,
    error,
  }
}

export async function toggleSavedJob({ jobId, userId }) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  if (!isRealRecordId(jobId)) {
    return {
      data: null,
      error: new Error('실제 저장 기능을 쓰려면 Supabase에 공고 데이터를 먼저 준비해야 합니다.'),
    }
  }

  const existing = await fetchSavedJob(jobId, userId)

  if (existing.error) {
    return { data: null, error: existing.error }
  }

  if (existing.data?.id) {
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('id', existing.data.id)
      .eq('user_id', userId)

    return {
      data: {
        jobId,
        saved: false,
        savedJobId: existing.data.id,
      },
      error,
    }
  }

  const { data, error } = await supabase
    .from('saved_jobs')
    .insert({
      job_id: jobId,
      user_id: userId,
    })
    .select('id, job_id, created_at')
    .maybeSingle()

  if (isMissingRelationError(error)) {
    return {
      data: null,
      error: new Error('saved_jobs 테이블이 아직 없습니다. 0010_candidate_actions.sql 을 먼저 실행해 주세요.'),
    }
  }

  return {
    data: data
      ? {
          jobId: data.job_id,
          saved: true,
          savedJobId: data.id,
          savedAt: formatDateTimeLabel(data.created_at),
        }
      : null,
    error,
  }
}

export async function submitApplication({ jobId, userId, resumeId, coverNote }) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  if (!isRealRecordId(jobId)) {
    return {
      data: null,
      error: new Error('이 공고에는 지원할 수 없습니다. 다른 공고를 확인해주세요.'),
    }
  }

  const existing = await fetchMyApplication(jobId, userId)

  if (existing.data) {
    return { data: existing.data, error: null, existing: true }
  }

  const { data, error } = await supabase
    .from('applications')
    .insert({
      job_id: jobId,
      user_id: userId,
      resume_id: resumeId ?? null,
      cover_note: coverNote?.trim() || null,
    })
    .select('id, status, applied_at, resume_id, cover_note')
    .maybeSingle()

  if (!error && data?.id) {
    await supabase.from('application_status_history').insert({
      application_id: data.id,
      to_status: data.status ?? 'submitted',
      note: 'Candidate submitted via web application flow',
    })
  }

  return { data, error, existing: false }
}

export async function listAllApplications() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: [], error: new Error(supabaseSetupMessage) }
  }

  const { data: apps, error: appErr } = await supabase
    .from('applications')
    .select('id, status, applied_at, cover_note, resume_id, user_id, job_id')
    .order('applied_at', { ascending: false })
    .limit(200)

  if (appErr || !apps?.length) {
    return { data: apps ?? [], error: appErr }
  }

  const userIds = [...new Set(apps.map((a) => a.user_id).filter(Boolean))]
  const jobIds = [...new Set(apps.map((a) => a.job_id).filter(Boolean))]

  const [profileResult, jobResult] = await Promise.all([
    userIds.length
      ? supabase.from('profiles').select('id, full_name, school_email, major, headline, verification_status').in('id', userIds)
      : { data: [] },
    jobIds.length
      ? supabase.from('jobs').select('id, title, slug, role, location, arrangement, company_id').in('id', jobIds)
      : { data: [] },
  ])

  const profiles = profileResult.data ?? []
  const jobs = jobResult.data ?? []

  const companyIds = [...new Set(jobs.map((j) => j.company_id).filter(Boolean))]
  const companyResult = companyIds.length
    ? await supabase.from('companies').select('id, name, slug').in('id', companyIds)
    : { data: [] }
  const companies = companyResult.data ?? []

  const profileMap = new Map(profiles.map((p) => [p.id, p]))
  const companyMap = new Map(companies.map((c) => [c.id, c]))
  const jobMap = new Map(jobs.map((j) => [j.id, { ...j, companies: companyMap.get(j.company_id) ?? null }]))

  const enriched = apps.map((app) => ({
    ...app,
    profiles: profileMap.get(app.user_id) ?? null,
    jobs: jobMap.get(app.job_id) ?? null,
  }))

  return { data: enriched, error: null }
}

export async function adminUpdateApplicationStatus({ applicationId, nextStatus, note }) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  const { data: app, error: fetchErr } = await supabase
    .from('applications')
    .select('id, status')
    .eq('id', applicationId)
    .maybeSingle()

  if (fetchErr || !app) {
    return { data: null, error: fetchErr ?? new Error('지원을 찾을 수 없습니다.') }
  }

  const fromStatus = app.status

  const { error: updateErr } = await supabase
    .from('applications')
    .update({ status: nextStatus })
    .eq('id', applicationId)

  if (updateErr) {
    return { data: null, error: updateErr }
  }

  await supabase.from('application_status_history').insert({
    application_id: applicationId,
    from_status: fromStatus,
    to_status: nextStatus,
    note: note || `관리자가 상태를 ${nextStatus}로 변경`,
  })

  return { data: { id: applicationId, from_status: fromStatus, to_status: nextStatus }, error: null }
}

export async function adminListCompanies() {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: new Error(supabaseSetupMessage) }
  const { data, error } = await supabase
    .from('companies')
    .select('id, slug, name, category, headquarters, website_url, description, tagline, is_partner, created_at')
    .order('created_at', { ascending: false })
  return { data: data ?? [], error }
}

export async function adminCreateCompany(draft) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: new Error(supabaseSetupMessage) }
  const { data, error } = await supabase
    .from('companies')
    .insert({
      slug: draft.slug,
      name: draft.name,
      category: draft.category || null,
      headquarters: draft.headquarters || null,
      website_url: draft.websiteUrl || null,
      description: draft.description || null,
      tagline: draft.tagline || null,
      mission: draft.mission || null,
      culture: draft.culture || null,
      benefits: draft.benefits ? JSON.parse(draft.benefits) : null,
      hiring_process: draft.hiringProcess ? JSON.parse(draft.hiringProcess) : null,
      is_partner: draft.isPartner ?? true,
    })
    .select('id, slug, name')
    .maybeSingle()
  return { data, error }
}

export async function adminUpdateCompany(companyId, draft) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: new Error(supabaseSetupMessage) }
  const updates = {}
  if (draft.name !== undefined) updates.name = draft.name
  if (draft.category !== undefined) updates.category = draft.category
  if (draft.headquarters !== undefined) updates.headquarters = draft.headquarters
  if (draft.websiteUrl !== undefined) updates.website_url = draft.websiteUrl
  if (draft.description !== undefined) updates.description = draft.description
  if (draft.tagline !== undefined) updates.tagline = draft.tagline
  if (draft.isPartner !== undefined) updates.is_partner = draft.isPartner
  const { data, error } = await supabase
    .from('companies')
    .update(updates)
    .eq('id', companyId)
    .select('id, slug, name')
    .maybeSingle()
  return { data, error }
}

export async function adminDeleteCompany(companyId) {
  if (!isSupabaseConfigured || !supabase) return { error: new Error(supabaseSetupMessage) }
  const { error } = await supabase.from('companies').delete().eq('id', companyId)
  return { error }
}

export async function adminListJobs() {
  if (!isSupabaseConfigured || !supabase) return { data: [], error: new Error(supabaseSetupMessage) }
  const { data, error } = await supabase
    .from('jobs')
    .select('id, slug, title, role, location, arrangement, status, experience_label, education_label, summary, company_id, deadline_at, created_at')
    .order('created_at', { ascending: false })
  if (error) return { data: [], error }
  const companyIds = [...new Set(data.map((j) => j.company_id).filter(Boolean))]
  const { data: companies } = companyIds.length
    ? await supabase.from('companies').select('id, name, slug').in('id', companyIds)
    : { data: [] }
  const cmap = new Map((companies ?? []).map((c) => [c.id, c]))
  return { data: data.map((j) => ({ ...j, company: cmap.get(j.company_id) ?? null })), error: null }
}

export async function adminCreateJob(draft) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: new Error(supabaseSetupMessage) }
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      slug: draft.slug,
      company_id: draft.companyId,
      title: draft.title,
      role: draft.role || null,
      location: draft.location || null,
      arrangement: draft.arrangement || null,
      experience_label: draft.experience || null,
      education_label: draft.education || null,
      summary: draft.summary || null,
      description: draft.description || null,
      responsibilities: draft.responsibilities ? JSON.parse(draft.responsibilities) : null,
      requirements: draft.requirements ? JSON.parse(draft.requirements) : null,
      perks: draft.perks ? JSON.parse(draft.perks) : null,
      status: draft.status || 'published',
      deadline_at: draft.deadlineAt || null,
    })
    .select('id, slug, title')
    .maybeSingle()
  return { data, error }
}

export async function adminUpdateJob(jobId, draft) {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: new Error(supabaseSetupMessage) }
  const updates = {}
  if (draft.title !== undefined) updates.title = draft.title
  if (draft.role !== undefined) updates.role = draft.role
  if (draft.location !== undefined) updates.location = draft.location
  if (draft.arrangement !== undefined) updates.arrangement = draft.arrangement
  if (draft.experience !== undefined) updates.experience_label = draft.experience
  if (draft.education !== undefined) updates.education_label = draft.education
  if (draft.summary !== undefined) updates.summary = draft.summary
  if (draft.description !== undefined) updates.description = draft.description
  if (draft.status !== undefined) updates.status = draft.status
  if (draft.deadlineAt !== undefined) updates.deadline_at = draft.deadlineAt
  const { data, error } = await supabase
    .from('jobs')
    .update(updates)
    .eq('id', jobId)
    .select('id, slug, title')
    .maybeSingle()
  return { data, error }
}

export async function adminDeleteJob(jobId) {
  if (!isSupabaseConfigured || !supabase) return { error: new Error(supabaseSetupMessage) }
  const { error } = await supabase.from('jobs').delete().eq('id', jobId)
  return { error }
}

export async function withdrawApplication({ applicationId, note }) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  const result = await supabase
    .rpc('candidate_withdraw_application', {
      target_application_id: applicationId,
      withdrawal_note: note ?? null,
    })
    .single()

  if (
    result.error &&
    (result.error.code === 'PGRST202' ||
      /candidate_withdraw_application/.test(result.error.message ?? ''))
  ) {
    return {
      data: null,
      error: new Error('지원 철회 RPC가 아직 없습니다. 0010_candidate_actions.sql 을 먼저 실행해 주세요.'),
    }
  }

  return result
}

export async function createCoffeeChatRequest({ companyId, jobId, requesterId, requestMessage }) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  if (!isRealRecordId(companyId) || !requesterId) {
    return {
      data: null,
      error: new Error('실제 커피챗 요청을 보내려면 Supabase 회사/공고 데이터가 필요합니다.'),
    }
  }

  return supabase
    .from('coffee_chat_requests')
    .insert({
      company_id: companyId,
      job_id: isRealRecordId(jobId) ? jobId : null,
      requester_id: requesterId,
      request_message: requestMessage?.trim() || null,
    })
    .select('id, status, request_message, created_at')
    .maybeSingle()
}

export async function listCommunityCategories() {
  const fallback = ['전체', ...communityTopics]

  if (!isSupabaseConfigured || !supabase) {
    return { data: fallback, records: [], error: null }
  }

  const { data, error } = await supabase
    .from('community_categories')
    .select('id, slug, name')
    .order('name')

  if (error || !data?.length) {
    return { data: fallback, records: [], error }
  }

  return {
    data: ['전체', ...data.map((item) => item.name)],
    records: data,
    error: null,
  }
}

export async function listCommunityPosts() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: mockCommunityPosts.map(normalizeMockCommunityPost), error: null }
  }

  const { data: postRows, error } = await supabase
    .from('community_posts')
    .select('id, category_id, author_id, slug, title, excerpt, body, tags, like_count, comment_count, published_at, created_at')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })

  if (error || !postRows?.length) {
    return { data: mockCommunityPosts.map(normalizeMockCommunityPost), error }
  }

  const categoryMap = await fetchCategoryMap([...new Set(postRows.map((post) => post.category_id).filter(Boolean))])
  const profileMap = await fetchProfileDisplayMap([...new Set(postRows.map((post) => post.author_id).filter(Boolean))])

  return {
    data: postRows.map((post) => normalizeCommunityRow(post, categoryMap, profileMap)),
    error: null,
  }
}

export async function createCommunityPost({ authorId, categoryId, title, body, tags }) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  const normalizedBody = String(body ?? '').trim()
  const normalizedTitle = String(title ?? '').trim()

  if (!authorId || !categoryId || !normalizedTitle || !normalizedBody) {
    return { data: null, error: new Error('카테고리, 제목, 본문을 모두 입력해주세요.') }
  }

  const slug = `${slugify(normalizedTitle)}-${Date.now().toString(36)}`
  const parsedTags = Array.isArray(tags)
    ? tags.filter(Boolean)
    : String(tags ?? '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)

  const { data, error } = await supabase
    .from('community_posts')
    .insert({
      author_id: authorId,
      category_id: categoryId,
      slug,
      title: normalizedTitle,
      excerpt: buildExcerpt(normalizedBody),
      body: normalizedBody,
      tags: parsedTags,
      published_at: new Date().toISOString(),
    })
    .select('slug')
    .maybeSingle()

  if (error || !data?.slug) {
    return { data: null, error }
  }

  return fetchCommunityPostBySlug(data.slug, authorId)
}

export async function updateCommunityPost({ postId, authorId, title, body, tags }) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  const normalizedBody = String(body ?? '').trim()
  const normalizedTitle = String(title ?? '').trim()

  if (!postId || !authorId || !normalizedTitle || !normalizedBody) {
    return { data: null, error: new Error('제목과 본문을 모두 입력해주세요.') }
  }

  const parsedTags = parseTagList(Array.isArray(tags) ? tags.join(',') : tags)
  const excerpt = buildExcerpt(normalizedBody)

  const { data, error } = await supabase
    .from('community_posts')
    .update({
      title: normalizedTitle,
      excerpt,
      body: normalizedBody,
      tags: parsedTags,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)
    .eq('author_id', authorId)
    .select('id, title, excerpt, body, tags, updated_at')
    .maybeSingle()

  if (error || !data) {
    return { data: null, error: error ?? new Error('수정할 수 있는 게시글을 찾지 못했습니다.') }
  }

  return {
    data: {
      title: data.title,
      excerpt: data.excerpt ?? excerpt,
      body: data.body,
      content: splitParagraphs(data.body),
      tags: data.tags ?? parsedTags,
      readTime: buildReadTimeLabel(data.body),
      updatedAt: formatDateTimeLabel(data.updated_at),
    },
    error: null,
  }
}

export async function createCommunityReport({ reporterId, postId, commentId = null, reason }) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  if (!reporterId || (!postId && !commentId)) {
    return { data: null, error: new Error('신고할 대상을 확인할 수 없습니다.') }
  }

  const result = await supabase
    .from('community_reports')
    .insert({
      reporter_id: reporterId,
      post_id: postId,
      comment_id: commentId,
      reason: String(reason ?? 'user_report').trim() || 'user_report',
    })
    .select('id, status, created_at')
    .maybeSingle()

  if (isMissingRelationError(result.error)) {
    return {
      data: null,
      error: new Error('커뮤니티 신고 테이블이 아직 없습니다. 0017_community_reports.sql 을 먼저 실행해 주세요.'),
    }
  }

  return result
}

export async function fetchCommunityPostBySlug(slug, viewerId) {
  const fallback = mockCommunityPosts.find((post) => post.slug === slug)

  if (!isSupabaseConfigured || !supabase) {
    if (!fallback) {
      return { data: null, error: null }
    }

    const normalizedFallback = normalizeMockCommunityPost(fallback)
    const relatedPosts = mockCommunityPosts
      .filter((candidate) => candidate.slug !== fallback.slug && candidate.category === fallback.category)
      .slice(0, 2)
      .map(normalizeMockCommunityPost)

    return {
      data: {
        ...normalizedFallback,
        relatedPosts,
      },
      error: null,
    }
  }

  const { data: postRow, error } = await supabase
    .from('community_posts')
    .select('id, category_id, author_id, slug, title, excerpt, body, tags, like_count, comment_count, published_at, created_at')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !postRow) {
    if (!fallback) {
      return { data: null, error }
    }

    const normalizedFallback = normalizeMockCommunityPost(fallback)
    const relatedPosts = mockCommunityPosts
      .filter((candidate) => candidate.slug !== fallback.slug && candidate.category === fallback.category)
      .slice(0, 2)
      .map(normalizeMockCommunityPost)

    return {
      data: {
        ...normalizedFallback,
        relatedPosts,
      },
      error,
    }
  }

  const categoryMap = await fetchCategoryMap(postRow.category_id ? [postRow.category_id] : [])
  const authorMap = await fetchProfileDisplayMap(postRow.author_id ? [postRow.author_id] : [])

  const { data: commentRows } = await supabase
    .from('community_comments')
    .select('id, author_id, body, created_at')
    .eq('post_id', postRow.id)
    .order('created_at', { ascending: true })

  const commentAuthorIds = [...new Set((commentRows ?? []).map((comment) => comment.author_id).filter(Boolean))]
  const commentAuthorMap = await fetchProfileDisplayMap(commentAuthorIds)

  const { count: likeCount } = await supabase
    .from('community_reactions')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postRow.id)
    .eq('kind', 'like')

  const { count: commentCount } = await supabase
    .from('community_comments')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postRow.id)

  const { data: likedReaction } = viewerId
    ? await supabase
        .from('community_reactions')
        .select('id')
        .eq('post_id', postRow.id)
        .eq('user_id', viewerId)
        .eq('kind', 'like')
        .maybeSingle()
    : { data: null }

  const { data: relatedRows } = await supabase
    .from('community_posts')
    .select('id, category_id, author_id, slug, title, excerpt, body, tags, like_count, comment_count, published_at, created_at')
    .eq('category_id', postRow.category_id)
    .neq('id', postRow.id)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(2)

  const relatedAuthorMap = await fetchProfileDisplayMap([
    ...new Set((relatedRows ?? []).map((post) => post.author_id).filter(Boolean)),
  ])

  return {
    data: {
      ...normalizeCommunityRow(postRow, categoryMap, authorMap),
      likes: likeCount ?? postRow.like_count ?? 0,
      comments: commentCount ?? commentRows?.length ?? postRow.comment_count ?? 0,
      replies: (commentRows ?? []).map((comment) => ({
        id: comment.id,
        authorId: comment.author_id,
        author: commentAuthorMap.get(comment.author_id)?.fullName ?? '익명 사용자',
        body: comment.body,
        createdAt: formatDateLabel(comment.created_at),
      })),
      likedByViewer: Boolean(likedReaction?.id),
      relatedPosts: (relatedRows ?? []).map((relatedPost) =>
        normalizeCommunityRow(relatedPost, categoryMap, relatedAuthorMap),
      ),
    },
    error: null,
  }
}

export async function toggleCommunityReaction({ postId, userId, liked }) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  if (!postId || !userId) {
    return { data: null, error: new Error('로그인 후 좋아요를 눌러주세요.') }
  }

  const action = liked
    ? supabase
        .from('community_reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('kind', 'like')
    : supabase.from('community_reactions').insert({
        post_id: postId,
        user_id: userId,
        kind: 'like',
      })

  const { error } = await action

  if (error) {
    return { data: null, error }
  }

  const { count } = await supabase
    .from('community_reactions')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postId)
    .eq('kind', 'like')

  return {
    data: {
      liked: !liked,
      likeCount: count ?? 0,
    },
    error: null,
  }
}

export async function createCommunityComment({ postId, authorId, body }) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  const normalizedBody = String(body ?? '').trim()

  if (!postId || !authorId || !normalizedBody) {
    return { data: null, error: new Error('댓글 내용을 입력해주세요.') }
  }

  const { data, error } = await supabase
    .from('community_comments')
    .insert({
      post_id: postId,
      author_id: authorId,
      body: normalizedBody,
    })
    .select('id, author_id, body, created_at')
    .maybeSingle()

  if (error || !data) {
    return { data: null, error }
  }

  const authorMap = await fetchProfileDisplayMap([authorId])
  const { count } = await supabase
    .from('community_comments')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postId)

  return {
    data: {
      comment: {
        id: data.id,
        authorId: data.author_id,
        author: authorMap.get(authorId)?.fullName ?? '익명 사용자',
        body: data.body,
        createdAt: formatDateLabel(data.created_at),
      },
      commentCount: count ?? 0,
    },
    error: null,
  }
}

export async function updateCommunityComment({ commentId, authorId, body }) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  const normalizedBody = String(body ?? '').trim()

  if (!commentId || !authorId || !normalizedBody) {
    return { data: null, error: new Error('댓글 내용을 입력해주세요.') }
  }

  const { data, error } = await supabase
    .from('community_comments')
    .update({
      body: normalizedBody,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .eq('author_id', authorId)
    .select('id, author_id, body, updated_at')
    .maybeSingle()

  if (error || !data) {
    return { data: null, error: error ?? new Error('수정할 수 있는 댓글을 찾지 못했습니다.') }
  }

  return {
    data: {
      id: data.id,
      authorId: data.author_id,
      body: data.body,
      updatedAt: formatDateTimeLabel(data.updated_at),
    },
    error: null,
  }
}

export async function fetchResumeDraft(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return {
      data: {
        resumeId: null,
        title: 'Builder Profile Resume',
        templateKey: 'Builder Profile',
        updatedAt: null,
        content: { ...resumeSeed },
      },
      error: null,
    }
  }

  let { data: resumeRow, error } = await supabase
    .from('resumes')
    .select(resumeExtendedSelect)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (isMissingColumnError(error)) {
    const fallbackResult = await supabase
      .from('resumes')
      .select(resumeBaseSelect)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    resumeRow = fallbackResult.data
    error = fallbackResult.error
  }

  if (error) {
    return { data: null, error }
  }

  if (!resumeRow) {
    return { data: null, error: null }
  }

  const { data: versionRows } = await supabase
    .from('resume_versions')
    .select('id, version_number, content, created_at')
    .eq('resume_id', resumeRow.id)
    .order('version_number', { ascending: false })
    .limit(1)

  const latestVersion = versionRows?.[0] ?? null

  return {
    data: {
      resumeId: resumeRow.id,
      title: resumeRow.title,
      templateKey: resumeRow.template_key,
      headline: resumeRow.headline,
      summary: resumeRow.summary,
      updatedAt: resumeRow.updated_at,
      ...normalizeResumeFileMetadata(resumeRow),
      content: latestVersion?.content ?? {},
      versionNumber: latestVersion?.version_number ?? 0,
    },
    error: null,
  }
}

export async function listResumeDrafts(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    const fallback = await fetchResumeDraft(userId)
    return { data: fallback.data?.resumeId ? [fallback.data] : [], error: fallback.error ?? null }
  }

  let { data, error } = await supabase
    .from('resumes')
    .select(resumeExtendedSelect)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(8)

  if (isMissingColumnError(error)) {
    const fallbackResult = await supabase
      .from('resumes')
      .select(resumeBaseSelect)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(8)

    data = fallbackResult.data
    error = fallbackResult.error
  }

  if (error) {
    return { data: [], error }
  }

  return {
    data: (data ?? []).map((resume) => ({
      resumeId: resume.id,
      title: resume.title,
      templateKey: resume.template_key,
      headline: resume.headline,
      summary: resume.summary,
      updatedAt: resume.updated_at,
      ...normalizeResumeFileMetadata(resume),
    })),
    error: null,
  }
}

export async function listResumeVersions(userId, resumeId = null) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: [], error: null }
  }

  let targetResumeId = resumeId

  if (!targetResumeId) {
    const { data: latestResume, error: resumeError } = await supabase
      .from('resumes')
      .select('id, template_key, title')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (resumeError || !latestResume?.id) {
      return { data: [], error: resumeError }
    }

    targetResumeId = latestResume.id
  }

  const [{ data: resumeRow, error: resumeError }, { data: versionRows, error: versionError }] = await Promise.all([
    supabase
      .from('resumes')
      .select('id, title, template_key')
      .eq('id', targetResumeId)
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('resume_versions')
      .select('id, version_number, content, created_at')
      .eq('resume_id', targetResumeId)
      .order('version_number', { ascending: false })
      .limit(12),
  ])

  if (resumeError || versionError || !resumeRow?.id) {
    return { data: [], error: resumeError ?? versionError }
  }

  return {
    data: (versionRows ?? []).map((version) => ({
      id: version.id,
      resumeId: resumeRow.id,
      title: resumeRow.title,
      templateKey: resumeRow.template_key,
      versionNumber: version.version_number,
      createdAt: formatDateTimeLabel(version.created_at),
      targetJobSlug: version.content?.targetJobSlug ?? '',
      headline: version.content?.headline ?? '',
      summary: version.content?.summary ?? '',
      content: version.content ?? {},
    })),
    error: null,
  }
}

export async function saveResumeDraft({
  userId,
  resumeId,
  title,
  templateKey,
  headline,
  summary,
  content,
}) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  if (!userId) {
    return { data: null, error: new Error('로그인 정보가 필요합니다.') }
  }

  const payload = {
    user_id: userId,
    title: String(title ?? '').trim() || 'Builder Profile Resume',
    template_key: templateKey ?? 'Builder Profile',
    headline: headline ?? null,
    summary: summary ?? null,
  }

  const resumeQuery = resumeId
    ? supabase.from('resumes').update(payload).eq('id', resumeId).select(resumeExtendedSelect).maybeSingle()
    : supabase.from('resumes').insert(payload).select(resumeExtendedSelect).maybeSingle()

  let { data: savedResume, error } = await resumeQuery

  if (isMissingColumnError(error)) {
    const fallbackQuery = resumeId
      ? supabase.from('resumes').update(payload).eq('id', resumeId).select(resumeBaseSelect).maybeSingle()
      : supabase.from('resumes').insert(payload).select(resumeBaseSelect).maybeSingle()

    const fallbackResult = await fallbackQuery
    savedResume = fallbackResult.data
    error = fallbackResult.error
  }

  if (error || !savedResume) {
    return { data: null, error }
  }

  const { data: versionRows } = await supabase
    .from('resume_versions')
    .select('version_number')
    .eq('resume_id', savedResume.id)
    .order('version_number', { ascending: false })
    .limit(1)

  const nextVersionNumber = (versionRows?.[0]?.version_number ?? 0) + 1

  const { error: versionError } = await supabase.from('resume_versions').insert({
    resume_id: savedResume.id,
    version_number: nextVersionNumber,
    content: content ?? {},
  })

  if (versionError) {
    return { data: null, error: versionError }
  }

  return {
    data: {
      resumeId: savedResume.id,
      title: savedResume.title,
      templateKey: savedResume.template_key,
      headline: savedResume.headline,
      summary: savedResume.summary,
      updatedAt: new Date().toISOString(),
      ...normalizeResumeFileMetadata(savedResume),
      content: content ?? {},
      versionNumber: nextVersionNumber,
    },
    error: null,
  }
}

export async function uploadResumeAttachment({ userId, resumeId, file }) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  if (!userId || !isRealRecordId(resumeId)) {
    return { data: null, error: new Error('먼저 이력서를 저장한 뒤 파일을 첨부해 주세요.') }
  }

  if (!file) {
    return { data: null, error: new Error('첨부할 이력서 파일을 선택해 주세요.') }
  }

  const mimeType = inferResumeMimeType(file)
  const allowedMimeTypes = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ])

  if (!allowedMimeTypes.has(mimeType)) {
    return { data: null, error: new Error('PDF, DOC, DOCX 파일만 첨부할 수 있습니다.') }
  }

  if (file.size > 10 * 1024 * 1024) {
    return { data: null, error: new Error('이력서 파일은 10MB 이하로 첨부해 주세요.') }
  }

  const path = `${userId}/${resumeId}/${Date.now().toString(36)}-${safeStorageFilename(file.name)}`
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('resume-files')
    .upload(path, file, {
      cacheControl: '3600',
      contentType: mimeType,
      upsert: true,
    })

  if (uploadError) {
    return { data: null, error: uploadError }
  }

  const { data, error } = await supabase
    .from('resumes')
    .update({
      file_path: uploadData.path,
      file_name: file.name,
      file_mime_type: mimeType,
      file_size: file.size,
    })
    .eq('id', resumeId)
    .eq('user_id', userId)
    .select(resumeExtendedSelect)
    .maybeSingle()

  if (error || !data) {
    return { data: null, error: error ?? new Error('파일 메타데이터를 이력서에 연결하지 못했습니다.') }
  }

  return {
    data: {
      resumeId: data.id,
      title: data.title,
      templateKey: data.template_key,
      headline: data.headline,
      summary: data.summary,
      updatedAt: data.updated_at,
      ...normalizeResumeFileMetadata(data),
    },
    error: null,
  }
}

export async function createResumeAttachmentSignedUrl(filePath) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  const normalizedPath = String(filePath ?? '').trim()

  if (!normalizedPath) {
    return { data: null, error: new Error('열 수 있는 이력서 첨부 파일이 없습니다.') }
  }

  const { data, error } = await supabase.storage
    .from('resume-files')
    .createSignedUrl(normalizedPath, 60 * 5)

  if (data?.signedUrl) {
    await supabase.rpc('log_resume_file_access', {
      target_file_path: normalizedPath,
    })
  }

  return {
    data: data?.signedUrl ? { signedUrl: data.signedUrl } : null,
    error,
  }
}

export async function fetchCandidateDashboard(userId) {
  if (!userId) {
    return { data: null, error: new Error('로그인 정보가 필요합니다.') }
  }

  if (!isSupabaseConfigured || !supabase) {
    return {
      data: {
        profileSummary: null,
        applications: [],
        metrics: [
          { label: '지원 현황', value: '0건' },
          { label: '진행중 지원', value: '0건' },
          { label: '학교 인증', value: '미설정' },
        ],
      },
      error: new Error(supabaseSetupMessage),
    }
  }

  const [profileResult, { data: applicationRows, error: applicationError }] = await Promise.all([
    fetchProfile(userId),
    supabase
      .from('applications')
      .select('id, job_id, status, cover_note, applied_at')
      .eq('user_id', userId)
      .order('applied_at', { ascending: false }),
  ])

  const profileRow = profileResult.data ?? null
  const primaryError = profileResult.error ?? applicationError

  if (primaryError) {
    return { data: null, error: primaryError }
  }

  const universityPromise = profileRow?.university_id
    ? supabase
        .from('universities')
        .select('id, name')
        .eq('id', profileRow.university_id)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null })

  const jobIds = [...new Set((applicationRows ?? []).map((item) => item.job_id).filter(Boolean))]
  const applicationIds = [...new Set((applicationRows ?? []).map((item) => item.id).filter(Boolean))]
  const { data: jobRows, error: jobError } = jobIds.length
    ? await supabase
        .from('jobs')
        .select(
          'id, company_id, slug, title, role, location, arrangement, experience_label, education_label, summary, description, responsibilities, requirements, perks, deadline_at, published_at, created_at',
        )
        .in('id', jobIds)
    : { data: [], error: null }

  if (jobError) {
    return { data: null, error: jobError }
  }

  const { data: applicationHistoryRows, error: applicationHistoryError } = applicationIds.length
    ? await supabase
        .from('application_status_history')
        .select('id, application_id, from_status, to_status, note, created_at')
        .in('application_id', applicationIds)
        .order('created_at', { ascending: false })
    : { data: [], error: null }

  if (applicationHistoryError) {
    return { data: null, error: applicationHistoryError }
  }

  const [universityResult] = await Promise.all([universityPromise])
  const universityName = universityResult.data?.name ?? ''
  const jobMap = new Map((jobRows ?? []).map((job) => [job.id, job]))
  const applicationHistoryMap = new Map()

  for (const historyItem of applicationHistoryRows ?? []) {
    const currentHistory = applicationHistoryMap.get(historyItem.application_id) ?? []
    currentHistory.push(historyItem)
    applicationHistoryMap.set(historyItem.application_id, currentHistory)
  }

  const companyIds = [...new Set((jobRows ?? []).map((job) => job.company_id).filter(Boolean))]
  const companyMap = await fetchCompaniesByIds(companyIds)
  const tagMap = await fetchJobTagsByJobIds(jobIds)

  const applications = (applicationRows ?? []).map((application) => {
    const job = jobMap.get(application.job_id)
    const normalizedJob = job ? normalizeJobRow(job, companyMap, tagMap) : null
    const company = job?.company_id ? companyMap.get(job.company_id) : null
    const history = (applicationHistoryMap.get(application.id) ?? []).map((historyItem) => ({
      id: historyItem.id,
      fromStatus: historyItem.from_status,
      toStatus: historyItem.to_status,
      note: historyItem.note ?? '',
      createdAt: formatDateTimeLabel(historyItem.created_at),
    }))

    return {
      id: application.id,
      title: job?.title ?? '공고 미상',
      company: company?.name ?? '파트너 기업',
      status: application.status,
      role: normalizedJob?.role ?? '직군 미정',
      location: normalizedJob?.location ?? '위치 협의',
      arrangement: normalizedJob?.arrangement ?? '근무 형태 협의',
      experience: normalizedJob?.experience ?? '경력 무관',
      education: normalizedJob?.education ?? '학력 무관',
      deadline: normalizedJob?.deadline ?? '상시',
      summary: normalizedJob?.summary ?? '',
      tags: normalizedJob?.tags ?? [],
      appliedAt: formatDateLabel(application.applied_at),
      lastUpdatedAt: history[0]?.createdAt ?? formatDateTimeLabel(application.applied_at),
      history,
      coverNote: application.cover_note ?? '',
      linkPath: job?.slug ? `/jobs/${job.slug}` : '/jobs',
    }
  })

  const activeApplications = applications.filter(
    (item) => !['rejected', 'withdrawn'].includes(item.status),
  ).length
  const verificationLabelMap = {
    pending: '미인증',
    submitted: '검토중',
    verified: '인증 완료',
    rejected: '재검토 필요',
  }

  return {
    data: {
      profileSummary: profileRow
        ? {
            fullName: profileRow.full_name ?? '',
            schoolEmail: profileRow.school_email ?? '',
            universityName,
            major: profileRow.major ?? '',
            graduationYear: profileRow.graduation_year ? String(profileRow.graduation_year) : '',
            headline: profileRow.headline ?? '',
            bio: profileRow.bio ?? '',
            verificationStatus: profileRow.verification_status ?? 'pending',
          }
        : null,
      applications,
      metrics: [
        { label: '지원 현황', value: `${applications.length}건` },
        { label: '진행중 지원', value: `${activeApplications}건` },
        {
          label: '학교 인증',
          value: verificationLabelMap[profileRow?.verification_status] ?? '미설정',
        },
      ],
    },
    error: null,
  }
}

export async function listInboxThreads(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: mockInboxThreads.map(normalizeMockInboxThread), error: null }
  }

  const { data: participantRows, error: participantError } = await supabase
    .from('thread_participants')
    .select('thread_id, last_read_at')
    .eq('user_id', userId)

  if (participantError || !participantRows?.length) {
    return { data: mockInboxThreads.map(normalizeMockInboxThread), error: participantError }
  }

  const threadIds = participantRows.map((participant) => participant.thread_id)
  const participantMap = new Map(participantRows.map((participant) => [participant.thread_id, participant]))

  const { data: threadRows, error: threadError } = await supabase
    .from('inbox_threads')
    .select('id, subject, company_id, job_id, created_at, updated_at')
    .in('id', threadIds)
    .order('updated_at', { ascending: false })

  if (threadError || !threadRows?.length) {
    return { data: mockInboxThreads.map(normalizeMockInboxThread), error: threadError }
  }

  const { data: messageRows } = await supabase
    .from('thread_messages')
    .select('id, thread_id, sender_id, body, created_at')
    .in('thread_id', threadIds)
    .order('created_at', { ascending: true })

  const messagesByThread = new Map()

  for (const message of messageRows ?? []) {
    const currentMessages = messagesByThread.get(message.thread_id) ?? []
    currentMessages.push(message)
    messagesByThread.set(message.thread_id, currentMessages)
  }

  const jobIds = [...new Set(threadRows.map((thread) => thread.job_id).filter(Boolean))]
  const companyIds = [...new Set(threadRows.map((thread) => thread.company_id).filter(Boolean))]
  const { data: jobRows } = jobIds.length
    ? await supabase.from('jobs').select('id, title, role, company_id').in('id', jobIds)
    : { data: [] }

  const jobMap = new Map((jobRows ?? []).map((job) => [job.id, job]))
  const derivedCompanyIds = [...new Set((jobRows ?? []).map((job) => job.company_id).filter(Boolean))]
  const companyMap = await fetchCompaniesByIds([...new Set([...companyIds, ...derivedCompanyIds])])

  return {
    data: threadRows.map((thread) => {
      const job = thread.job_id ? jobMap.get(thread.job_id) : null
      const company =
        companyMap.get(thread.company_id) ??
        (job?.company_id ? companyMap.get(job.company_id) : null) ??
        null
      const messages = messagesByThread.get(thread.id) ?? []
      const participant = participantMap.get(thread.id)
      const lastMessage = messages[messages.length - 1] ?? null
      const unread = messages.filter((message) => {
        if (message.sender_id === userId) {
          return false
        }

        if (!participant?.last_read_at) {
          return true
        }

        return new Date(message.created_at).getTime() > new Date(participant.last_read_at).getTime()
      }).length

      return {
        id: thread.id,
        name: company?.name ?? thread.subject ?? '내 메모',
        company: company?.name ?? '개인 메모',
        role: job?.title ?? thread.subject ?? '메시지 스레드',
        stage: company ? '대화 진행 중' : '개인 메모',
        subject: thread.subject ?? job?.title ?? company?.name ?? '메시지 스레드',
        lastActive: formatDateTimeLabel(thread.updated_at ?? lastMessage?.created_at ?? thread.created_at),
        lastMessage: lastMessage?.body ?? '아직 메시지가 없습니다. 첫 메시지를 보내보세요.',
        unread,
        companyId: company?.id ?? thread.company_id ?? job?.company_id ?? null,
        jobId: job?.id ?? thread.job_id ?? null,
        isMock: false,
        messages: messages.map((message) => ({
          id: message.id,
          from: message.sender_id === userId ? 'me' : 'them',
          body: message.body,
          time: formatDateTimeLabel(message.created_at),
        })),
      }
    }),
    error: null,
  }
}

export async function createInboxThread({ userId, subject, companyId, jobId }) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  if (!userId) {
    return { data: null, error: new Error('로그인 정보가 필요합니다.') }
  }

  const normalizedSubject = String(subject ?? '').trim() || '새 메시지 스레드'

  const { data: threadRow, error: threadError } = await supabase
    .from('inbox_threads')
    .insert({
      subject: normalizedSubject,
      company_id: isRealRecordId(companyId) ? companyId : null,
      job_id: isRealRecordId(jobId) ? jobId : null,
      created_by: userId,
    })
    .select('id, subject')
    .maybeSingle()

  if (threadError || !threadRow?.id) {
    return { data: null, error: threadError }
  }

  const { error: participantError } = await supabase.from('thread_participants').insert({
    thread_id: threadRow.id,
    user_id: userId,
    participant_role: 'owner',
    last_read_at: new Date().toISOString(),
  })

  if (participantError) {
    return { data: null, error: participantError }
  }

  return {
    data: {
      threadId: threadRow.id,
      subject: threadRow.subject,
    },
    error: null,
  }
}

export async function markInboxThreadRead({ threadId, userId }) {
  if (!isSupabaseConfigured || !supabase || !threadId || !userId) {
    return { data: null, error: null }
  }

  return supabase
    .from('thread_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('thread_id', threadId)
    .eq('user_id', userId)
    .select('thread_id, last_read_at')
    .maybeSingle()
}

export async function sendInboxMessage({ threadId, userId, body }) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  const normalizedBody = String(body ?? '').trim()

  if (!threadId || !userId || !normalizedBody) {
    return { data: null, error: new Error('보낼 메시지를 입력해주세요.') }
  }

  const { data: messageRow, error } = await supabase
    .from('thread_messages')
    .insert({
      thread_id: threadId,
      sender_id: userId,
      body: normalizedBody,
    })
    .select('id, body, created_at')
    .maybeSingle()

  if (error || !messageRow) {
    return { data: null, error }
  }

  await Promise.all([
    supabase
      .from('thread_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('thread_id', threadId)
      .eq('user_id', userId),
    supabase
      .from('inbox_threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', threadId),
  ])

  return {
    data: {
      id: messageRow.id,
      from: 'me',
      body: messageRow.body,
      time: formatDateTimeLabel(messageRow.created_at),
    },
    error: null,
  }
}

export async function listPartnerCompanies() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: [], error: new Error(supabaseSetupMessage) }
  }

  const { data, error } = await supabase
    .from('companies')
    .select('id, slug, name, description, headquarters, is_partner')
    .eq('is_partner', true)
    .order('name')

  return { data: data ?? [], error }
}

export async function activateDemoPartnerWorkspace({ companySlug }) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  return supabase
    .rpc('activate_demo_partner_workspace', {
      target_company_slug: companySlug,
    })
    .single()
}

export async function createReferralLink({
  companyId,
  createdBy,
  companySlug,
  jobId,
  jobSlug,
}) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  const code = buildReferralCode(companySlug, jobSlug)
  const landingPath = jobSlug ? `/jobs/${jobSlug}?ref=${code}` : `/auth?ref=${code}`

  return supabase
    .from('referral_links')
    .insert({
      company_id: companyId,
      job_id: isRealRecordId(jobId) ? jobId : null,
      created_by: createdBy,
      code,
      landing_path: landingPath,
    })
    .select('id, code, landing_path, job_id, company_id, created_at')
    .maybeSingle()
}

export async function createPartnerCompanyInvite({ companyId, email, memberRole }) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  if (!isRealRecordId(companyId)) {
    return { data: null, error: new Error('회사 워크스페이스가 연결되지 않았습니다.') }
  }

  const normalizedEmail = String(email ?? '').trim().toLowerCase()

  if (!normalizedEmail.includes('@')) {
    return { data: null, error: new Error('초대할 팀원의 이메일을 입력해 주세요.') }
  }

  const { data, error } = await supabase
    .rpc('partner_create_company_invite', {
      target_company_id: companyId,
      invitee_email: normalizedEmail,
      invitee_role: memberRole ?? 'recruiter',
    })
    .single()

  if (
    error &&
    (error.code === 'PGRST202' ||
      /partner_create_company_invite/.test(error.message ?? ''))
  ) {
    return {
      data: null,
      error: new Error('팀원 초대 RPC가 아직 없습니다. 0018_company_invites.sql 을 먼저 실행해 주세요.'),
    }
  }

  return { data, error }
}

export async function acceptPartnerCompanyInvite({ token }) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  const normalizedToken = String(token ?? '').trim()

  if (!normalizedToken) {
    return { data: null, error: new Error('초대 토큰을 확인할 수 없습니다.') }
  }

  const { data, error } = await supabase
    .rpc('accept_company_invite', {
      invite_token: normalizedToken,
    })
    .single()

  if (
    error &&
    (error.code === 'PGRST202' ||
      /accept_company_invite/.test(error.message ?? ''))
  ) {
    return {
      data: null,
      error: new Error('초대 수락 RPC가 아직 없습니다. 0018_company_invites.sql 을 먼저 실행해 주세요.'),
    }
  }

  return { data, error }
}

export async function savePartnerCompanyProfile({ companyId, draft }) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  if (!isRealRecordId(companyId)) {
    return { data: null, error: new Error('회사 워크스페이스가 연결되지 않았습니다.') }
  }

  const name = String(draft?.name ?? '').trim()

  if (!name) {
    return { data: null, error: new Error('회사명을 입력해 주세요.') }
  }

  const result = await supabase
    .rpc('partner_update_company_profile', {
      target_company_id: companyId,
      company_name: name,
      company_category: String(draft?.category ?? '').trim() || null,
      company_website_url: String(draft?.websiteUrl ?? '').trim() || null,
      company_headquarters: String(draft?.headquarters ?? '').trim() || null,
      company_description: String(draft?.description ?? '').trim() || null,
      company_tagline: String(draft?.tagline ?? '').trim() || null,
      company_mission: String(draft?.mission ?? '').trim() || null,
      company_culture: String(draft?.culture ?? '').trim() || null,
      company_benefits: parseMultilineList(draft?.benefitsText),
      company_hiring_process: parseMultilineList(draft?.hiringProcessText),
      company_logo_url: String(draft?.logoUrl ?? '').trim() || null,
      company_cover_image_url: String(draft?.coverImageUrl ?? '').trim() || null,
      company_brand_color: String(draft?.brandColor ?? '').trim() || null,
    })
    .single()

  if (
    result.error &&
    (result.error.code === 'PGRST202' ||
      /partner_update_company_profile/.test(result.error.message ?? ''))
  ) {
    return supabase
      .rpc('partner_update_company_profile', {
        target_company_id: companyId,
        company_name: name,
        company_category: String(draft?.category ?? '').trim() || null,
        company_website_url: String(draft?.websiteUrl ?? '').trim() || null,
        company_headquarters: String(draft?.headquarters ?? '').trim() || null,
        company_description: String(draft?.description ?? '').trim() || null,
        company_tagline: String(draft?.tagline ?? '').trim() || null,
        company_mission: String(draft?.mission ?? '').trim() || null,
        company_culture: String(draft?.culture ?? '').trim() || null,
        company_benefits: parseMultilineList(draft?.benefitsText),
        company_hiring_process: parseMultilineList(draft?.hiringProcessText),
      })
      .single()
  }

  return result
}

export async function uploadCompanyBrandAsset({ companyId, file, kind }) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  if (!isRealRecordId(companyId)) {
    return { data: null, error: new Error('회사 워크스페이스가 연결되지 않았습니다.') }
  }

  if (!file) {
    return { data: null, error: new Error('업로드할 이미지 파일을 선택해 주세요.') }
  }

  const assetKind = kind === 'cover' ? 'cover' : 'logo'
  const path = `${companyId}/${assetKind}-${Date.now().toString(36)}-${safeStorageFilename(file.name)}`
  const { data, error } = await supabase.storage
    .from('company-assets')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (error) {
    return { data: null, error }
  }

  const { data: publicUrlData } = supabase.storage
    .from('company-assets')
    .getPublicUrl(data.path)

  return {
    data: {
      path: data.path,
      publicUrl: publicUrlData?.publicUrl ?? '',
    },
    error: null,
  }
}

export async function savePartnerJob({
  companyId,
  createdBy,
  jobId,
  draft,
}) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  if (!isRealRecordId(companyId)) {
    return { data: null, error: new Error('회사 워크스페이스가 연결되지 않았습니다.') }
  }

  const title = String(draft?.title ?? '').trim()

  if (!title) {
    return { data: null, error: new Error('공고 제목을 입력해 주세요.') }
  }

  if (!isRealRecordId(jobId) && !createdBy) {
    return { data: null, error: new Error('공고 생성 권한을 확인할 수 없습니다.') }
  }

  const status = ['draft', 'pending_review', 'published', 'closed', 'rejected'].includes(draft?.status)
    ? draft.status
    : 'draft'
  const payload = {
    company_id: companyId,
    slug: String(draft?.slug ?? '').trim() || slugify(title),
    title,
    role: String(draft?.role ?? '').trim() || null,
    location: String(draft?.location ?? '').trim() || null,
    arrangement: String(draft?.arrangement ?? '').trim() || null,
    experience_label: String(draft?.experience ?? '').trim() || null,
    education_label: String(draft?.education ?? '').trim() || null,
    summary: String(draft?.summary ?? '').trim() || null,
    description: String(draft?.description ?? '').trim() || null,
    responsibilities: parseMultilineList(draft?.responsibilitiesText),
    requirements: parseMultilineList(draft?.requirementsText),
    perks: parseMultilineList(draft?.perksText),
    status,
    deadline_at: toIsoDeadline(draft?.deadlineAt),
    published_at: status === 'published'
      ? draft?.publishedAt ?? new Date().toISOString()
      : null,
  }

  const query = isRealRecordId(jobId)
    ? supabase
        .from('jobs')
        .update(payload)
        .eq('id', jobId)
        .eq('company_id', companyId)
    : supabase
        .from('jobs')
        .insert({
          ...payload,
          created_by: createdBy,
        })

  const result = await query
    .select('id, slug, title, role, location, arrangement, experience_label, education_label, summary, description, responsibilities, requirements, perks, status, deadline_at, published_at, created_at')
    .maybeSingle()

  if (result.error) {
    if (result.error.code === '23505') {
      return {
        data: null,
        error: new Error('같은 slug의 공고가 이미 있습니다. 제목을 조금 다르게 입력해 주세요.'),
      }
    }

    return result
  }

  if (!result.data?.id) {
    return { data: null, error: new Error('공고 저장 결과를 확인할 수 없습니다.') }
  }

  const { error: deleteTagError } = await supabase
    .from('job_tags')
    .delete()
    .eq('job_id', result.data.id)

  if (deleteTagError) {
    return { data: result.data, error: deleteTagError }
  }

  const tags = parseTagList(draft?.tagsText)

  if (tags.length > 0) {
    const { error: insertTagError } = await supabase
      .from('job_tags')
      .insert(tags.map((tag) => ({ job_id: result.data.id, tag })))

    if (insertTagError) {
      return { data: result.data, error: insertTagError }
    }
  }

  return { data: result.data, error: null }
}

export async function updatePartnerApplicationStatus({
  applicationId,
  nextStatus,
  note,
}) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  return supabase
    .rpc('partner_update_application_status', {
      target_application_id: applicationId,
      next_status: nextStatus,
      partner_note: note ?? null,
    })
    .single()
}

export async function updatePartnerCoffeeChatStatus({
  coffeeChatRequestId,
  nextStatus,
  note,
}) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  return supabase
    .rpc('partner_update_coffee_chat_status', {
      target_coffee_chat_request_id: coffeeChatRequestId,
      next_status: nextStatus,
      partner_note: note ?? null,
    })
    .single()
}

export async function fetchPartnerApplicationResumePreview({ applicationId }) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  if (!isRealRecordId(applicationId)) {
    return { data: null, error: new Error('지원서를 선택해 주세요.') }
  }

  const { data, error } = await supabase
    .rpc('partner_get_application_resume', {
      target_application_id: applicationId,
    })
    .single()

  return {
    data: data ? normalizePartnerResumePreview(data) : null,
    error,
  }
}

export async function fetchPartnerDashboard(userId, activeCompanyId = null) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  const { data: memberships, error: membershipError } = await supabase
    .from('company_members')
    .select(`company_id, member_role, is_owner, companies(${companyExtendedSelect})`)
    .eq('user_id', userId)

  if (membershipError) {
    return { data: null, error: membershipError }
  }

  if (!memberships?.length) {
    return {
      data: {
        memberships: [],
        company: null,
        metrics: [],
        companyInfoRequests: [],
        teamMembers: [],
        applications: [],
        jobs: [],
      },
      error: null,
    }
  }

  const activeMembership =
    memberships.find((membership) => membership.company_id === activeCompanyId) ?? memberships[0]
  const company = activeMembership.companies

  if (!company?.id) {
    return { data: null, error: new Error('회사 멤버십은 있지만 회사 정보를 불러오지 못했습니다.') }
  }

  const { data: jobRows, error: jobsError } = await supabase
    .from('jobs')
    .select('id, slug, title, role, location, arrangement, experience_label, education_label, summary, description, responsibilities, requirements, perks, status, deadline_at, published_at, created_at')
    .eq('company_id', company.id)
    .order('published_at', { ascending: false, nullsFirst: false })

  if (jobsError) {
    return { data: null, error: jobsError }
  }

  const jobIds = (jobRows ?? []).map((job) => job.id)
  const tagMap = await fetchJobTagsByJobIds(jobIds)

  const [
    { data: applicationRows, error: applicationError },
    { data: teamMemberRows, error: teamMemberError },
    { data: infoRequestRows, error: infoRequestError },
  ] = await Promise.all([
    jobIds.length
      ? supabase
          .from('applications')
          .select('id, job_id, user_id, status, cover_note, applied_at')
          .in('job_id', jobIds)
          .order('applied_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('company_members')
      .select('user_id, member_role, is_owner, created_at')
      .eq('company_id', company.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('company_info_requests')
      .select('id, company_id, requester_id, question, context, status, answer, answered_at, created_at')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  if (
    applicationError ||
    teamMemberError ||
    (infoRequestError && !isMissingRelationError(infoRequestError))
  ) {
    return {
      data: null,
      error: applicationError ?? teamMemberError ?? infoRequestError ?? new Error('파트너 데이터를 불러오지 못했습니다.'),
    }
  }

  const applicantIds = [...new Set((applicationRows ?? []).map((application) => application.user_id).filter(Boolean))]
  const infoRequesterIds = [...new Set((infoRequestRows ?? []).map((item) => item.requester_id).filter(Boolean))]
  const memberUserIds = [...new Set([...applicantIds, ...infoRequesterIds])]
  const profileMap = await fetchProfileDisplayMap(memberUserIds)
  const teamProfileMap = await fetchProfileDisplayMap([
    ...new Set((teamMemberRows ?? []).map((member) => member.user_id).filter(Boolean)),
  ])

  const { data: profileRows } = memberUserIds.length
    ? await supabase
      .from('profiles')
      .select('id, major, graduation_year, headline, created_at')
      .in('id', memberUserIds)
    : { data: [] }

  const profileDetailMap = new Map((profileRows ?? []).map((profile) => [profile.id, profile]))
  const jobMap = new Map((jobRows ?? []).map((job) => [job.id, job]))

  const applicationEntries = (applicationRows ?? []).map((application) => {
    const job = jobMap.get(application.job_id)
    const applicantDetail = profileDetailMap.get(application.user_id)

    return {
      id: application.id,
      jobId: application.job_id,
      applicantUserId: application.user_id,
      applicant: profileMap.get(application.user_id)?.fullName ?? '익명 사용자',
      applicantUniversity: profileMap.get(application.user_id)?.universityName ?? '',
      applicantMajor: applicantDetail?.major ?? '',
      applicantHeadline: applicantDetail?.headline ?? '',
      company: company.name,
      title: job?.title ?? '공고 미상',
      role: job?.role ?? '',
      location: job?.location ?? '',
      status: application.status,
      coverNote: application.cover_note ?? '',
      appliedAt: formatDateLabel(application.applied_at),
    }
  })

  const metricUniqueApplicants = new Set(
    (applicationRows ?? []).map((item) => item.user_id).filter(Boolean),
  ).size
  const metricProfileReady = applicationEntries.filter((entry) => entry.applicantHeadline).length

  const metrics = [
    { label: '지원자 수', value: `${metricUniqueApplicants}명` },
    { label: '프로필 입력', value: `${metricProfileReady}명` },
    { label: '지원 현황', value: `${applicationEntries.length}건` },
    { label: '학생 질문', value: `${(infoRequestRows ?? []).length}건` },
  ]

  return {
    data: {
      memberships: memberships.map((membership) => ({
        companyId: membership.company_id,
        memberRole: membership.member_role,
        isOwner: membership.is_owner,
        company: membership.companies,
      })),
      company,
      metrics,
      jobs: (jobRows ?? []).map((job) => normalizePartnerJobRow(job, tagMap)),
      companyInfoRequests: (isMissingRelationError(infoRequestError) ? [] : (infoRequestRows ?? [])).map((request) => ({
        id: request.id,
        companyId: request.company_id,
        requesterUserId: request.requester_id,
        requester: profileMap.get(request.requester_id)?.fullName ?? '익명 사용자',
        requesterUniversity: profileMap.get(request.requester_id)?.universityName ?? '',
        question: request.question ?? '',
        context: request.context ?? '',
        status: request.status ?? 'open',
        answer: request.answer ?? '',
        answeredAt: formatDateTimeLabel(request.answered_at),
        createdAt: formatDateTimeLabel(request.created_at),
      })),
      teamMembers: (teamMemberRows ?? []).map((member) => ({
        userId: member.user_id,
        name: teamProfileMap.get(member.user_id)?.fullName ?? '팀원',
        university: teamProfileMap.get(member.user_id)?.universityName ?? '',
        memberRole: member.member_role,
        isOwner: Boolean(member.is_owner),
        joinedAt: formatDateLabel(member.created_at),
      })),
      applications: applicationEntries,
    },
    error: null,
  }
}

export async function fetchAdminOpsDashboard(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  const profileResult = await fetchProfile(userId)

  if (profileResult.error) {
    return { data: null, error: profileResult.error }
  }

  if (profileResult.data?.user_role !== 'platform_admin') {
    return {
      data: {
        isAdmin: false,
        metrics: [],
        verificationQueue: [],
        auditEntries: [],
      },
      error: null,
    }
  }

  const [
    { data: profileRows, error: queueError },
    { data: requestRows, error: requestError },
    { data: reportRows, error: reportError },
    { data: jobReviewRows, error: jobReviewError },
    { data: auditRows, error: auditError },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, school_email, university_id, major, graduation_year, verification_status, created_at, updated_at')
      .in('verification_status', ['submitted', 'rejected', 'verified', 'pending'])
      .order('updated_at', { ascending: false }),
    supabase
      .from('verification_requests')
      .select('id, user_id, status, note, created_at, reviewed_at')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('community_reports')
      .select('id, reporter_id, post_id, comment_id, reason, status, created_at, reviewed_at')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('jobs')
      .select('id, company_id, slug, title, role, location, status, summary, created_at, updated_at, published_at')
      .in('status', ['pending_review', 'published', 'closed', 'rejected'])
      .order('updated_at', { ascending: false })
      .limit(100),
    supabase
      .from('audit_logs')
      .select('id, actor_user_id, entity_type, entity_id, action, payload, created_at')
      .order('created_at', { ascending: false })
      .limit(12),
  ])

  if (
    queueError ||
    auditError ||
    (requestError && !isMissingRelationError(requestError)) ||
    (reportError && !isMissingRelationError(reportError)) ||
    jobReviewError
  ) {
    return { data: null, error: queueError ?? auditError ?? requestError ?? reportError ?? jobReviewError }
  }

  const universityIds = [...new Set((profileRows ?? []).map((profile) => profile.university_id).filter(Boolean))]
  const { data: universityRows } = universityIds.length
    ? await supabase.from('universities').select('id, name').in('id', universityIds)
    : { data: [] }
  const universityMap = new Map((universityRows ?? []).map((university) => [university.id, university.name]))

  const normalizedReportRows = isMissingRelationError(reportError) ? [] : (reportRows ?? [])
  const actorIds = [...new Set((auditRows ?? []).map((item) => item.actor_user_id).filter(Boolean))]
  const actorMap = await fetchProfileDisplayMap(actorIds)
  const reportReporterMap = await fetchProfileDisplayMap([
    ...new Set(normalizedReportRows.map((item) => item.reporter_id).filter(Boolean)),
  ])
  const reportPostIds = [...new Set(normalizedReportRows.map((item) => item.post_id).filter(Boolean))]
  const reportCommentIds = [...new Set(normalizedReportRows.map((item) => item.comment_id).filter(Boolean))]
  const { data: reportPostRows } = reportPostIds.length
    ? await supabase.from('community_posts').select('id, slug, title').in('id', reportPostIds)
    : { data: [] }
  const { data: reportCommentRows } = reportCommentIds.length
    ? await supabase.from('community_comments').select('id, body').in('id', reportCommentIds)
    : { data: [] }
  const reportPostMap = new Map((reportPostRows ?? []).map((item) => [item.id, item]))
  const reportCommentMap = new Map((reportCommentRows ?? []).map((item) => [item.id, item]))
  const jobReviewCompanyMap = await fetchCompaniesByIds([
    ...new Set((jobReviewRows ?? []).map((job) => job.company_id).filter(Boolean)),
  ])
  const latestRequestMap = new Map()

  for (const request of requestRows ?? []) {
    if (!latestRequestMap.has(request.user_id)) {
      latestRequestMap.set(request.user_id, request)
    }
  }

  const verificationQueue = (profileRows ?? []).map((profile) => {
    const latestRequest = latestRequestMap.get(profile.id)

    return {
      id: profile.id,
      requestId: latestRequest?.id ?? '',
      requestStatus: latestRequest?.status ?? '',
      requestNote: latestRequest?.note ?? '',
      reviewedAt: formatDateTimeLabel(latestRequest?.reviewed_at),
      name: profile.full_name ?? profile.school_email ?? '익명 사용자',
      schoolEmail: profile.school_email ?? '',
      universityName: profile.university_id ? universityMap.get(profile.university_id) ?? '미지정' : '미지정',
      major: profile.major ?? '미입력',
      graduationYear: profile.graduation_year ? String(profile.graduation_year) : '미입력',
      verificationStatus: profile.verification_status ?? 'pending',
      submittedAt: formatDateTimeLabel(latestRequest?.created_at ?? profile.updated_at ?? profile.created_at),
    }
  })

  const metrics = [
    { label: '검토 대기', value: `${verificationQueue.filter((item) => item.verificationStatus === 'submitted').length}건` },
    { label: '인증 완료', value: `${verificationQueue.filter((item) => item.verificationStatus === 'verified').length}명` },
    { label: '반려 상태', value: `${verificationQueue.filter((item) => item.verificationStatus === 'rejected').length}건` },
    {
      label: '커뮤니티 신고',
      value: `${normalizedReportRows.filter((item) => item.status === 'open').length}건`,
    },
    {
      label: '공고 검수',
      value: `${(jobReviewRows ?? []).filter((job) => job.status === 'pending_review').length}건`,
    },
    { label: '최근 감사 로그', value: `${(auditRows ?? []).length}건` },
  ]

  return {
    data: {
      isAdmin: true,
      metrics,
      verificationQueue,
      jobReviewQueue: (jobReviewRows ?? []).map((job) => ({
        id: job.id,
        companyId: job.company_id,
        companyName: jobReviewCompanyMap.get(job.company_id)?.name ?? '파트너 기업',
        slug: job.slug,
        title: job.title,
        role: job.role ?? '직군 미정',
        location: job.location ?? '위치 협의',
        status: job.status,
        summary: job.summary ?? '',
        createdAt: formatDateTimeLabel(job.created_at),
        updatedAt: formatDateTimeLabel(job.updated_at ?? job.published_at ?? job.created_at),
        linkPath: `/jobs/${job.slug}`,
      })),
      communityReports: normalizedReportRows.map((report) => {
        const post = report.post_id ? reportPostMap.get(report.post_id) : null
        const comment = report.comment_id ? reportCommentMap.get(report.comment_id) : null

        return {
          id: report.id,
          reporterName: reportReporterMap.get(report.reporter_id)?.fullName ?? '익명 사용자',
          targetType: report.comment_id ? 'comment' : 'post',
          targetLabel: comment?.body
            ? buildExcerpt(comment.body)
            : post?.title ?? '대상 콘텐츠',
          reason: report.reason,
          status: report.status,
          createdAt: formatDateTimeLabel(report.created_at),
          reviewedAt: formatDateTimeLabel(report.reviewed_at),
          linkPath: post?.slug ? `/community/post/${post.slug}` : '/community',
        }
      }),
      auditEntries: (auditRows ?? []).map((item) => ({
        id: item.id,
        actorName: actorMap.get(item.actor_user_id)?.fullName ?? '시스템',
        entityType: item.entity_type,
        action: item.action,
        createdAt: formatDateTimeLabel(item.created_at),
        summary:
          item.action === 'admin_update_verification_status'
            ? `${item.payload?.from_status ?? '-'} -> ${item.payload?.to_status ?? '-'}`
            : JSON.stringify(item.payload ?? {}),
      })),
    },
    error: null,
  }
}

export async function adminUpdateCommunityReportStatus({ reportId, nextStatus }) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  const allowedStatuses = ['open', 'reviewing', 'resolved', 'dismissed']
  const normalizedStatus = allowedStatuses.includes(nextStatus) ? nextStatus : 'reviewing'

  const result = await supabase
    .from('community_reports')
    .update({
      status: normalizedStatus,
      reviewed_at: ['resolved', 'dismissed'].includes(normalizedStatus)
        ? new Date().toISOString()
        : null,
    })
    .eq('id', reportId)
    .select('id, status, reviewed_at')
    .maybeSingle()

  if (isMissingRelationError(result.error)) {
    return {
      data: null,
      error: new Error('커뮤니티 신고 테이블이 아직 없습니다. 0017_community_reports.sql 을 먼저 실행해 주세요.'),
    }
  }

  return result
}

export async function adminUpdateJobReviewStatus({ jobId, nextStatus, note }) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  const result = await supabase
    .rpc('admin_update_job_status', {
      target_job_id: jobId,
      next_status: nextStatus,
      admin_note: note ?? null,
    })
    .single()

  if (
    result.error &&
    (result.error.code === 'PGRST202' ||
      /admin_update_job_status/.test(result.error.message ?? ''))
  ) {
    return {
      data: null,
      error: new Error('공고 검수 RPC가 아직 없습니다. 0019_job_review_actions.sql 을 먼저 실행해 주세요.'),
    }
  }

  return result
}

export async function adminUpdateVerificationStatus({
  profileId,
  nextStatus,
  note,
}) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error(supabaseSetupMessage) }
  }

  const result = await supabase
    .rpc('admin_update_verification_status', {
      target_profile_id: profileId,
      next_status: nextStatus,
      admin_note: note ?? null,
    })
    .single()

  if (
    result.error &&
    (result.error.code === 'PGRST202' ||
      /admin_update_verification_status/.test(result.error.message ?? ''))
  ) {
    return {
      data: null,
      error: new Error('운영 승인 RPC가 아직 없습니다. 0012_admin_verification_actions.sql 을 먼저 실행해 주세요.'),
    }
  }

  return result
}

export async function listNotifications(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: [], error: new Error(supabaseSetupMessage) }
  }

  return supabase
    .from('notifications')
    .select('id, kind, title, body, link_path, is_read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}

export async function fetchUnreadNotificationCount(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: 0, error: null }
  }

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  return { data: count ?? 0, error }
}

export async function markNotificationRead({ notificationId, userId }) {
  if (!isSupabaseConfigured || !supabase || !notificationId || !userId) {
    return { data: null, error: new Error('알림을 읽음 처리할 수 없습니다.') }
  }

  return supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select('id, is_read')
    .maybeSingle()
}

export async function markAllNotificationsRead(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('로그인 정보가 필요합니다.') }
  }

  return supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .select('id')
}
