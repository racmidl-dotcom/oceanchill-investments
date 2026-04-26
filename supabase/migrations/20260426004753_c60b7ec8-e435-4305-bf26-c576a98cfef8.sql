-- 1. Ajouter colonne is_promoter sur users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_promoter boolean NOT NULL DEFAULT false;

-- 2. Mettre à jour handle_new_user pour octroyer 500F de bonus à l'inscription
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
  RETURN NEW;
END;
$function$;

-- Attacher le trigger sur auth.users si pas déjà fait
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Trigger sur investments: créer commissions de parrainage SAUF si l'investisseur est promoteur
-- Taux: niveau 1 = 12%, niveau 2 = 3%, niveau 3 = 1%
CREATE OR REPLACE FUNCTION public.handle_investment_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_promoter boolean;
  v_l1 uuid;
  v_l2 uuid;
  v_l3 uuid;
  v_comm numeric;
BEGIN
  -- Si l'investisseur est lui-même promoteur, AUCUNE commission n'est versée à ses parrains
  SELECT is_promoter INTO v_is_promoter FROM public.users WHERE id = NEW.user_id;
  IF v_is_promoter THEN
    RETURN NEW;
  END IF;

  -- Niveau 1
  SELECT referred_by INTO v_l1 FROM public.users WHERE id = NEW.user_id;
  IF v_l1 IS NOT NULL THEN
    v_comm := NEW.amount * 0.12;
    INSERT INTO public.referrals (referrer_id, referred_id, level, commission)
    VALUES (v_l1, NEW.user_id, 1, v_comm);
    UPDATE public.users SET balance = balance + v_comm, total_revenue = total_revenue + v_comm WHERE id = v_l1;

    -- Niveau 2
    SELECT referred_by INTO v_l2 FROM public.users WHERE id = v_l1;
    IF v_l2 IS NOT NULL THEN
      v_comm := NEW.amount * 0.03;
      INSERT INTO public.referrals (referrer_id, referred_id, level, commission)
      VALUES (v_l2, NEW.user_id, 2, v_comm);
      UPDATE public.users SET balance = balance + v_comm, total_revenue = total_revenue + v_comm WHERE id = v_l2;

      -- Niveau 3
      SELECT referred_by INTO v_l3 FROM public.users WHERE id = v_l2;
      IF v_l3 IS NOT NULL THEN
        v_comm := NEW.amount * 0.01;
        INSERT INTO public.referrals (referrer_id, referred_id, level, commission)
        VALUES (v_l3, NEW.user_id, 3, v_comm);
        UPDATE public.users SET balance = balance + v_comm, total_revenue = total_revenue + v_comm WHERE id = v_l3;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_investment_created ON public.investments;
CREATE TRIGGER on_investment_created
  AFTER INSERT ON public.investments
  FOR EACH ROW EXECUTE FUNCTION public.handle_investment_commission();