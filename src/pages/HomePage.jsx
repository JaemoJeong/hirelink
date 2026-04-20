import { Link } from 'react-router-dom'
import {
  businessHighlights,
  features,
  jobs,
  journey,
  partnerPoints,
  schools,
  stats,
} from '../data/mockData.js'

export function HomePage() {
  return (
    <>
      <section className="hero-section" id="home">
        <div className="hero-copy reveal">
          <p className="eyebrow">Campus Career Network</p>
          <h1>
            명문대생과 기업을
            <br />
            가장 빠르게 연결합니다.
          </h1>
          <p className="hero-description">
            학교 인증을 통과한 인재만 참여하는 큐레이션 채용 플랫폼.
            커피챗으로 먼저 만나고, 확신이 생기면 바로 지원하세요.
          </p>

          <div className="hero-actions">
            <Link className="primary-button" to="/jobs">
              채용공고 보기
            </Link>
            <Link className="secondary-button" to="/companies">
              기업 둘러보기
            </Link>
          </div>

          <div className="hero-stats" aria-label="핵심 지표">
            {stats.map((stat) => (
              <article className="stat-chip" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="인증 가능 대학">
        <span className="strip-label">Verified</span>
        <div className="university-cloud">
          {schools.map((school) => (
            <span className="university-pill" key={school}>
              {school}
            </span>
          ))}
        </div>
      </section>

      <section className="feature-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Why HireLink</p>
            <h2>기존 채용 플랫폼과 다른 네 가지.</h2>
          </div>
          <p>
            신뢰할 수 있는 인재풀, 검증된 공고, 대화 중심의 채용 흐름.
            HireLink는 채용의 첫 단계를 다시 설계합니다.
          </p>
        </div>

        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.index}>
              <span className="feature-index">{feature.index}</span>
              <h3>{feature.title}</h3>
              <p>{feature.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="showcase-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">This Week</p>
            <h2>지금 주목받는 포지션.</h2>
          </div>
          <p>
            이번 주 가장 많은 커피챗 요청을 받은 포지션을 모았습니다.
          </p>
        </div>

        <div className="showcase-grid">
          {jobs.slice(0, 3).map((job) => (
            <article className="showcase-card" key={job.id}>
              <div className="job-meta">
                <span className="job-badge">{job.badge}</span>
                <span className="job-company">{job.company}</span>
              </div>
              <h3>{job.title}</h3>
              <p className="job-summary">{job.summary}</p>
              <div className="job-detail-row">
                <span>{job.role}</span>
                <span>{job.location}</span>
                <span>{job.arrangement}</span>
              </div>
              <Link className="job-preview" to={`/jobs/${job.slug}`}>
                공고 상세 보기
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="expansion-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">How to Join</p>
            <h2>HireLink와 함께하는 방법.</h2>
          </div>
          <p>
            학생이라면 검증된 채용 정보를, 기업이라면 인증된 인재풀을 만날 수 있습니다.
          </p>
        </div>

        <div className="expansion-grid">
          <article className="expansion-card warm-card">
            <p className="eyebrow">Business</p>
            <h3>{businessHighlights[0].title}</h3>
            <p>{businessHighlights[0].copy}</p>
            <Link className="text-link" to="/business">
              기업 서비스 알아보기
            </Link>
          </article>

          <article className="expansion-card">
            <p className="eyebrow">Companies</p>
            <h3>파트너 기업 둘러보기</h3>
            <p>미션, 문화, 복지, 채용 프로세스까지 한눈에 비교하세요.</p>
            <Link className="text-link" to="/companies">
              기업 탐색하기
            </Link>
          </article>

          <article className="expansion-card">
            <p className="eyebrow">Jobs</p>
            <h3>큐레이션 채용공고</h3>
            <p>운영팀이 검수한 포지션만 노출됩니다. 필터와 검색으로 빠르게 찾으세요.</p>
            <Link className="text-link" to="/jobs">
              공고 보러가기
            </Link>
          </article>
        </div>
      </section>

      <section>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Journey</p>
            <h2>가입부터 채용까지, 네 단계.</h2>
          </div>
          <p>학교 인증을 마치면 커피챗과 지원 흐름이 하나로 이어집니다.</p>
        </div>

        <div className="timeline">
          {journey.map((item) => (
            <div className="timeline-item" key={item.step}>
              <span className="timeline-number">{item.step}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <article className="partner-card">
          <span className="partner-pill">For Partners</span>
          <h2>
            채용이 더 쉬워지는 방법.
          </h2>
          <p>
            HireLink 파트너로 등록하면 인증된 명문대생에게 직접 닿을 수 있습니다.
            커피챗, 지원 관리, 리퍼럴 추적까지 하나의 대시보드에서.
          </p>

          <ul className="partner-list">
            {partnerPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>

          <div className="partner-actions" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link className="primary-button light-button" to="/business">
              기업 서비스
            </Link>
            <Link className="secondary-button soft-light" to="/companies">
              파트너 기업 보기
            </Link>
          </div>
        </article>
      </section>
    </>
  )
}
