export const schools = [
  '서울대',
  '연세대',
  '고려대',
  'KAIST',
  'POSTECH',
  'MIT',
  'Stanford',
  'Oxford',
]

export const stats = [
  { value: '37+', label: '인증 가능 학교' },
  { value: '120+', label: '큐레이션 공고' },
  { value: '80+', label: '주간 커피챗' },
  { value: '4.2K', label: '누적 멤버' },
]

export const features = [
  {
    index: '01',
    title: '학교 이메일 기반 인증',
    copy:
      '국내외 상위권 대학 도메인을 기준으로 빠르게 인증하고, 신뢰도 높은 인재 풀을 구성합니다.',
  },
  {
    index: '02',
    title: '검수된 채용 공고만 노출',
    copy:
      '운영진 검수를 거친 포지션만 큐레이션해 공고 피로도를 줄이고 탐색 효율을 높입니다.',
  },
  {
    index: '03',
    title: '원클릭 지원과 커피챗 연계',
    copy:
      '지원 이전에도 대표나 담당자와 미리 대화를 열 수 있도록 커피챗 동선을 중심에 둡니다.',
  },
  {
    index: '04',
    title: '기업용 리퍼럴 링크 운영',
    copy:
      '파트너 기업은 전용 링크와 공고별 링크를 배포하고 추천 유입 현황을 한 눈에 관리합니다.',
  },
]

export const jobs = [
  {
    id: 1,
    slug: 'tensor-labs-product-engineer',
    badge: 'Top Pick',
    company: 'Tensor Labs',
    title: 'Product Engineer, AI Workflow',
    role: '개발',
    location: '서울',
    arrangement: '하이브리드',
    experience: '경력 3년+',
    education: '학사 이상',
    deadline: 'D-10',
    summary:
      'LLM 기반 생산성 제품을 만드는 팀에서 프론트엔드와 백엔드를 함께 다룰 엔지니어를 찾습니다.',
    companyIntro:
      'Tensor Labs는 AI 워크플로우 자동화 제품을 만드는 빠른 실행 중심 팀입니다. 프로덕트, 모델, 인프라가 같은 속도로 움직이는 환경을 지향합니다.',
    responsibilities: [
      'React 기반 프로덕트 UI와 실험 환경 구현',
      'Node/BFF 레이어 설계와 내부 API 연동',
      'PM, 디자이너와 함께 사용자 흐름 단위로 제품 개선',
    ],
    requirements: [
      '웹 서비스 개발 경험 3년 이상 또는 이에 준하는 실전 경험',
      '프론트엔드와 백엔드 경계를 넘나드는 제품 개발 역량',
      '빠른 실험과 릴리스 흐름에 익숙한 커뮤니케이션 능력',
    ],
    perks: ['커피챗 우선 배정', 'AI 툴 예산 지원', '주 2회 재택'],
  },
  {
    id: 2,
    slug: 'northstar-capital-investment-strategy-analyst',
    badge: 'New',
    company: 'Northstar Capital',
    title: 'Investment Strategy Analyst',
    role: '금융',
    location: '서울',
    arrangement: '오프라인',
    experience: '신입',
    education: '학사 이상',
    deadline: 'D-6',
    summary:
      '초기 스타트업 발굴과 투자 메모 작성, 시장 리서치를 함께 수행할 애널리스트를 모집합니다.',
    companyIntro:
      'Northstar Capital은 테크 중심 초기 투자사로, 빠르게 논리를 세우고 팀과 함께 현장을 깊게 보는 사람을 선호합니다.',
    responsibilities: [
      '투자 검토를 위한 산업 리서치와 기업 분석',
      '미팅 노트, 투자 메모, 파이프라인 관리',
      '포트폴리오사 지원용 운영 과제 보조',
    ],
    requirements: [
      '재무 모델과 시장 분석 기초 역량',
      '명확한 문서 작성 습관',
      '스타트업과 기술 변화에 대한 높은 호기심',
    ],
    perks: ['파트너 커피챗', '딜 리뷰 세션 참여', '도서/교육 지원'],
  },
  {
    id: 3,
    slug: 'orbit-strategy-associate-consultant',
    badge: 'Global',
    company: 'Orbit Strategy',
    title: 'Associate Consultant, Growth Office',
    role: '컨설팅',
    location: '런던',
    arrangement: '원격 일부',
    experience: '경력 2년+',
    education: '학사 이상',
    deadline: 'D-14',
    summary:
      '신사업 전략 수립과 운영 개선 프로젝트를 함께할 글로벌 전략 컨설턴트를 찾고 있습니다.',
    companyIntro:
      'Orbit Strategy는 성장 단계 기업의 전략과 운영을 함께 정리하는 부티크 컨설팅 그룹입니다.',
    responsibilities: [
      '시장 진입 전략과 성장 과제 설계',
      '클라이언트 리서치 및 워크숍 운영',
      '실행 로드맵과 KPI 구조화',
    ],
    requirements: [
      '전략 프로젝트 또는 인하우스 전략 경험',
      '영문 문서와 커뮤니케이션 능력',
      '정량/정성 정보를 함께 묶는 문제 해결력',
    ],
    perks: ['해외 프로젝트 노출', '하이브리드 근무', '멘토링 세션'],
  },
  {
    id: 4,
    slug: 'atlas-bio-business-planning-manager',
    badge: 'Hot',
    company: 'Atlas Bio',
    title: 'Business Planning Manager',
    role: '기획',
    location: '판교',
    arrangement: '하이브리드',
    experience: '경력 4년+',
    education: '석사 우대',
    deadline: 'D-8',
    summary:
      '바이오 플랫폼의 중장기 로드맵과 IR 자료를 주도할 전략 기획 매니저 포지션입니다.',
    companyIntro:
      'Atlas Bio는 연구와 사업 개발 사이를 잇는 바이오 플랫폼 기업으로, 구조화된 사고와 실행 속도를 동시에 요구합니다.',
    responsibilities: [
      '연간 사업 계획 수립과 주요 KPI 정리',
      'IR deck과 경영 회의 자료 작성',
      '신규 파트너십/라이선스 기회 검토',
    ],
    requirements: [
      '전략기획 또는 사업개발 경험 4년 이상',
      '수치와 서사를 동시에 다루는 문서 능력',
      '바이오 또는 헬스케어 업계 이해',
    ],
    perks: ['연구팀 커피챗', '성과 인센티브', '유연 근무'],
  },
  {
    id: 5,
    slug: 'signal-house-performance-marketing-lead',
    badge: 'Remote',
    company: 'Signal House',
    title: 'Performance Marketing Lead',
    role: '마케팅',
    location: '뉴욕',
    arrangement: '원격',
    experience: '경력 5년+',
    education: '학사 이상',
    deadline: 'D-11',
    summary:
      '미국 시장 확장을 위한 퍼포먼스 실험 설계와 채널 최적화를 맡을 리드를 기다립니다.',
    companyIntro:
      'Signal House는 북미 D2C 브랜드의 성장 시스템을 설계하는 팀으로, 성과와 학습 루프를 빠르게 돌립니다.',
    responsibilities: [
      '유입 퍼널 설계와 매체별 실험 운영',
      '대시보드 설계 및 CAC/LTV 개선',
      '크리에이티브 실험 방향 제안',
    ],
    requirements: [
      '퍼포먼스 마케팅 실무 5년 이상',
      '광고 데이터와 GA 기반 분석 역량',
      '영문 커뮤니케이션 가능',
    ],
    perks: ['원격 100%', '분기별 오프사이트', '성과 보너스'],
  },
  {
    id: 6,
    slug: 'foundry-ai-founding-full-stack-engineer',
    badge: 'Founder Track',
    company: 'Foundry AI',
    title: 'Founding Full-Stack Engineer',
    role: '개발',
    location: '원격',
    arrangement: '원격',
    experience: '경력 무관',
    education: '학사 이상',
    deadline: '상시',
    summary:
      '창업 초기 팀에서 제품 구조를 처음부터 설계하며 빠르게 실험할 창업 멤버를 찾습니다.',
    companyIntro:
      'Foundry AI는 도메인 특화 AI 도구를 만드는 극초기 팀입니다. 역할 경계보다 문제 해결을 중시합니다.',
    responsibilities: [
      '프로덕트 아키텍처와 MVP 구현',
      '고객 피드백 기반 우선순위 재정의',
      '모델/인프라/UX를 함께 고려한 제품 결정',
    ],
    requirements: [
      '빠르게 만들고 고치는 창업형 실행력',
      '프론트엔드 또는 백엔드 한 영역 이상 깊은 이해',
      '모호한 문제를 구조화하는 역량',
    ],
    perks: ['스톡옵션', '전략 회의 직접 참여', '장비 예산 지원'],
  },
  {
    id: 7,
    slug: 'crest-mobility-operations-strategy-associate',
    badge: 'Fast Track',
    company: 'Crest Mobility',
    title: 'Operations Strategy Associate',
    role: '기획',
    location: '서울',
    arrangement: '오프라인',
    experience: '신입/경력',
    education: '학사 이상',
    deadline: 'D-4',
    summary:
      '도심 모빌리티 운영 데이터를 바탕으로 현장 개선안을 설계할 전략 운영 포지션입니다.',
    companyIntro:
      'Crest Mobility는 도시 이동 경험을 재설계하는 운영 집약형 조직입니다.',
    responsibilities: [
      '운영 지표 분석과 문제 원인 정리',
      '지역/시간대별 실험 과제 실행',
      '현장 운영팀과의 개선 프로젝트 관리',
    ],
    requirements: [
      '엑셀/SQL 등 기본 분석 능력',
      '복잡한 운영 이슈를 구조화하는 능력',
      '현장 커뮤니케이션에 대한 거부감이 없을 것',
    ],
    perks: ['실험 프로젝트 주도', '현장 인사이트 세션', '식대 지원'],
  },
  {
    id: 8,
    slug: 'summit-partners-campus-partnerships-manager',
    badge: 'Bridge Chat',
    company: 'Summit Partners',
    title: 'Campus Partnerships Manager',
    role: '마케팅',
    location: '서울',
    arrangement: '하이브리드',
    experience: '경력 2년+',
    education: '학사 이상',
    deadline: 'D-9',
    summary:
      '대학 커뮤니티와 파트너십을 확장하며 브랜딩 캠페인을 운영할 매니저를 모집합니다.',
    companyIntro:
      'Summit Partners는 커리어 커뮤니티와 브랜드를 연결하는 캠페인을 설계하는 팀입니다.',
    responsibilities: [
      '캠퍼스 파트너십 전략 기획 및 실행',
      '브랜드 이벤트와 커뮤니티 운영',
      '파트너십 성과 측정과 리포트 작성',
    ],
    requirements: [
      '브랜드/커뮤니티/제휴 경험 2년 이상',
      '대외 커뮤니케이션과 일정 운영 역량',
      '문서화와 협업 관리 능력',
    ],
    perks: ['브랜드 리더 커피챗', '유연 근무', '캠페인 인센티브'],
  },
]

export const journey = [
  {
    step: '01',
    title: '가입 및 학교 인증',
    copy: '학교 이메일 또는 허용 도메인 기준으로 인증을 마치고 기본 프로필을 등록합니다.',
  },
  {
    step: '02',
    title: '채용 공고 탐색',
    copy: '직군, 지역, 근무 형태, 학력, 경력 필터를 사용해 적합한 포지션만 골라봅니다.',
  },
  {
    step: '03',
    title: '커피챗 또는 원클릭 지원',
    copy: '포지션 이해가 더 필요하면 커피챗을 열고, 준비가 됐다면 바로 지원으로 이어집니다.',
  },
  {
    step: '04',
    title: '파트너 추적과 채용 연계',
    copy: '리퍼럴 링크, 지원 현황, 채용 상태를 연결해 기업과 지원자 모두 진행 상황을 확인합니다.',
  },
]

export const partnerPoints = [
  '전용 회원가입 링크와 공고별 링크를 분리해 추천 유입을 추적합니다.',
  '가입 회원, 프로필 등록, 지원 현황, 채용 확정까지 하나의 대시보드로 묶습니다.',
  '커피챗과 채용 단계를 자연스럽게 연결해 초기 대화부터 채용 검토까지 이어집니다.',
]

export const verificationSteps = [
  {
    title: '학교 선택',
    copy: '국내외 인증 대상 학교 목록에서 자신의 학교를 선택합니다.',
  },
  {
    title: '허용 도메인 확인',
    copy: '학교별 허용 메일 도메인을 확인하고 인증 코드를 발송합니다.',
  },
  {
    title: '프로필 등록',
    copy: '기본 이력, 관심 직무, 커피챗 선호를 입력한 뒤 지원을 시작합니다.',
  },
]

export const universities = [
  { name: '서울대학교', region: 'KR', domain: 'snu.ac.kr' },
  { name: '연세대학교', region: 'KR', domain: 'yonsei.ac.kr' },
  { name: '고려대학교', region: 'KR', domain: 'korea.ac.kr' },
  { name: 'KAIST', region: 'KR', domain: 'kaist.ac.kr' },
  { name: 'POSTECH', region: 'KR', domain: 'postech.ac.kr' },
  { name: 'MIT', region: 'US', domain: 'mit.edu' },
  { name: 'Stanford University', region: 'US', domain: 'stanford.edu' },
  { name: 'University of Oxford', region: 'UK', domain: 'ox.ac.uk' },
]

export const partnerMetrics = [
  { label: '가입 회원', value: '1,280명' },
  { label: '프로필 등록', value: '940명' },
  { label: '지원 현황', value: '340건' },
  { label: '채용 확정', value: '21명' },
]

export const partnerMembers = [
  {
    code: 'EJ-1420',
    name: '김서현',
    university: '연세대',
    major: '경영학과',
    profile: '등록완료',
    joinedAt: '2026-03-12',
  },
  {
    code: 'EJ-1412',
    name: '박민준',
    university: 'KAIST',
    major: '전산학부',
    profile: '등록완료',
    joinedAt: '2026-03-10',
  },
  {
    code: 'EJ-1398',
    name: 'Emily Cho',
    university: 'Stanford',
    major: 'Computer Science',
    profile: '미등록',
    joinedAt: '2026-03-07',
  },
]

export const partnerApplications = [
  {
    applicant: '김서현',
    company: 'Tensor Labs',
    title: 'Product Engineer, AI Workflow',
    status: '커피챗 수락',
    appliedAt: '2026-03-15',
  },
  {
    applicant: '박민준',
    company: 'Foundry AI',
    title: 'Founding Full-Stack Engineer',
    status: '기업 검토중',
    appliedAt: '2026-03-14',
  },
  {
    applicant: 'Emily Cho',
    company: 'Signal House',
    title: 'Performance Marketing Lead',
    status: '지원 완료',
    appliedAt: '2026-03-11',
  },
]

export const businessMetrics = [
  { label: '활성 파트너사', value: '46개' },
  { label: '월간 커피챗 매칭', value: '180+' },
  { label: '리퍼럴 유입 회원', value: '2.3K' },
  { label: '채용 확정 전환', value: '21%' },
]

export const businessScenarios = [
  {
    id: 'coffee-chat',
    label: '커피챗 중심 채용',
    headline: '초기 탐색 단계에서 핏을 빠르게 확인하는 운영 시나리오',
    summary:
      '초기 팀이나 포지션 정의가 계속 바뀌는 팀이 커피챗으로 우선 대화를 열고, 맞는 후보를 지원까지 자연스럽게 이어가게 돕습니다.',
    funnel: [
      { label: '리퍼럴 유입', value: '1,240명' },
      { label: '프로필 등록', value: '740명' },
      { label: '커피챗 수락', value: '182건' },
      { label: '지원 전환', value: '68건' },
    ],
  },
  {
    id: 'campus',
    label: '캠퍼스 브랜딩',
    headline: '학교 인증 기반 커뮤니티에서 브랜드 인지와 지원 의도를 동시에 쌓는 흐름',
    summary:
      '캠퍼스 파트너십과 커뮤니티 노출을 함께 운영해, 단기 모집뿐 아니라 다음 학기 후보군까지 미리 확보할 수 있는 시나리오입니다.',
    funnel: [
      { label: '브랜드 조회', value: '8.4K' },
      { label: '관심 저장', value: '1,680명' },
      { label: '오픈채팅/인박스', value: '216건' },
      { label: '지원 전환', value: '93건' },
    ],
  },
  {
    id: 'global',
    label: '글로벌 포지션',
    headline: '국내외 인증 대학생과 해외 포지션을 매칭하는 하이브리드 채용 시나리오',
    summary:
      '영문 공고와 글로벌 커뮤니티 노출을 함께 운영하며, 국제 학교 사용자도 같은 지원 흐름 안에서 관리하는 구조입니다.',
    funnel: [
      { label: '공고 조회', value: '5.1K' },
      { label: '영문 프로필', value: '940명' },
      { label: '커피챗 요청', value: '104건' },
      { label: '최종 인터뷰', value: '27건' },
    ],
  },
]

export const businessHighlights = [
  {
    title: '학교 인증 기반 인재풀',
    copy:
      '학교 이메일 인증을 통과한 후보만 풀에 포함해 초기 신뢰 형성 비용을 줄입니다.',
  },
  {
    title: '커피챗 중심 첫 접점',
    copy:
      '서류 지원 전에 포지션 이해와 상호 핏 확인이 가능한 대화 흐름을 제공합니다.',
  },
  {
    title: '공고별 링크와 추천 추적',
    copy:
      '파트너사 전용 링크와 공고별 링크를 생성해 유입, 가입, 지원 흐름을 연결합니다.',
  },
  {
    title: '지원 상태 대시보드',
    copy:
      '지원 완료, 검토중, 커피챗 수락, 채용 확정까지 상태를 한 화면에서 관리합니다.',
  },
]

export const businessSteps = [
  {
    step: '01',
    title: '파트너 온보딩',
    copy: '회사 정보와 채용 목적을 정리하고 전용 리퍼럴 코드를 발급합니다.',
  },
  {
    step: '02',
    title: '공고 업로드와 검수',
    copy: '핵심 포지션만 큐레이션 기준에 맞춰 등록하고 운영진 검수를 거칩니다.',
  },
  {
    step: '03',
    title: '커피챗/지원 흐름 운영',
    copy: '후보 탐색, 커피챗, 서류 지원, 상태 업데이트까지 하나의 파이프라인으로 연결합니다.',
  },
]

export const businessPlans = [
  {
    name: 'Starter Launch',
    price: '월 89만원',
    audience: '첫 채용을 여는 초기 팀',
    points: ['전용 리퍼럴 코드', '검수 공고 2건', '기본 대시보드'],
  },
  {
    name: 'Growth Hiring',
    price: '월 169만원',
    audience: '여러 포지션을 병행하는 팀',
    featured: true,
    points: ['공고별 링크 추적', '커뮤니티 노출', '커피챗 운영 지원'],
  },
  {
    name: 'Campus Brand',
    price: '맞춤형 견적',
    audience: '대학 타깃 브랜딩이 필요한 팀',
    points: ['학교별 캠페인 설계', '브랜드 콘텐츠 운영', '월간 리포트'],
  },
]

export const businessPartners = [
  {
    company: 'Tensor Labs',
    category: 'AI SaaS',
    hiring: 'Product Engineer / Design Engineer',
    result: '3주 내 커피챗 18건 연결',
  },
  {
    company: 'Northstar Capital',
    category: 'VC',
    hiring: 'Investment Strategy Analyst',
    result: '리퍼럴 유입 후보 112명 확보',
  },
  {
    company: 'Atlas Bio',
    category: 'Bio Platform',
    hiring: 'Business Planning Manager',
    result: '브랜드 세션 이후 지원 전환 24%',
  },
]

export const communityTopics = [
  '채용 후기',
  '커피챗 팁',
  '이직 전략',
  '학교 인증',
  '기업 문화',
]

export const communityPosts = [
  {
    slug: 'coffee-chat-best-questions',
    category: '커피챗 팁',
    title: '대표와 첫 커피챗 할 때 꼭 물어봐야 하는 질문 7가지',
    excerpt:
      '막연한 회사 소개 대신 팀의 우선순위와 의사결정 구조를 끌어내는 질문을 정리했습니다.',
    author: '김서현',
    university: '연세대',
    createdAt: '2026-03-20',
    readTime: '4분 읽기',
    likes: 84,
    comments: 13,
    tags: ['초기팀', '질문 리스트', '커피챗'],
    content: [
      '커피챗은 회사 소개를 듣는 자리가 아니라, 내가 실제로 일할 환경을 선명하게 확인하는 자리입니다.',
      '좋은 질문은 모호한 비전을 반복하게 하지 않고, 최근 3개월간의 우선순위 변화나 채용 이유처럼 구체적인 맥락을 끌어냅니다.',
      '특히 초기 팀일수록 지금 해결 중인 핵심 문제, 채용 후 90일 기대치, 의사결정 속도를 꼭 확인하는 편이 좋습니다.',
    ],
    replies: [
      { author: '박민준', body: '저는 최근에 “최근 포기한 우선순위가 무엇인지”를 꼭 물어보고 있어요.' },
      { author: 'Emily Cho', body: '팀의 피드백 문화 질문도 도움이 많이 됐습니다.' },
    ],
  },
  {
    slug: 'product-engineer-portfolio-guide',
    category: '채용 후기',
    title: '프로덕트 엔지니어 포트폴리오, 기능 나열보다 흐름 설명이 먹히더라',
    excerpt:
      '면접에서 반응이 좋았던 포트폴리오 구성 방식을 실제 사례 중심으로 공유합니다.',
    author: '박민준',
    university: 'KAIST',
    createdAt: '2026-03-18',
    readTime: '3분 읽기',
    likes: 66,
    comments: 9,
    tags: ['포트폴리오', '개발', '면접'],
    content: [
      '프로덕트 엔지니어 포지션에서는 기술 스택보다 사용자의 문제를 어떻게 줄였는지를 먼저 설명하는 편이 효과적이었습니다.',
      '저는 문제 정의, 가설, 구현, 지표 변화 순으로 흐름을 맞췄고 그 뒤에 기술 선택 이유를 붙였습니다.',
    ],
    replies: [
      { author: '이수진', body: '기술 블로그 링크보다 실제 의사결정 흐름이 더 설득력 있더라고요.' },
    ],
  },
  {
    slug: 'school-verification-domain-faq',
    category: '학교 인증',
    title: '학교 인증 도메인 관련해서 자주 나오는 질문 정리',
    excerpt:
      '복수 도메인, 졸업생 메일, 교환학생 케이스 등 반복되는 질문들을 모았습니다.',
    author: '운영팀',
    university: 'HireLink',
    createdAt: '2026-03-16',
    readTime: '2분 읽기',
    likes: 41,
    comments: 5,
    tags: ['학교 인증', '도메인', 'FAQ'],
    content: [
      '학교마다 복수의 허용 도메인이 존재할 수 있어, 실서비스에서는 학교별 활성 도메인을 별도 테이블로 관리하는 구조가 유리합니다.',
      '졸업생 메일과 학부/대학원 분리 도메인은 예외 규칙을 두는 방식으로 해결할 수 있습니다.',
    ],
    replies: [
      { author: '운영팀', body: '추가 학교 요청은 인증 페이지 하단 폼으로 받을 수 있게 확장 예정입니다.' },
    ],
  },
]

export const communityHighlights = [
  {
    title: '이번 주 가장 많이 저장된 글',
    copy: '커피챗 질문 정리 글이 저장수 84회를 기록했습니다.',
  },
  {
    title: '학교 인증 FAQ 업데이트',
    copy: '복수 도메인 처리 규칙과 졸업생 메일 케이스가 정리됐습니다.',
  },
  {
    title: '포트폴리오 리뷰 스레드 오픈',
    copy: '프로덕트 엔지니어 포지션 준비자를 위한 공개 피드백 스레드가 진행 중입니다.',
  },
]

export const inboxThreads = [
  {
    id: 'thread-1',
    name: 'Tensor Labs 채용팀',
    company: 'Tensor Labs',
    role: 'Product Engineer 포지션',
    stage: '커피챗 일정 조율',
    lastActive: '5분 전',
    lastMessage: '다음 주 수요일 오후에 커피챗 가능하실까요?',
    unread: 2,
    messages: [
      { from: 'them', body: '안녕하세요. 프로필 잘 보았습니다.', time: '오전 10:02' },
      {
        from: 'me',
        body: '안녕하세요. 포지션 관련해 몇 가지 더 여쭤보고 싶었습니다.',
        time: '오전 10:07',
      },
      {
        from: 'them',
        body: '다음 주 수요일 오후에 커피챗 가능하실까요?',
        time: '오전 10:18',
      },
    ],
  },
  {
    id: 'thread-2',
    name: 'Northstar Capital',
    company: 'Northstar Capital',
    role: 'Investment Strategy Analyst',
    stage: '서류 검토중',
    lastActive: '1일 전',
    lastMessage: '지원해주셔서 감사합니다. 검토 후 다시 연락드리겠습니다.',
    unread: 0,
    messages: [
      { from: 'them', body: '지원해주셔서 감사합니다.', time: '어제 오후 2:10' },
      {
        from: 'them',
        body: '검토 후 다시 연락드리겠습니다.',
        time: '어제 오후 2:11',
      },
    ],
  },
  {
    id: 'thread-3',
    name: 'Summit Partners',
    company: 'Summit Partners',
    role: 'Campus Partnerships Manager',
    stage: '포트폴리오 요청',
    lastActive: '3시간 전',
    lastMessage: '커피챗 전에 포트폴리오를 공유해주실 수 있나요?',
    unread: 1,
    messages: [
      {
        from: 'them',
        body: '커피챗 전에 포트폴리오를 공유해주실 수 있나요?',
        time: '오후 1:24',
      },
    ],
  },
]

export const inboxQuickActions = [
  '커피챗 일정 조율',
  '포트폴리오 링크 공유',
  '지원 상태 팔로업',
]

export const resumeSections = [
  {
    title: '기본 정보',
    items: ['이름 / 연락처', '학교 / 전공', '관심 직무'],
  },
  {
    title: '경험 요약',
    items: ['인턴 / 프로젝트', '리더십 / 운영 경험', '정량 성과'],
  },
  {
    title: '링크와 첨부',
    items: ['포트폴리오', 'GitHub / LinkedIn', '첨부 문서'],
  },
]

export const resumeTemplates = [
  { name: 'Minimal Executive', description: '경영/전략 직군용 간결한 요약 중심 템플릿' },
  { name: 'Builder Profile', description: '개발 직군용 프로젝트 흐름과 결과 강조 템플릿' },
  { name: 'Global Narrative', description: '영문 지원과 대외 활동을 강조하는 템플릿' },
]

export const resumeSeed = {
  name: '박민준',
  school: 'KAIST',
  major: '전산학부',
  headline: '문제 정의부터 릴리스까지 책임지는 프로덕트 엔지니어',
  summary:
    '생성형 AI 기반 협업 도구를 만들며 실험 설계, 프론트엔드 구현, 지표 해석까지 연결해온 경험이 있습니다.',
  impact: '최근 프로젝트에서 활성 사용자 리텐션을 18% 개선했습니다.',
  experience:
    '사이드 프로젝트 2개와 인턴 경험을 바탕으로 제품 우선순위, API 설계, UI 개선을 빠르게 반복했습니다.',
  links: 'github.com/minjun · linkedin.com/in/minjun',
}

export const resumeFocusPrompts = [
  {
    title: '문제 해결 흐름',
    copy: '기능 나열보다 문제 정의, 가설, 결과를 순서대로 보여주면 설득력이 높아집니다.',
  },
  {
    title: '정량 성과 강조',
    copy: '리텐션, 전환율, 처리 시간 개선처럼 숫자로 확인되는 변화를 한 줄씩 남겨두세요.',
  },
  {
    title: '직무 맞춤 요약',
    copy: '지원 공고의 우선순위에 맞춰 요약 문장과 대표 경험 순서를 바꾸는 편이 좋습니다.',
  },
]

export function findJobBySlug(slug) {
  return jobs.find((job) => job.slug === slug)
}

export function findCommunityPostBySlug(slug) {
  return communityPosts.find((post) => post.slug === slug)
}
