import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider.jsx'

function LoadingPanel() {
  return (
    <section className="section-card not-found-panel">
      <p className="eyebrow">Loading</p>
      <h1>로그인 상태를 확인하는 중입니다</h1>
      <p>세션을 확인한 뒤 접근 가능한 화면으로 안내합니다.</p>
    </section>
  )
}

export function ProtectedRoute({ children }) {
  const { isConfigured, loading, user } = useAuth()
  const location = useLocation()

  if (!isConfigured) {
    return children
  }

  if (loading) {
    return <LoadingPanel />
  }

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/auth" />
  }

  return children
}
