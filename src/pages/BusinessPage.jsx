import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  businessHighlights,
  businessMetrics,
  businessPartners,
  businessPlans,
  businessScenarios,
  businessSteps,
} from '../data/mockData.js'

export function BusinessPage() {
  const [activeScenarioId, setActiveScenarioId] = useState(businessScenarios[0].id)
  const activeScenario = businessScenarios.find((s) => s.id === activeScenarioId) ?? businessScenarios[0]

  return (
    <>
      <section className="page-hero section-card compact-hero partner-hero">
        <div>
          <p className="eyebrow">기업 서비스</p>
          <h1>인증된 명문대생을 가장 빠르게 만나는 방법</h1>
          <p>
            학교 인증 기반 인재풀, 커피챗 매칭, 리퍼럴 추적까지.
            엘리트잡으로 채용 파이프라인의 첫 단계를 바꾸세요.
          </p>
        </div>
        <div className="compact-hero-card dark-copy">
          <span className="compact-kicker">핵심 가치</span>
          <strong>인증 인재풀 · 커피챗 · 추천 추적</strong>
          <p>채용 초반의 탐색 비용을 줄이고 핏 확인 속도를 높입니다.</p>
        </div>
      </section>

      <section className="metric-grid">
        {businessMetrics.map((m) => (
          <article className="section-card metric-panel" key={m.label}>
            <span>{m.label}</span>
            <strong>{m.value}</strong>
          </article>
        ))}
      </section>

      <section className="section-card business-shell">
        <div className="section-heading">
          <div>
            <p className="eyebrow">도입 시나리오</p>
            <h2>기업 유형별 활용 방법</h2>
          </div>
          <p>
            커피챗 중심 채용, 캠퍼스 브랜딩, 글로벌 포지션 등
            목적에 맞는 시나리오를 선택하세요.
          </p>
        </div>

        <div className="filter-row" aria-label="채용 시나리오">
          {businessScenarios.map((s) => (
            <button className={`filter-pill ${activeScenario.id === s.id ? 'active' : ''}`} key={s.id} type="button" onClick={() => setActiveScenarioId(s.id)}>
              {s.label}
            </button>
          ))}
        </div>

        <article className="business-scenario-card">
          <div className="business-scenario-copy">
            <p className="eyebrow">시나리오</p>
            <h3>{activeScenario.headline}</h3>
            <p>{activeScenario.summary}</p>
          </div>
          <div className="business-funnel-grid">
            {activeScenario.funnel.map((item) => (
              <article className="business-funnel-card" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="feature-section section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">왜 엘리트잡인가</p>
            <h2>기업이 선택하는 이유</h2>
          </div>
          <p>인증된 인재풀, 대화 중심 매칭, 채용 추적을 하나로.</p>
        </div>
        <div className="feature-grid">
          {businessHighlights.map((item, i) => (
            <article className="feature-card" key={item.title}>
              <span className="feature-index">0{i + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="business-shell business-columns">
        <article className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">요금제</p>
              <h2>도입 패키지</h2>
            </div>
            <p>팀 규모와 채용 목적에 맞는 플랜을 선택하세요.</p>
          </div>
          <div className="business-plan-grid">
            {businessPlans.map((plan) => (
              <article className={`business-plan-card ${plan.featured ? 'featured' : ''}`} key={plan.name}>
                <p className="eyebrow">{plan.audience}</p>
                <h3>{plan.name}</h3>
                <strong>{plan.price}</strong>
                <ul className="sidebar-list">
                  {plan.points.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </article>

        <article className="section-card jobs-sidebar-card">
          <p className="eyebrow">파트너 사례</p>
          <h2>함께하는 기업들</h2>
          <div className="business-partner-stack">
            {businessPartners.map((p) => (
              <article className="business-partner-card" key={p.company}>
                <div>
                  <strong>{p.company}</strong>
                  <span>{p.category}</span>
                </div>
                <p>{p.hiring}</p>
                <em>{p.result}</em>
              </article>
            ))}
          </div>
          <div className="sidebar-actions stacked">
            <Link className="primary-button full-width" to="/partner-dashboard">파트너 대시보드</Link>
            <Link className="secondary-button full-width" to="/companies">기업 정보 보기</Link>
          </div>
        </article>
      </section>

      <section className="journey-section">
        <article className="journey-card section-card">
          <p className="eyebrow">도입 흐름</p>
          <h2>온보딩부터 운영까지</h2>
          <div className="timeline">
            {businessSteps.map((item) => (
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

        <article className="section-card jobs-sidebar-card">
          <p className="eyebrow">다음 단계</p>
          <h2>파트너 등록 후 바로 시작하세요</h2>
          <ul className="sidebar-list">
            <li>기업 프로필과 채용 메시지 작성</li>
            <li>공고 등록 및 검수 요청</li>
            <li>지원자 관리와 커피챗 운영</li>
          </ul>
          <div className="sidebar-actions">
            <Link className="primary-button" to="/partner-dashboard">파트너 대시보드</Link>
            <Link className="secondary-button" to="/jobs">채용공고 보기</Link>
          </div>
        </article>
      </section>
    </>
  )
}
