# Supabase Setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env` and fill in:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Run the migrations in this order:
   - `supabase/migrations/0001_initial_platform.sql`
   - `supabase/migrations/0002_auth_profile_bootstrap.sql`
   - `supabase/migrations/0003_demo_jobs_seed.sql`
   - `supabase/migrations/0004_community_counters.sql`
   - `supabase/migrations/0005_inbox_bootstrap.sql`
   - `supabase/migrations/0006_public_profile_cards.sql`
   - `supabase/migrations/0007_partner_workspace_bootstrap.sql`
   - `supabase/migrations/0008_partner_application_actions.sql`
   - `supabase/migrations/0009_partner_coffee_chat_actions.sql`
   - `supabase/migrations/0010_candidate_actions.sql`
   - `supabase/migrations/0011_profile_update_guards.sql`
   - `supabase/migrations/0012_admin_verification_actions.sql`
   - `supabase/migrations/0013_partner_company_profile_actions.sql`
   - `supabase/migrations/0014_partner_application_resume_access.sql`
   - `supabase/migrations/0015_partner_event_notifications.sql`
   - `supabase/migrations/0016_verification_requests.sql`
   - `supabase/migrations/0017_community_reports.sql`
   - `supabase/migrations/0018_company_invites.sql`
   - `supabase/migrations/0019_job_review_actions.sql`
   - `supabase/migrations/0020_company_profile_sections.sql`
   - `supabase/migrations/0021_company_brand_assets.sql`
   - `supabase/migrations/0022_company_asset_storage.sql`
   - `supabase/migrations/0023_resume_file_storage.sql`
   - `supabase/migrations/0024_resume_file_signed_access.sql`
   - `supabase/migrations/0025_resume_file_access_audit.sql`
   - `supabase/migrations/0026_company_info_requests.sql`
   - `supabase/migrations/0027_company_info_public_answers.sql`
   - `supabase/migrations/0028_demo_company_intelligence_seed.sql`
   - `supabase/migrations/0029_school_email_otp_verification.sql`
4. Enable Email auth in Supabase Auth.
5. If you want email verification, keep Confirm email enabled in Auth settings.
6. If you want actual school-email OTP verification, deploy the Edge Function and set its secrets.

## What the first migration creates

- Universities and allowed domains
- Profiles linked to `auth.users`
- Companies and partner memberships
- Jobs, job tags, referral links, referral events
- Resumes and resume versions
- Applications and application status history
- Coffee chat requests
- Community posts, comments, reactions
- Inbox threads, participants, messages
- Notifications and audit logs
- Initial RLS policies and starter seed rows

## Extra migrations

- `0002_auth_profile_bootstrap.sql`
  - Creates a trigger so new auth users automatically get a `profiles` row.
- `0003_demo_jobs_seed.sql`
  - Seeds partner companies, published jobs, and job tags so the jobs board can switch from mock fallback to real public data.
- `0004_community_counters.sql`
  - Keeps `community_posts.like_count` and `community_posts.comment_count` in sync when users add comments or toggle likes.
- `0005_inbox_bootstrap.sql`
  - Lets a thread creator insert the first participant row for a new thread and keeps `inbox_threads.updated_at` synced when messages are sent.
- `0006_public_profile_cards.sql`
  - Exposes a safe RPC for public author display names so community posts and comments can show profile cards without opening the whole `profiles` table.
- `0007_partner_workspace_bootstrap.sql`
  - Adds a secure helper so an authenticated test user can activate a seeded demo partner workspace and view the real partner dashboard.
- `0008_partner_application_actions.sql`
  - Adds a secure partner RPC that updates application status, appends `application_status_history`, and creates a candidate notification in one step.
- `0009_partner_coffee_chat_actions.sql`
  - Adds a secure partner RPC that updates coffee chat status, assigns the responding partner, and creates a requester notification in one step.
- `0010_candidate_actions.sql`
  - Adds `saved_jobs` for candidate-side bookmarking and a secure RPC so candidates can withdraw an application while still appending `application_status_history`.
- `0011_profile_update_guards.sql`
  - Locks down profile self-service updates so candidates cannot promote their own `user_role` or mark themselves verified, while still allowing safe profile edits and verification submissions.
- `0012_admin_verification_actions.sql`
  - Adds a secure platform-admin RPC for approving or rejecting school verification requests, creating candidate notifications, and logging the action in `audit_logs`.
- `0013_partner_company_profile_actions.sql`
  - Adds a secure partner RPC so company members can update public company profile copy without opening unrestricted `companies` updates.
- `0014_partner_application_resume_access.sql`
  - Adds a secure partner RPC for viewing the latest version summary of resumes attached to applications for that partner's jobs.
- `0015_partner_event_notifications.sql`
  - Adds triggers that notify company members when new applications or coffee chat requests arrive.
- `0016_verification_requests.sql`
  - Adds a verification request history table plus candidate submission/admin review RPC updates so school verification has an audit trail.
- `0017_community_reports.sql`
  - Adds community post/comment report records with RLS so users can report content and admins can see open report counts.
- `0018_company_invites.sql`
  - Adds company team invite tokens plus partner/admin RPCs for creating and accepting company membership invites.
- `0019_job_review_actions.sql`
  - Adds a platform-admin job review RPC that approves, rejects, closes, or reopens partner job posts and notifies company members.
- `0020_company_profile_sections.sql`
  - Extends company profiles with tagline, mission, culture, benefits, and hiring process sections for richer public company pages.
- `0021_company_brand_assets.sql`
  - Adds logo URL, cover image URL, and brand color fields to company profiles and extends the partner profile RPC.
- `0022_company_asset_storage.sql`
  - Creates the public `company-assets` Storage bucket and RLS policies so company members can upload/manage brand images.
- `0023_resume_file_storage.sql`
  - Adds private `resume-files` Storage, resume file metadata fields, and partner-visible attachment metadata for submitted applications.
- `0024_resume_file_signed_access.sql`
  - Broadens private resume file read policy to owners, platform admins, and partner members tied to submitted applications so signed URLs can be opened safely.
- `0025_resume_file_access_audit.sql`
  - Adds a resume file access audit RPC so signed URL generation can be recorded in `audit_logs`.
- `0026_company_info_requests.sql`
  - Adds student-to-company information requests, partner answer workflow, and notifications for company information Q&A.
- `0027_company_info_public_answers.sql`
  - Makes answered company Q&A visible on public company pages and sends answer notifications back to the specific company detail page.
- `0028_demo_company_intelligence_seed.sql`
  - Enriches seeded demo partner companies with mission, culture, benefits, hiring process, brand color, and sample answered Q&A for student demos.
- `0029_school_email_otp_verification.sql`
  - Adds one-time school email verification challenges and the `candidate_confirm_school_email_verification` RPC so candidates can become verified only after entering a code sent to their real school email address.

## School Email OTP setup

1. Run:
   - `supabase/migrations/0016_verification_requests.sql`
   - `supabase/migrations/0029_school_email_otp_verification.sql`
2. Deploy the function:
   - `supabase functions deploy send-school-verification-code`
3. Set function secrets:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
4. Optional for local/dev demos:
   - `ALLOW_DEV_VERIFICATION_CODE_RESPONSE=true`
   - If enabled, the frontend success banner also shows the OTP code so you can test without opening the mailbox.

The function source lives at `supabase/functions/send-school-verification-code/index.ts`.
It validates the selected university domain, throttles repeated requests, sends a 6-digit code by email, and stores a short-lived verification challenge in `school_email_verification_challenges`.

## Recommended next steps

1. Replace inbox and partner dashboard reads with Supabase queries.
2. Split partner/admin permissions more finely once the first company accounts are created.
3. Add avatars and downloadable audit filtering in ops.
