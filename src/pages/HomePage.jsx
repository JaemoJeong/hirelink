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
      <section className="hero-section section-card" id="home">
        <div className="hero-copy reveal">
          <p className="eyebrow">커피챗 기반 커리어 매칭</p>
          <h1>
            명문대생과 기업을
            <br />
            가장 빠르게 연결합니다
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

        <div className="hero-panel reveal-delay">
          <p className="panel-caption">이번 주 하이라이트</p>

          <div className="hero-panel-grid">
            <article className="metric-card primary">
              <span>커피챗 매칭</span>
              <strong>탐색 → 커피챗 → 지원까지 평균 3일</strong>
              <p>서류 없이 대화부터 시작하니까, 서로 핏을 빠르게 확인할 수 있습니다.</p>
            </article>

            <article className="metric-card">
              <span>신규 공고</span>
              <strong>26건</strong>
            </article>

            <article className="metric-card">
              <span>활성 파트너</span>
              <strong>14개사</strong>
            </article>
          </div>

          <div className="university-cloud" aria-label="인증 대학">
            {schools.map((school) => (
              <span className="university-pill" key={school}>
                {school}
              </span>
            ))}
          </div>

          <div className="hero-feed">
            <article className="feed-item">
              <span className="feed-marker" aria-hidden="true" />
              <div>
                <strong>학교 인증</strong>
                <span>학교 이메일 한 번이면 바로 인재풀 합류</span>
              </div>
            </article>

            <article className="feed-item">
              <span className="feed-marker" aria-hidden="true" />
              <div>
                <strong>커피챗</strong>
                <span>지원 전에 대표, 팀리드와 미리 대화</span>
              </div>
            </article>

            <article className="feed-item">
              <span className="feed-marker" aria-hidden="true" />
              <div>
                <strong>큐레이션 공고</strong>
                <span>운영팀이 검수한 포지션만 노출</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="핵심 키워드">
        <span className="strip-label">Focus</span>
        <span className="strip-chip">학교 인증 기반</span>
        <span className="strip-chip">검수 공고 큐레이션</span>
        <span className="strip-chip">커피챗 매칭</span>
        <span className="strip-chip">원클릭 지원</span>
        <span className="strip-chip">리퍼럴 추적</span>
      </section>

      <section className="feature-section section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">왜 HireLink인가</p>
            <h2>기존 채용 플랫폼과 다른 4가지</h2>
          </div>
          <p>
            신뢰할 수 있는 인재풀, 검증된 공고, 대화 중심의 채용 흐름으로
            채용의 질을 높입니다.
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

      <section className="showcase-section section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">추천 공고</p>
            <h2>지금 주목할 포지션</h2>
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
              <div className="job-detail-row inverse">
                <span>{job.role}</span>
                <span>{job.location}</span>
                <span>{job.arrangement}</span>
              </div>
              <Link className="job-preview" to={`/jobs/${job.slug}`}>
                상세 보기
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section-card expansion-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">더 알아보기</p>
            <h2>HireLink과 함께하는 방법</h2>
          </div>
          <p>
            학생이라면 채용 탐색을, 기업이라면 인재 채용을 시작하세요.
          </p>
        </div>

        <div className="expansion-grid">
          <article className="expansion-card warm-card">
            <p className="eyebrow">기업 서비스</p>
            <h3>{businessHighlights[0].title}</h3>
            <p>{businessHighlights[0].copy}</p>
            <Link className="primary-button" to="/business">
              기업 서비스 알아보기
            </Link>
          </article>

          <article className="expansion-card">
            <p className="eyebrow">기업 정보</p>
            <h3>파트너 기업 둘러보기</h3>
            <p>미션, 문화, 복지, 채용 프로세스까지 한눈에 비교하세요.</p>
            <Link className="secondary-button" to="/companies">
              기업 탐색하기
            </Link>
          </article>

          <article className="expansion-card dark-card subtle-dark">
            <p className="eyebrow bright">파트너</p>
            <h3>채용 관리 대시보드</h3>
            <p>공고 등록, 지원자 관리, 커피챗 운영까지 하나의 대시보드에서.</p>
            <Link className="primary-button light-button" to="/partner-dashboard">
              파트너 대시보드
            </Link>
          </article>
        </div>
      </section>

      <section className="journey-section">
        <article className="journey-card section-card">
          <p className="eyebrow">이용 흐름</p>
          <h2>가입부터 채용까지 4단계</h2>
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
        </article>

        <article className="partner-card">
          <span className="partner-pill">기업 파트너</span>
          <h2>채용이 더 쉬워지는 방법</h2>
          <p>
            HireLink 파트너로 등록하면 인증된 명문대생에게
            직접 다가갈 수 있습니다.
          </p>

          <ul className="partner-list">
            {partnerPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>

          <div className="partner-actions">
            <Link className="primary-button light-button" to="/business">
              기업 서비스 알아보기
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
