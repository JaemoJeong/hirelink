-- jobs.apply_url: 외부 채용 사이트 지원 링크
-- (운영 DB에는 이미 컬럼이 추가되어 있으나 코드 히스토리 정합성을 위해 기록)

alter table public.jobs
add column if not exists apply_url text;

comment on column public.jobs.apply_url is
  '외부 채용 사이트 직접 지원 URL. NULL이면 HireLink 내부 application 플로우 사용.';
