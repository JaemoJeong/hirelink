import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  businessPartners,
  communityPosts,
  features,
  jobs,
  journey,
  schools,
} from '../data/mockData.js'

const QUICK_CATEGORIES = ['전체', '개발', '금융', '컨설팅', '기획', '마케팅']

export function HomePage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const spotlight = jobs[0]
  const thisWeek = jobs.slice(1, 7)
  const insights = communityPosts.slice(0, 3)

  function handleSearchSubmit(e) {
    e.preventDefault()
    const trimmed = query.trim()
    navigate(trimmed ? `/jobs?q=${encodeURIComponent(trimmed)}` : '/jobs')
  }

  return (
    <>
      {/* 1. Hero */}
      <section className="home-hero" id="home">
        <svg className="home-hero-stroke" viewBox="0 0 1600 720" preserveAspectRatio="none" aria-hidden="true">
          <path
            pathLength="1"
            d="M -80 340
               C 60 300, 180 240, 280 200
               C 340 180, 400 160, 440 168
               C 500 178, 540 220, 520 264
               C 500 296, 420 308, 340 290
               C 280 276, 260 230, 320 210
               C 380 198, 480 200, 620 220
               C 880 256, 1020 360, 1180 340
               C 1320 320, 1420 220, 1540 260
               C 1620 290, 1680 310, 1740 286"
          />
        </svg>
        <p className="eyebrow">— Campus Career Network</p>
        <h1 className="home-hero-title">
          명문대생과 기업을<br />
          가장 빠르게 연결합니다.
        </h1>
        <p className="home-hero-sub">
          학교 인증을 통과한 인재만 참여하는 큐레이션 채용 플랫폼.
          커피챗으로 먼저 만나고, 확신이 생기면 바로 지원하세요.
        </p>

        <form className="home-hero-search" onSubmit={handleSearchSubmit} role="search">
          <svg className="home-hero-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="회사명, 직무, 키워드로 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="home-hero-search-submit">
            검색<span aria-hidden="true"> →</span>
          </button>
        </form>

        <nav className="home-hero-categories" aria-label="직군 빠른 진입">
          {QUICK_CATEGORIES.map((cat) => (
            <Link
              key={cat}
              to={cat === '전체' ? '/jobs' : `/jobs?role=${encodeURIComponent(cat)}`}
              className="home-hero-category"
            >
              {cat}
            </Link>
          ))}
        </nav>
      </section>

      {/* 2. Spotlight */}
      {spotlight ? (
        <section className="home-spotlight">
          <div className="home-spotlight-eyebrow">
            <span className="home-spotlight-tag">SPOTLIGHT</span>
            <span className="home-spotlight-meta">이번 주 큐레이션</span>
          </div>

          <div className="home-spotlight-head">
            <div className="home-spotlight-company">
              <span className="home-spotlight-logo" aria-hidden="true">
                {spotlight.company.slice(0, 1)}
              </span>
              <div className="home-spotlight-company-info">
                <Link to={`/jobs/${spotlight.slug}`} className="home-spotlight-company-name">
                  {spotlight.company}
                </Link>
                <span className="home-spotlight-company-meta">
                  {spotlight.location} · {spotlight.arrangement}
                </span>
              </div>
            </div>
            <span className="home-spotlight-role">{spotlight.role}</span>
          </div>

          <h2 className="home-spotlight-title">{spotlight.title}</h2>
          <p className="home-spotlight-summary">{spotlight.summary}</p>

          <footer className="home-spotlight-foot">
            <div className="home-spotlight-meta-grid">
              <div>
                <span className="home-spotlight-label">마감</span>
                <span className="home-spotlight-value">{spotlight.deadline}</span>
              </div>
              <div>
                <span className="home-spotlight-label">경력</span>
                <span className="home-spotlight-value">{spotlight.experience}</span>
              </div>
              <div>
                <span className="home-spotlight-label">학력</span>
                <span className="home-spotlight-value">{spotlight.education}</span>
              </div>
            </div>
            <Link to={`/jobs/${spotlight.slug}`} className="home-spotlight-cta" aria-label="공고 상세 보기">
              <span>상세 보기</span>
              <span aria-hidden="true">→</span>
            </Link>
          </footer>
        </section>
      ) : null}

      {/* 3. Elite Opportunities */}
      <section className="home-elite">
        <div className="home-elite-head">
          <div>
            <h2 className="home-elite-title">Elite Opportunities</h2>
            <p className="home-elite-sub">검증된 파트너 기업의 최신 프리미엄 채용 공고를 확인하세요.</p>
          </div>
          <Link className="home-section-link" to="/jobs">
            모든 공고 보기 <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="home-elite-grid">
          {thisWeek.map((job, idx) => {
            const urgent = job.deadline?.startsWith('D-') && parseInt(job.deadline.slice(2), 10) <= 4
            return (
              <article className={`home-elite-card${urgent ? ' is-urgent' : ''}`} key={job.id}>
                <Link to={`/jobs/${job.slug}`} className="home-elite-card-link" aria-label={job.title}>
                  <div className="home-elite-card-top">
                    <span className="home-elite-card-icon" aria-hidden="true">{job.company.slice(0, 1)}</span>
                    {urgent ? (
                      <span className="home-elite-card-badge urgent">URGENT</span>
                    ) : (
                      <span className="home-elite-card-badge">{job.deadline}</span>
                    )}
                  </div>
                  <div className="home-elite-card-body">
                    <span className="home-elite-card-company">{job.company}</span>
                    <h3 className="home-elite-card-title">{job.title}</h3>
                    <div className="home-elite-card-chips">
                      <span>{job.experience}</span>
                      <span>{job.location}</span>
                      <span>{job.arrangement}</span>
                    </div>
                  </div>
                  <div className="home-elite-card-foot">
                    <span className="home-elite-card-date">등록일 2026.0{(idx % 4) + 1}.{String(((idx * 7) % 27) + 1).padStart(2, '0')}</span>
                    <span className="home-elite-card-bookmark" aria-hidden="true">
                      <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                        <path d="M2 1.5h10v13L7 11l-5 3.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </Link>
              </article>
            )
          })}
        </div>
      </section>

      {/* 4. 인증 학교 트러스트 */}
      <section className="home-trust" aria-label="인증 가능 대학">
        <p className="eyebrow">— Verified Campuses</p>
        <div className="home-trust-cloud">
          {schools.map((school) => (
            <span className="home-trust-school" key={school}>
              {school}
            </span>
          ))}
        </div>
      </section>

      {/* 5. 함께하는 기업 — Showcase */}
      <section className="home-partners">
        <div className="home-partners-head">
          <div>
            <p className="eyebrow">— Partner Companies</p>
            <h2 className="home-partners-title">함께하는<br />기업들.</h2>
          </div>
          <Link className="home-section-link" to="/companies">
            전체 기업 <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="home-partners-showcase">
          {businessPartners.map((p, idx) => (
            <article className="home-partner-card" key={p.company} style={{ '--card-delay': `${idx * 60}ms` }}>
              <div className="home-partner-card-frame">
                <span className="home-partner-card-index">{String(idx + 1).padStart(2, '0')}</span>
                <span className="home-partner-card-monogram" aria-hidden="true">{p.company.slice(0, 1)}</span>
                <span className="home-partner-card-wordmark">{p.company}</span>
                <span className="home-partner-card-category">{p.category}</span>
              </div>
              <div className="home-partner-card-body">
                <h3>{p.company}</h3>
                <p className="home-partner-card-hiring">{p.hiring}</p>
                <p className="home-partner-card-result">{p.result}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 6. Why HireLink */}
      <section className="home-why">
        <div className="home-section-heading">
          <div>
            <p className="eyebrow">— Why HireLink</p>
            <h2>기존 채용과 다른 네 가지.</h2>
          </div>
          <p>
            신뢰할 수 있는 인재풀, 검증된 공고, 대화 중심의 채용 흐름.
            HireLink는 채용의 첫 단계를 다시 설계합니다.
          </p>
        </div>

        <div className="home-why-grid">
          {features.map((feature) => (
            <article className="home-why-row" key={feature.index}>
              <span className="home-why-index">{feature.index}</span>
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 7. 4단계 여정 */}
      <section className="home-journey">
        <div className="home-section-heading">
          <div>
            <p className="eyebrow">— Journey</p>
            <h2>가입부터 채용까지, 네 단계.</h2>
          </div>
          <p>학교 인증을 마치면 커피챗과 지원 흐름이 하나로 이어집니다.</p>
        </div>

        <div className="home-journey-board">
          {journey.map((item) => (
            <article className="home-journey-item" key={item.step}>
              <span className="home-journey-step">{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 8. 인사이트 */}
      <section className="home-insights">
        <div className="home-section-heading">
          <div>
            <p className="eyebrow">— Insights</p>
            <h2>커리어 인사이트</h2>
          </div>
          <p>커피챗, 포트폴리오, 학교 인증까지 — 멤버들의 경험을 모았습니다.</p>
          <Link className="home-section-link" to="/community">
            커뮤니티 더보기 <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="home-insights-grid">
          {insights.map((post) => (
            <article className="home-insight-item" key={post.slug}>
              <span className="home-insight-category">{post.category}</span>
              <h3>
                <Link to={`/community/${post.slug}`}>{post.title}</Link>
              </h3>
              <p className="home-insight-excerpt">{post.excerpt}</p>
              <span className="home-insight-meta">
                {post.author} · {post.university} · {post.readTime}
              </span>
            </article>
          ))}
        </div>
      </section>

      {/* 9. Final CTA */}
      <section className="home-final-cta">
        <h2 className="home-final-cta-title">
          커리어의 격이 다른<br />
          시작을 함께하세요.
        </h2>
        <p className="home-final-cta-sub">
          지금 바로 프로필을 완성하고 전담 매니저의<br />
          1:1 프리미엄 커리어 컨설팅을 경험해 보세요.
        </p>
        <div className="home-final-cta-actions">
          <Link className="home-final-cta-btn primary" to="/auth?tab=signup">
            인재 등록하기
          </Link>
          <Link className="home-final-cta-btn ghost" to="/business">
            기업용 서비스 안내
          </Link>
        </div>
      </section>
    </>
  )
}
