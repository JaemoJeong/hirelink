import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import { SiteLayout } from './components/SiteLayout.jsx'

function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1))
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])

  return null
}

const AuthPage = lazy(() => import('./pages/AuthPage.jsx').then((module) => ({ default: module.AuthPage })))
const BusinessPage = lazy(() => import('./pages/BusinessPage.jsx').then((module) => ({ default: module.BusinessPage })))
const CandidateDashboardPage = lazy(() =>
  import('./pages/CandidateDashboardPage.jsx').then((module) => ({ default: module.CandidateDashboardPage })),
)
const CompaniesPage = lazy(() => import('./pages/CompaniesPage.jsx').then((module) => ({ default: module.CompaniesPage })))
const CompanyDetailPage = lazy(() =>
  import('./pages/CompanyDetailPage.jsx').then((module) => ({ default: module.CompanyDetailPage })),
)
const HomePage = lazy(() => import('./pages/HomePage.jsx').then((module) => ({ default: module.HomePage })))
const JobDetailPage = lazy(() => import('./pages/JobDetailPage.jsx').then((module) => ({ default: module.JobDetailPage })))
const JobsPage = lazy(() => import('./pages/JobsPage.jsx').then((module) => ({ default: module.JobsPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx').then((module) => ({ default: module.NotFoundPage })))
const VerifyPage = lazy(() => import('./pages/VerifyPage.jsx').then((module) => ({ default: module.VerifyPage })))

function RouteFallback() {
  return (
    <section className="section-card not-found-panel">
      <p className="eyebrow">Loading</p>
      <h1>페이지를 준비하는 중입니다</h1>
      <p>필요한 화면 코드만 불러온 뒤 바로 이어서 보여드립니다.</p>
    </section>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<HomePage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/jobs/:slug" element={<JobDetailPage />} />
            <Route path="/business" element={<BusinessPage />} />
            <Route path="/companies" element={<CompaniesPage />} />
            <Route path="/companies/:slug" element={<CompanyDetailPage />} />
            <Route
              path="/me"
              element={
                <ProtectedRoute>
                  <CandidateDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/verify"
              element={
                <ProtectedRoute>
                  <VerifyPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
