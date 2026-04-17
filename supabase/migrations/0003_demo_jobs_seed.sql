insert into public.companies (slug, name, category, website_url, description, headquarters, is_partner)
values
  (
    'tensor-labs',
    'Tensor Labs',
    'AI SaaS',
    'https://tensorlabs.example.com',
    'LLM 기반 업무 자동화 도구를 만드는 제품 팀으로, 제품 실험과 엔지니어링 속도를 함께 중시합니다.',
    '서울',
    true
  ),
  (
    'northstar-capital',
    'Northstar Capital',
    'Venture Capital',
    'https://northstarcapital.example.com',
    '초기 스타트업을 발굴하고 투자 논리를 빠르게 검증하는 테크 중심 투자사입니다.',
    '서울',
    true
  ),
  (
    'orbit-strategy',
    'Orbit Strategy',
    'Consulting',
    'https://orbitstrategy.example.com',
    '성장 단계 기업의 전략과 운영 체계를 정리하는 부티크 컨설팅 그룹입니다.',
    '런던',
    true
  ),
  (
    'atlas-bio',
    'Atlas Bio',
    'Bio Platform',
    'https://atlasbio.example.com',
    '연구와 사업 개발을 잇는 바이오 플랫폼 기업으로, 구조화된 사고와 빠른 실행을 함께 요구합니다.',
    '판교',
    true
  ),
  (
    'signal-house',
    'Signal House',
    'Growth Marketing',
    'https://signalhouse.example.com',
    '북미 시장을 중심으로 D2C 성장 시스템을 설계하는 퍼포먼스 마케팅 팀입니다.',
    '뉴욕',
    true
  ),
  (
    'foundry-ai',
    'Foundry AI',
    'Applied AI',
    'https://foundryai.example.com',
    '도메인 특화 AI 제품을 만드는 극초기 팀으로, 창업형 실행력을 가진 빌더를 찾고 있습니다.',
    '원격',
    true
  )
on conflict (slug) do update
set
  name = excluded.name,
  category = excluded.category,
  website_url = excluded.website_url,
  description = excluded.description,
  headquarters = excluded.headquarters,
  is_partner = excluded.is_partner,
  updated_at = timezone('utc', now());

insert into public.jobs (
  company_id,
  slug,
  title,
  role,
  location,
  arrangement,
  experience_label,
  education_label,
  summary,
  description,
  responsibilities,
  requirements,
  perks,
  status,
  deadline_at,
  published_at
)
values
  (
    (select id from public.companies where slug = 'tensor-labs'),
    'tensor-labs-product-engineer',
    'Product Engineer, AI Workflow',
    '개발',
    '서울',
    '하이브리드',
    '경력 3년+',
    '학사 이상',
    'LLM 기반 생산성 제품을 만드는 팀에서 프론트엔드와 백엔드를 함께 다룰 엔지니어를 찾습니다.',
    'Tensor Labs는 AI 워크플로우 자동화 제품을 만드는 빠른 실행 중심 팀입니다. 프로덕트, 모델, 인프라가 같은 속도로 움직이는 환경을 지향합니다.',
    '["React 기반 프로덕트 UI와 실험 환경 구현", "Node/BFF 레이어 설계와 내부 API 연동", "PM, 디자이너와 함께 사용자 흐름 단위로 제품 개선"]'::jsonb,
    '["웹 서비스 개발 경험 3년 이상 또는 이에 준하는 실전 경험", "프론트엔드와 백엔드 경계를 넘나드는 제품 개발 역량", "빠른 실험과 릴리스 흐름에 익숙한 커뮤니케이션 능력"]'::jsonb,
    '["커피챗 우선 배정", "AI 툴 예산 지원", "주 2회 재택"]'::jsonb,
    'published',
    timezone('utc', now()) + interval '10 days',
    timezone('utc', now()) - interval '2 days'
  ),
  (
    (select id from public.companies where slug = 'northstar-capital'),
    'northstar-capital-investment-strategy-analyst',
    'Investment Strategy Analyst',
    '금융',
    '서울',
    '오프라인',
    '신입',
    '학사 이상',
    '초기 스타트업 발굴과 투자 메모 작성, 시장 리서치를 함께 수행할 애널리스트를 모집합니다.',
    'Northstar Capital은 테크 중심 초기 투자사로, 빠르게 논리를 세우고 팀과 함께 현장을 깊게 보는 사람을 선호합니다.',
    '["투자 검토를 위한 산업 리서치와 기업 분석", "미팅 노트, 투자 메모, 파이프라인 관리", "포트폴리오사 지원용 운영 과제 보조"]'::jsonb,
    '["재무 모델과 시장 분석 기초 역량", "명확한 문서 작성 습관", "스타트업과 기술 변화에 대한 높은 호기심"]'::jsonb,
    '["파트너 커피챗", "딜 리뷰 세션 참여", "도서 및 교육 지원"]'::jsonb,
    'published',
    timezone('utc', now()) + interval '6 days',
    timezone('utc', now()) - interval '3 days'
  ),
  (
    (select id from public.companies where slug = 'orbit-strategy'),
    'orbit-strategy-associate-consultant',
    'Associate Consultant, Growth Office',
    '컨설팅',
    '런던',
    '원격 일부',
    '경력 2년+',
    '학사 이상',
    '신사업 전략 수립과 운영 개선 프로젝트를 함께할 글로벌 전략 컨설턴트를 찾고 있습니다.',
    'Orbit Strategy는 성장 단계 기업의 전략과 운영을 함께 정리하는 부티크 컨설팅 그룹입니다.',
    '["시장 진입 전략과 성장 과제 설계", "클라이언트 리서치 및 워크숍 운영", "실행 로드맵과 KPI 구조화"]'::jsonb,
    '["전략 프로젝트 또는 인하우스 전략 경험", "영문 문서와 커뮤니케이션 능력", "정량과 정성 정보를 함께 묶는 문제 해결력"]'::jsonb,
    '["해외 프로젝트 노출", "하이브리드 근무", "멘토링 세션"]'::jsonb,
    'published',
    timezone('utc', now()) + interval '14 days',
    timezone('utc', now()) - interval '4 days'
  ),
  (
    (select id from public.companies where slug = 'atlas-bio'),
    'atlas-bio-business-planning-manager',
    'Business Planning Manager',
    '기획',
    '판교',
    '하이브리드',
    '경력 4년+',
    '석사 우대',
    '바이오 플랫폼의 중장기 로드맵과 IR 자료를 주도할 전략 기획 매니저 포지션입니다.',
    'Atlas Bio는 연구와 사업 개발 사이를 잇는 바이오 플랫폼 기업으로, 구조화된 사고와 실행 속도를 동시에 요구합니다.',
    '["연간 사업 계획 수립과 주요 KPI 정리", "IR deck과 경영 회의 자료 작성", "신규 파트너십과 라이선스 기회 검토"]'::jsonb,
    '["전략기획 또는 사업개발 경험 4년 이상", "수치와 서사를 동시에 다루는 문서 능력", "바이오 또는 헬스케어 업계 이해"]'::jsonb,
    '["연구팀 커피챗", "성과 인센티브", "유연 근무"]'::jsonb,
    'published',
    timezone('utc', now()) + interval '8 days',
    timezone('utc', now()) - interval '1 day'
  ),
  (
    (select id from public.companies where slug = 'signal-house'),
    'signal-house-performance-marketing-lead',
    'Performance Marketing Lead',
    '마케팅',
    '뉴욕',
    '원격',
    '경력 5년+',
    '학사 이상',
    '미국 시장 확장을 위한 퍼포먼스 실험 설계와 채널 최적화를 맡을 리드를 기다립니다.',
    'Signal House는 북미 D2C 브랜드의 성장 시스템을 설계하는 팀으로, 성과와 학습 루프를 빠르게 돌립니다.',
    '["유입 퍼널 설계와 매체별 실험 운영", "대시보드 설계 및 CAC와 LTV 개선", "크리에이티브 실험 방향 제안"]'::jsonb,
    '["퍼포먼스 마케팅 실무 5년 이상", "광고 데이터와 GA 기반 분석 역량", "영문 커뮤니케이션 가능"]'::jsonb,
    '["원격 100%", "분기별 오프사이트", "성과 보너스"]'::jsonb,
    'published',
    timezone('utc', now()) + interval '11 days',
    timezone('utc', now()) - interval '5 days'
  ),
  (
    (select id from public.companies where slug = 'foundry-ai'),
    'foundry-ai-founding-full-stack-engineer',
    'Founding Full-Stack Engineer',
    '개발',
    '원격',
    '원격',
    '경력 무관',
    '학사 이상',
    '창업 초기 팀에서 제품 구조를 처음부터 설계하며 빠르게 실험할 창업 멤버를 찾습니다.',
    'Foundry AI는 도메인 특화 AI 도구를 만드는 극초기 팀입니다. 역할 경계보다 문제 해결을 중시합니다.',
    '["프로덕트 아키텍처와 MVP 구현", "고객 피드백 기반 우선순위 재정의", "모델과 인프라와 UX를 함께 고려한 제품 결정"]'::jsonb,
    '["빠르게 만들고 고치는 창업형 실행력", "프론트엔드 또는 백엔드 한 영역 이상 깊은 이해", "모호한 문제를 구조화하는 역량"]'::jsonb,
    '["스톡옵션", "전략 회의 직접 참여", "장비 예산 지원"]'::jsonb,
    'published',
    null,
    timezone('utc', now()) - interval '6 days'
  )
on conflict (slug) do update
set
  company_id = excluded.company_id,
  title = excluded.title,
  role = excluded.role,
  location = excluded.location,
  arrangement = excluded.arrangement,
  experience_label = excluded.experience_label,
  education_label = excluded.education_label,
  summary = excluded.summary,
  description = excluded.description,
  responsibilities = excluded.responsibilities,
  requirements = excluded.requirements,
  perks = excluded.perks,
  status = excluded.status,
  deadline_at = excluded.deadline_at,
  published_at = excluded.published_at,
  updated_at = timezone('utc', now());

insert into public.job_tags (job_id, tag)
select jobs.id, seed.tag
from (
  values
    ('tensor-labs-product-engineer', 'Top Pick'),
    ('tensor-labs-product-engineer', 'AI'),
    ('tensor-labs-product-engineer', 'Product'),
    ('northstar-capital-investment-strategy-analyst', 'New'),
    ('northstar-capital-investment-strategy-analyst', 'VC'),
    ('northstar-capital-investment-strategy-analyst', 'Investment'),
    ('orbit-strategy-associate-consultant', 'Global'),
    ('orbit-strategy-associate-consultant', 'Strategy'),
    ('atlas-bio-business-planning-manager', 'Hot'),
    ('atlas-bio-business-planning-manager', 'Bio'),
    ('signal-house-performance-marketing-lead', 'Remote'),
    ('signal-house-performance-marketing-lead', 'Growth'),
    ('foundry-ai-founding-full-stack-engineer', 'Founder Track'),
    ('foundry-ai-founding-full-stack-engineer', 'Full Stack')
) as seed(job_slug, tag)
join public.jobs on jobs.slug = seed.job_slug
on conflict (job_id, tag) do nothing;
