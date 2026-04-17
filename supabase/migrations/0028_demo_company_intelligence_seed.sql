update public.companies
set
  tagline = seed.tagline,
  mission = seed.mission,
  culture = seed.culture,
  benefits = seed.benefits,
  hiring_process = seed.hiring_process,
  brand_color = seed.brand_color,
  updated_at = timezone('utc', now())
from (
  values
    (
      'tensor-labs',
      'LLM workflow를 실제 업무 제품으로 바꾸는 AI SaaS 팀',
      '반복 업무를 줄이고 팀이 더 중요한 판단에 시간을 쓰게 만드는 AI workflow layer를 만듭니다.',
      '작은 실험을 빠르게 배포하고, 사용자 로그와 인터뷰를 함께 보며 다음 스프린트를 정합니다.',
      '["AI 제품 실험 참여", "주 2회 재택", "개인 AI 툴 예산", "엔지니어링 데모 데이"]'::jsonb,
      '["서류 검토", "제품 과제", "팀 인터뷰", "커피챗 후 오퍼 논의"]'::jsonb,
      '#1d4ed8'
    ),
    (
      'northstar-capital',
      '초기 테크 스타트업을 깊게 보는 thesis-driven VC',
      '기술 변화가 만드는 새로운 시장을 빠르게 읽고, 창업팀의 첫 성장 가설을 함께 검증합니다.',
      '파트너와 애널리스트가 같은 딜룸에서 토론하고, 짧고 선명한 투자 메모를 중요하게 봅니다.',
      '["파트너 딜 리뷰 참여", "산업 리서치 멘토링", "포트폴리오 네트워크", "도서/세미나 지원"]'::jsonb,
      '["서류 검토", "케이스 메모", "파트너 인터뷰", "레퍼런스 체크"]'::jsonb,
      '#0f766e'
    ),
    (
      'orbit-strategy',
      '성장 단계 기업의 전략과 운영을 동시에 정리하는 컨설팅 팀',
      '좋은 전략이 실행 현장에서 작동하도록 시장 진입, KPI, 운영 프로세스를 한 번에 설계합니다.',
      '자료의 예쁨보다 논리의 선명함을 중시하고, 클라이언트와 함께 워크숍으로 결론을 만듭니다.',
      '["글로벌 프로젝트 노출", "멘토링 세션", "하이브리드 근무", "케이스 스터디 라이브러리"]'::jsonb,
      '["서류 검토", "전략 케이스", "영문 커뮤니케이션 인터뷰", "최종 파트너 미팅"]'::jsonb,
      '#7c2d12'
    ),
    (
      'atlas-bio',
      '연구와 사업 개발 사이를 잇는 바이오 플랫폼 회사',
      '좋은 연구가 시장과 파트너십으로 연결되도록 제품 로드맵, IR, 사업 개발을 구조화합니다.',
      '연구자와 사업 담당자가 같은 문서를 보며 의사결정하고, 복잡한 내용을 쉽게 설명하는 능력을 높게 봅니다.',
      '["연구팀 커피챗", "유연 근무", "성과 인센티브", "헬스케어 도메인 교육"]'::jsonb,
      '["서류 검토", "사업 기획 과제", "도메인 인터뷰", "경영진 미팅"]'::jsonb,
      '#be123c'
    ),
    (
      'signal-house',
      '북미 D2C 성장을 데이터와 크리에이티브로 설계하는 팀',
      '브랜드가 더 좋은 고객을 더 낮은 비용으로 만나도록 실험, 대시보드, 크리에이티브 루프를 만듭니다.',
      '성과 숫자를 매일 보고, 실패한 실험에서도 다음 가설을 뽑는 마케팅 운영 문화를 갖고 있습니다.',
      '["원격 100%", "분기별 오프사이트", "성과 보너스", "글로벌 캠페인 경험"]'::jsonb,
      '["서류 검토", "캠페인 리뷰 과제", "실무진 인터뷰", "리더십 인터뷰"]'::jsonb,
      '#ea580c'
    ),
    (
      'foundry-ai',
      '도메인 특화 AI 제품을 빠르게 만드는 창업형 빌더 팀',
      '고객의 특정 업무를 깊게 파고들어 MVP를 만들고, 실제 사용에서 배운 내용을 바로 제품에 반영합니다.',
      '역할보다 문제 해결을 우선하고, 엔지니어도 고객 미팅과 제품 의사결정에 적극 참여합니다.',
      '["스톡옵션", "장비 예산", "전략 회의 직접 참여", "원격 중심"]'::jsonb,
      '["빌더 포트폴리오 리뷰", "라이브 문제 해결", "창업팀 인터뷰", "조건 협의"]'::jsonb,
      '#4338ca'
    )
) as seed(slug, tagline, mission, culture, benefits, hiring_process, brand_color)
where companies.slug = seed.slug;

with demo_requester as (
  select id
  from public.profiles
  order by created_at
  limit 1
),
seed_questions as (
  select *
  from (
    values
      (
        'tensor-labs',
        'AI 제품 경험이 부족한 학생도 지원할 수 있나요?',
        '네. 특정 모델 경험보다 제품 문제를 구조화하고 빠르게 실험하는 태도를 더 봅니다. 작은 사이드 프로젝트라도 사용자 흐름을 끝까지 만든 경험이 있으면 좋습니다.'
      ),
      (
        'northstar-capital',
        '투자사 인턴에서 가장 중요하게 보는 역량은 무엇인가요?',
        '시장 리서치를 단순 요약이 아니라 투자 판단으로 연결하는 능력입니다. 왜 지금 이 시장이 열리는지, 어떤 팀이 이길 수 있는지 문서로 선명하게 쓰는 연습이 도움이 됩니다.'
      ),
      (
        'foundry-ai',
        '초기 스타트업 경험이 없어도 founding role에 지원할 수 있나요?',
        '가능합니다. 대신 모호한 요구사항에서 스스로 우선순위를 잡고, 빠르게 만들고 고친 증거가 필요합니다. 해커톤, 오픈소스, 개인 제품 모두 좋은 신호가 됩니다.'
      )
  ) as seed(slug, question, answer)
)
insert into public.company_info_requests (
  company_id,
  requester_id,
  question,
  context,
  status,
  answer,
  answered_by,
  answered_at,
  created_at
)
select
  companies.id,
  demo_requester.id,
  seed_questions.question,
  '내일 학생 데모용 샘플 기업 Q&A',
  'answered',
  seed_questions.answer,
  demo_requester.id,
  timezone('utc', now()) - interval '2 hours',
  timezone('utc', now()) - interval '4 hours'
from seed_questions
join public.companies
  on companies.slug = seed_questions.slug
cross join demo_requester
where not exists (
  select 1
  from public.company_info_requests
  where company_info_requests.company_id = companies.id
    and company_info_requests.question = seed_questions.question
);
