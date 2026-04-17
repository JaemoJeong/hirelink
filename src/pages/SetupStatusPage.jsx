import { Link } from 'react-router-dom'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { useAuth } from '../providers/AuthProvider.jsx'

const migrationItems = [
  ['0001', '초기 플랫폼 스키마', 'profiles, companies, jobs, applications, community, inbox, resumes, notifications'],
  ['0002', 'Auth 프로필 자동 생성', '회원가입 시 profiles 행을 자동으로 생성'],
  ['0003', '데모 공고 시드', '잡보드가 실데이터로 전환될 기본 회사/공고/태그 데이터'],
  ['0004', '커뮤니티 카운터', '좋아요와 댓글 수를 community_posts에 동기화'],
  ['0005', '인박스 부트스트랩', '스레드 생성자 참가자 등록과 메시지 updated_at 동기화'],
  ['0006', '공개 프로필 카드 RPC', '커뮤니티 작성자 표시용 안전한 프로필 조회'],
  ['0007', '파트너 워크스페이스 부트스트랩', '테스트 계정을 데모 파트너사에 연결'],
  ['0008', '지원 상태 변경 RPC', '파트너 상태 변경, 히스토리, 후보자 알림 생성'],
  ['0009', '커피챗 상태 변경 RPC', '파트너 커피챗 처리와 요청자 알림 생성'],
  ['0010', '후보자 액션', 'saved_jobs와 후보자 지원 철회 RPC'],
  ['0011', '프로필 권한 하드닝', '후보자 self-promotion과 self-verification 방지'],
  ['0012', '운영 인증 승인 RPC', '운영자 학교 인증 승인/반려, 알림, 감사 로그'],
  ['0013', '기업 프로필 편집 RPC', '파트너가 공개 기업 소개문을 안전하게 수정'],
  ['0014', '파트너 이력서 열람 RPC', '지원서에 첨부된 최신 이력서 요약을 회사 권한으로 열람'],
  ['0015', '파트너 이벤트 알림', '새 지원/커피챗이 들어오면 회사 멤버에게 알림 생성'],
  ['0016', '학교 인증 요청 이력', 'verification_requests 기반 제출/검토 이력 저장'],
  ['0017', '커뮤니티 신고 큐', '게시글/댓글 신고와 운영자 open 신고 카운트'],
  ['0018', '회사 팀원 초대', 'company_invites 토큰 생성과 파트너 초대 수락'],
  ['0019', '공고 검수 액션', '운영자가 공고를 승인/반려/마감 처리하고 회사 멤버에게 알림 생성'],
  ['0020', '기업 프로필 섹션 확장', 'tagline, mission, culture, benefits, hiring process 공개 섹션'],
  ['0021', '기업 브랜드 자산', 'logo URL, cover image URL, brand color 회사 프로필 필드'],
  ['0022', '기업 브랜드 Storage', 'company-assets 공개 버킷과 회사 멤버 업로드 정책'],
  ['0023', '이력서 파일 Storage', 'resume-files 비공개 버킷과 후보자 첨부 메타데이터'],
  ['0024', '이력서 파일 Signed URL', '지원자/파트너 권한 기반 private resume-files 임시 열람 정책'],
  ['0025', '이력서 파일 접근 감사', 'signed URL 생성 이벤트를 audit_logs에 기록하는 RPC'],
  ['0026', '기업 정보 요청', '학생 질문, 파트너 답변, 기업 정보 Q&A 알림 워크플로우'],
  ['0027', '기업 Q&A 공개 답변', '답변 완료된 기업 질문을 상세 페이지에 공개하고 알림 링크를 상세로 연결'],
  ['0028', '데모 기업 인텔리전스 시드', '파트너 기업 소개, 문화, 혜택, 채용 프로세스, 샘플 Q&A 보강'],
]

export function SetupStatusPage() {
  const { profile, user } = useAuth()
  const configuredLabel = isSupabaseConfigured ? '연결됨' : '미설정'
  const accountLabel = user?.email ?? '로그인 전'
  const roleLabel = profile?.user_role ?? 'role 없음'

  return (
    <>
      <section className="page-hero section-card compact-hero">
        <div>
          <p className="eyebrow">Setup Checklist</p>
          <h1>Supabase 연결과 migration 진행 상태를 한 곳에서 확인합니다</h1>
          <p>
            실제 플랫폼 기능은 SQL migration 순서에 민감합니다. 이 페이지는 로컬 코드 기준으로
            현재 필요한 스키마 단계를 빠르게 점검하기 위한 운영용 체크리스트입니다.
          </p>
        </div>
        <div className="compact-hero-card">
          <span className="compact-kicker">Runtime</span>
          <strong>Supabase {configuredLabel}</strong>
          <p>{accountLabel} · {roleLabel}</p>
        </div>
      </section>

      <section className="metric-grid">
        <article className="section-card metric-panel">
          <span>Env</span>
          <strong>{configuredLabel}</strong>
        </article>
        <article className="section-card metric-panel">
          <span>Migrations</span>
          <strong>{migrationItems.length}개</strong>
        </article>
        <article className="section-card metric-panel">
          <span>Admin Ops</span>
          <strong>{profile?.user_role === 'platform_admin' ? '활성' : '권한 필요'}</strong>
        </article>
      </section>

      <section className="section-card table-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">SQL Order</p>
            <h2>실행해야 하는 migration 순서</h2>
          </div>
          <p>Supabase SQL Editor에서 아래 순서대로 실행하면 현재 앱 기능과 DB가 맞습니다.</p>
        </div>

        <div className="notification-list">
          {migrationItems.map(([version, title, description]) => (
            <article className="notification-card" key={version}>
              <div className="notification-meta">
                <span className="check-pill complete">{version}</span>
                <span>supabase/migrations/{version}_...</span>
              </div>
              <strong>{title}</strong>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Next Checks</p>
            <h2>실행 후 확인할 화면</h2>
          </div>
          <p>migration이 맞게 들어갔는지는 실제 기능 화면에서 가장 빨리 확인할 수 있습니다.</p>
        </div>
        <div className="sidebar-actions">
          <Link className="primary-button" to="/demo-playbook">
            데모 동선 확인
          </Link>
          <Link className="secondary-button" to="/companies">
            기업 정보 확인
          </Link>
          <Link className="primary-button" to="/jobs">
            공고 실데이터 확인
          </Link>
          <Link className="secondary-button" to="/me">
            마이페이지 확인
          </Link>
          <Link className="secondary-button" to="/partner-dashboard">
            파트너 확인
          </Link>
          <Link className="secondary-button" to="/ops">
            운영 확인
          </Link>
        </div>
      </section>
    </>
  )
}
