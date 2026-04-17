import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { acceptPartnerCompanyInvite } from '../lib/platformApi.js'
import { useAuth } from '../providers/AuthProvider.jsx'

export function PartnerInvitePage() {
  const { token } = useParams()
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [acceptedInvite, setAcceptedInvite] = useState(null)
  const [status, setStatus] = useState({ tone: 'neutral', message: '' })

  async function handleAcceptInvite() {
    setSubmitting(true)
    setStatus({ tone: 'neutral', message: '' })

    const { data, error } = await acceptPartnerCompanyInvite({ token })

    if (error) {
      setStatus({ tone: 'error', message: error.message })
      setSubmitting(false)
      return
    }

    setAcceptedInvite(data ?? null)
    setStatus({
      tone: 'success',
      message: `${data?.company_name ?? '회사'} 워크스페이스에 합류했습니다.`,
    })
    setSubmitting(false)
  }

  return (
    <>
      <section className="page-hero section-card compact-hero">
        <div>
          <p className="eyebrow">Partner Invite</p>
          <h1>회사 워크스페이스 초대를 수락합니다</h1>
          <p>
            초대받은 이메일 계정으로 로그인한 뒤 수락하면 해당 회사의 파트너 대시보드에
            접근할 수 있습니다.
          </p>
        </div>
        <div className="compact-hero-card">
          <span className="compact-kicker">Signed in</span>
          <strong>{user?.email ?? '로그인 확인 중'}</strong>
          <p>초대 토큰은 한 번 수락하면 회사 멤버십으로 전환됩니다.</p>
        </div>
      </section>

      <section className="section-card auth-card">
        {status.message ? (
          <div className={`status-banner status-${status.tone}`}>
            <strong>{status.tone === 'error' ? '오류' : status.tone === 'success' ? '완료' : '안내'}</strong>
            <p>{status.message}</p>
          </div>
        ) : null}

        <div className="section-heading">
          <div>
            <p className="eyebrow">Accept</p>
            <h2>팀 초대 수락</h2>
          </div>
          <p>초대 이메일과 현재 로그인 이메일이 일치해야 안전하게 합류할 수 있습니다.</p>
        </div>

        <div className="field">
          <span>초대 토큰</span>
          <input readOnly value={token ?? ''} />
        </div>

        {acceptedInvite ? (
          <div className="notification-card">
            <strong>{acceptedInvite.company_name}</strong>
            <p>{acceptedInvite.member_role} 역할로 워크스페이스에 합류했습니다.</p>
          </div>
        ) : null}

        <div className="sidebar-actions">
          <button
            className="primary-button"
            disabled={submitting || Boolean(acceptedInvite)}
            type="button"
            onClick={handleAcceptInvite}
          >
            {submitting ? '수락 중...' : acceptedInvite ? '수락 완료' : '초대 수락'}
          </button>
          <Link className="secondary-button" to="/partner-dashboard">
            파트너 대시보드로 이동
          </Link>
        </div>
      </section>
    </>
  )
}
