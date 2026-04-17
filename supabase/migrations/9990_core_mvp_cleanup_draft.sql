-- Core MVP cleanup draft
-- Keep:
-- universities, university_domains, profiles, companies, company_members,
-- jobs, job_tags, applications, application_status_history,
-- company_info_requests, verification_requests,
-- school_email_verification_challenges, notifications, audit_logs
--
-- Run this only after backing up data you still need.

begin;

drop table if exists public.community_reports cascade;
drop table if exists public.community_reactions cascade;
drop table if exists public.community_comments cascade;
drop table if exists public.community_posts cascade;
drop table if exists public.community_categories cascade;

drop table if exists public.thread_messages cascade;
drop table if exists public.thread_participants cascade;
drop table if exists public.inbox_threads cascade;

drop table if exists public.resume_versions cascade;
drop table if exists public.resumes cascade;

drop table if exists public.saved_jobs cascade;

drop table if exists public.coffee_chat_sessions cascade;
drop table if exists public.coffee_chat_requests cascade;

drop table if exists public.company_invites cascade;
drop table if exists public.referral_events cascade;
drop table if exists public.referral_links cascade;

-- Optional storage cleanup.
-- Uncomment only if you no longer need uploaded company or resume assets.
-- delete from storage.objects where bucket_id in ('company-assets', 'resume-files');
-- delete from storage.buckets where id in ('company-assets', 'resume-files');

commit;
