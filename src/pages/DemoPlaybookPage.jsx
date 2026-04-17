import { Link } from 'react-router-dom'

const walkthrough = [
  {
    step: '01',
    title: '학생이 기업을 이해한다',
    copy: '홈이나 기업 목록에서 시작해 기업 상세로 들어가고, 학생용 기업 브리프와 추천 질문을 보여줍니다.',
    links: [
      { label: '기업 목록', to: '/companies' },
      { label: '홈', to: '/' },
    ],
  },
  {
    step: '02',
    title: '질문을 남기고 관심을 만든다',
    copy: '기업 상세에서 정보 요청을 보내면, 파트너 대시보드에 질문 큐가 쌓이는 흐름을 시연합니다.',
    links: [
      { label: '기업 상세로 이동', to: '/companies' },
      { label: '로그인/가입', to: '/auth' },
    ],
  },
  {
    step: '03',
    title: '이력서와 지원으로 연결한다',
    copy: '이력서 저장과 원본 첨부, 공고 지원, 마이페이지 상태 확인까지 한 번에 이어서 보여줍니다.',
    links: [
      { label: '이력서', to: '/resume-maker' },
      { label: '공고', to: '/jobs' },
      { label: '마이페이지', to: '/me' },
    ],
  },
  {
    step: '04',
    title: '파트너가 답하고 상태를 바꾼다',
    copy: '파트너 대시보드에서 학생 질문에 답변하고, 지원 상태와 커피챗 상태를 바꾸는 쪽까지 연결합니다.',
    links: [
      { label: '파트너 대시보드', to: '/partner-dashboard' },
      { label: '알림', to: '/notifications' },
    ],
  },
]

const recoveryChecklist = [
  '기업 질문 저장이 안 되면 `0026_company_info_requests.sql` 실행 여부부터 확인',
  '기업 Q&A가 공개 화면에 안 보이면 `0027`, 샘플 기업 정보가 비어 있으면 `0028` 실행 여부 확인',
  '파일 첨부/열기가 안 되면 `0023`, `0024`, `0025` migration 순서 재확인',
  '파트너 워크스페이스가 비어 있으면 `/partner-dashboard`에서 데모 파트너사 활성화',
  '알림이 안 보이면 로그인 계정과 역할이 맞는지 `/setup`에서 확인',
]

export function DemoPlaybookPage() {
  return (
    <>
      <section className="page-hero section-card compact-hero">
        <div>
          <p className="eyebrow">Demo Playbook</p>
          <h1>내일 바로 보여줄 수 있게 데모 워크플로우를 정리했습니다</h1>
          <p>
            이번 데모의 핵심은 학생이 기업 정보를 얻고, 질문하고, 지원까지 이어지는 흐름입니다.
            발표 중 길을 잃지 않도록 가장 보여주기 좋은 순서만 남겼습니다.
          </p>
        </div>
        <div className="compact-hero-card">
          <span className="compact-kicker">Recommended Order</span>
          <strong>기업 탐색 → 질문 → 지원 → 파트너 응답</strong>
          <p>복잡한 설정 설명보다 사용자 흐름을 먼저 보여주고, 운영 화면은 뒤에 붙이는 구성이 가장 안정적입니다.</p>
        </div>
      </section>

      <section className="metric-grid">
        <article className="section-card metric-panel">
          <span>학생 시작점</span>
          <strong>기업 정보</strong>
        </article>
        <article className="section-card metric-panel">
          <span>메인 훅</span>
          <strong>기업 질문</strong>
        </article>
        <article className="section-card metric-panel">
          <span>마무리</span>
          <strong>파트너 응답</strong>
        </article>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Walkthrough</p>
            <h2>추천 데모 순서</h2>
          </div>
          <p>각 단계는 바로 클릭 가능한 링크와 함께 준비했습니다.</p>
        </div>

        <div className="demo-flow-grid">
          {walkthrough.map((item) => (
            <article className="notification-card demo-step-card" key={item.step}>
              <div className="notification-meta">
                <span className="check-pill complete">{item.step}</span>
                <span>Demo Step</span>
              </div>
              <strong>{item.title}</strong>
              <p>{item.copy}</p>
              <div className="sidebar-actions">
                {item.links.map((link) => (
                  <Link className="secondary-button" key={`${item.step}-${link.to}`} to={link.to}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="partner-board">
        <article className="section-card link-panel">
          <p className="eyebrow">Quick Launch</p>
          <h2>데모 직전 바로 열어둘 탭</h2>
          <div className="sidebar-actions">
            <Link className="primary-button" to="/companies">
              기업 목록
            </Link>
            <Link className="secondary-button" to="/jobs">
              공고 목록
            </Link>
            <Link className="secondary-button" to="/partner-dashboard">
              파트너
            </Link>
            <Link className="secondary-button" to="/setup">
              설정 점검
            </Link>
          </div>
        </article>

        <article className="section-card table-card">
          <p className="eyebrow">Recovery</p>
          <h2>막히면 여기부터 확인</h2>
          <ul className="sidebar-list">
            {recoveryChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>
    </>
  )
}
