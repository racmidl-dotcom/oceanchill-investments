-- Allow users to read profiles of their direct referrals
CREATE POLICY "user reads referrals" ON public.users
  FOR SELECT
  USING (referred_by = auth.uid());
