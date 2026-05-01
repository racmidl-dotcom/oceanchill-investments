-- Create referral rows on signup and allow referrers to read investments
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_phone TEXT;
  v_country TEXT;
  v_ref TEXT;
  v_referrer UUID;
  v_ref_code_input TEXT;
  v_l2 UUID;
  v_l3 UUID;
BEGIN
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.email);
  v_country := COALESCE(NEW.raw_user_meta_data->>'country', 'BF');
  v_ref_code_input := NEW.raw_user_meta_data->>'ref_code';
  v_ref := upper(substr(md5(random()::text || NEW.id::text), 1, 6));

  IF v_ref_code_input IS NOT NULL AND length(v_ref_code_input) > 0 THEN
    SELECT id INTO v_referrer FROM public.users WHERE ref_code = upper(v_ref_code_input) LIMIT 1;
  END IF;

  -- Bonus d'inscription 500F
  INSERT INTO public.users (id, phone, country, ref_code, referred_by, balance)
  VALUES (NEW.id, v_phone, v_country, v_ref, v_referrer, 500);

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  -- Enregistrer les liens de parrainage des l'inscription (commission = 0)
  IF v_referrer IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_id, level, commission)
    VALUES (v_referrer, NEW.id, 1, 0);

    SELECT referred_by INTO v_l2 FROM public.users WHERE id = v_referrer;
    IF v_l2 IS NOT NULL THEN
      INSERT INTO public.referrals (referrer_id, referred_id, level, commission)
      VALUES (v_l2, NEW.id, 2, 0);

      SELECT referred_by INTO v_l3 FROM public.users WHERE id = v_l2;
      IF v_l3 IS NOT NULL THEN
        INSERT INTO public.referrals (referrer_id, referred_id, level, commission)
        VALUES (v_l3, NEW.id, 3, 0);
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Backfill referral rows for existing users
INSERT INTO public.referrals (referrer_id, referred_id, level, commission)
SELECT u.referred_by, u.id, 1, 0
FROM public.users u
WHERE u.referred_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.referrals r
    WHERE r.referrer_id = u.referred_by
      AND r.referred_id = u.id
      AND r.level = 1
  );

INSERT INTO public.referrals (referrer_id, referred_id, level, commission)
SELECT p.referred_by, u.id, 2, 0
FROM public.users u
JOIN public.users p ON p.id = u.referred_by
WHERE p.referred_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.referrals r
    WHERE r.referrer_id = p.referred_by
      AND r.referred_id = u.id
      AND r.level = 2
  );

INSERT INTO public.referrals (referrer_id, referred_id, level, commission)
SELECT gp.referred_by, u.id, 3, 0
FROM public.users u
JOIN public.users p ON p.id = u.referred_by
JOIN public.users gp ON gp.id = p.referred_by
WHERE gp.referred_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.referrals r
    WHERE r.referrer_id = gp.referred_by
      AND r.referred_id = u.id
      AND r.level = 3
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'investments'
      AND policyname = 'referrer reads investments'
  ) THEN
    CREATE POLICY "referrer reads investments" ON public.investments
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.referrals r
          WHERE r.referrer_id = auth.uid()
            AND r.referred_id = investments.user_id
        )
      );
  END IF;
END $$;
