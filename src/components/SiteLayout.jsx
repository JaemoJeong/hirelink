import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider.jsx'

function navLinkClassName({ isActive }) {
  return `nav-link${isActive ? ' active' : ''}`
}

export function SiteLayout() {
  const { user, signOut } = useAuth()

  async function handleSignOut() {
    await signOut()
  }

  return (
    <div className="page-shell">
      <header className="site-header">
        <NavLink className="brand-mark" to="/">
          <span className="brand-dot" aria-hidden="true" />
          <span className="brand-copy">
            <strong>HireLink</strong>
            <span>Campus Career Network</span>
          </span>
        </NavLink>

        <nav className="site-nav" aria-label="주요 메뉴">
          <NavLink className={navLinkClassName} to="/">
            홈
          </NavLink>
          <NavLink className={navLinkClassName} to="/jobs">
            채용공고
          </NavLink>
          <NavLink className={navLinkClassName} to="/companies">
            기업정보
          </NavLink>
          <NavLink className={navLinkClassName} to="/business">
            기업서비스
          </NavLink>
        </nav>

        <div className="header-actions">
          {user ? (
            <>
              <NavLink className="ghost-link" to="/me">
                마이페이지
              </NavLink>
              <button className="solid-link header-button" type="button" onClick={handleSignOut}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <NavLink className="ghost-link" to="/auth">
                로그인
              </NavLink>
              <NavLink className="solid-link" to="/auth?tab=signup">
                회원가입
              </NavLink>
            </>
          )}
        </div>
      </header>

      <main className="page-content">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="site-footer-grid">
          <div className="site-footer-brand">
            <Link to="/" className="site-footer-mark">
              <span className="brand-dot" aria-hidden="true" />
              <strong>HIRELINK</strong>
            </Link>
            <p className="site-footer-tagline">
              엘리트 인재와 선도 기업을 연결하는<br />
              가장 정교한 네트워크 플랫폼입니다.
            </p>
            <div className="site-footer-social" aria-label="소셜 채널">
              <a href="#" aria-label="Instagram" className="site-footer-social-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="site-footer-social-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M7 10v7M7 7v.01M11 17v-4a2 2 0 0 1 4 0v4M11 10v7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </a>
              <a href="#" aria-label="YouTube" className="site-footer-social-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.6" />
                  <path d="m10 9 5 3-5 3z" fill="currentColor" />
                </svg>
              </a>
            </div>
          </div>

          <div className="site-footer-col">
            <h4>PLATFORM</h4>
            <Link to="/jobs">채용 정보</Link>
            <Link to="/business">기업 서비스</Link>
            <Link to="/companies">인재 탐색</Link>
            <Link to="/community">커리어 컨설팅</Link>
          </div>

          <div className="site-footer-col">
            <h4>RESOURCES</h4>
            <Link to="/terms">이용약관</Link>
            <Link to="/privacy">개인정보처리방침</Link>
            <Link to="/support">고객센터</Link>
            <Link to="/notice">공지사항</Link>
          </div>

          <div className="site-footer-col">
            <h4>CONTACT</h4>
            <span>서울특별시 강남구 테헤란로 123</span>
            <span>T. 02-123-4567</span>
            <span>E. contact@hirelink.elite</span>
          </div>
        </div>

        <div className="site-footer-meta">
          <span>© 2026 HireLink Elite Network. All rights reserved.</span>
          <span className="site-footer-status">
            <span><em /> Status: Online</span>
            <span>Region: South Korea</span>
          </span>
        </div>
      </footer>
    </div>
  )
}
