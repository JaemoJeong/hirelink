-- =============================================================================
-- 0033 Security hardening
-- 1) school_email_verification_challenges: deny client SELECT entirely.
--    The Edge Function (service role) and RPC `candidate_confirm_school_email_verification`
--    (security definer) are the only paths that should ever read code_hash/code_salt.
--    Returning the row to the client allowed offline brute-force of 6-digit codes.
-- 2) applications: stop authenticated users from updating their own row directly.
--    Status transitions must go through dedicated RPCs (withdraw_application,
--    admin/partner status updates). Direct UPDATE allowed self-promotion to "offer".
-- =============================================================================

-- 1) school_email_verification_challenges -----------------------------------------
DROP POLICY IF EXISTS "users read own school email verification challenges"
  ON public.school_email_verification_challenges;

-- Only platform admins can read the table from a client. The signup flow does NOT
-- need the row contents — the Edge Function returns challengeId/maskedEmail/expiresAt
-- inside its JSON response, and verification happens via security-definer RPC.
CREATE POLICY "admins read school email verification challenges"
ON public.school_email_verification_challenges
FOR SELECT
TO authenticated
USING (public.is_platform_admin());

-- 2) applications --------------------------------------------------------------
DROP POLICY IF EXISTS "users and partners update applications" ON public.applications;

-- Candidates may NOT update their own applications directly. They use the
-- `withdraw_application` RPC (security definer) which validates the transition.
CREATE POLICY "partners and admins update applications"
ON public.applications
FOR UPDATE
TO authenticated
USING (
  public.is_platform_admin()
  OR EXISTS (
    SELECT 1
    FROM public.jobs
    WHERE jobs.id = applications.job_id
      AND public.is_company_member(jobs.company_id)
  )
)
WITH CHECK (
  public.is_platform_admin()
  OR EXISTS (
    SELECT 1
    FROM public.jobs
    WHERE jobs.id = applications.job_id
      AND public.is_company_member(jobs.company_id)
  )
);

-- 3) Drop the dev fallback that bypasses email delivery -------------------------
-- The frontend no longer calls this and shipping a code-returning RPC into prod
-- is the same vulnerability we just closed in the Edge Function.
DROP FUNCTION IF EXISTS public.dev_request_school_email_verification_code(
  uuid, text, text, integer, text, text
);
