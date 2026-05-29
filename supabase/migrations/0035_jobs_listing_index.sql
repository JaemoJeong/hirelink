-- 목록 페이지 성능 인덱스
-- listJobs: WHERE status='published' ORDER BY published_at DESC
-- 314개 시점에 인덱스 없이도 ~1.5초이지만 데이터 증가에 대비

create index if not exists jobs_status_published_at_idx
  on public.jobs (status, published_at desc nulls last);

create index if not exists jobs_company_id_idx
  on public.jobs (company_id);
