import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="section-card not-found-panel">
      <p className="eyebrow">404</p>
      <h1>페이지를 찾을 수 없습니다</h1>
      <p>주소를 다시 확인하거나 홈으로 돌아가 다른 화면을 확인해보세요.</p>
      <div className="sidebar-actions">
        <Link className="primary-button" to="/">
          홈으로 이동
        </Link>
        <Link className="secondary-button" to="/jobs">
          공고 보기
        </Link>
      </div>
    </section>
  )
}
