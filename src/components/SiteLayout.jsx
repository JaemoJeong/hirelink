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
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <header className="site-header">
        <NavLink className="brand-mark" to="/">
          <span className="brand-dot" aria-hidden="true" />
          <span className="brand-copy">
            <strong>엘리트잡</strong>
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
              <NavLink className="ghost-link" to="/admin">
                관리자
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
        <span>© 2026 엘리트잡. All rights reserved.</span>
        <span>명문대생과 기업을 연결하는 커피챗 기반 커리어 플랫폼</span>
      </footer>
    </div>
  )
}
