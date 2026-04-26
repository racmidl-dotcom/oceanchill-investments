
-- Roles enum + table (security best practice)
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Users profile
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL DEFAULT 'BF',
  ref_code TEXT NOT NULL UNIQUE,
  referred_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user reads self" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "user updates self" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "user inserts self" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "admins read users" ON public.users FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update users" ON public.users FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT,
  price NUMERIC(14,2) NOT NULL,
  duration_days INTEGER NOT NULL,
  daily_revenue NUMERIC(14,2) NOT NULL,
  total_revenue NUMERIC(14,2) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all read active products" ON public.products FOR SELECT USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage products" ON public.products FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Investments
CREATE TABLE public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  amount NUMERIC(14,2) NOT NULL,
  daily_revenue NUMERIC(14,2) NOT NULL,
  total_revenue NUMERIC(14,2) NOT NULL,
  earned NUMERIC(14,2) NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user own investments" ON public.investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user create investments" ON public.investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins all investments" ON public.investments FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Deposits
CREATE TABLE public.deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  channel TEXT NOT NULL DEFAULT 'channel_1',
  reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user own deposits" ON public.deposits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user create deposit" ON public.deposits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins all deposits" ON public.deposits FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Withdrawals
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  fee NUMERIC(14,2) NOT NULL,
  net_amount NUMERIC(14,2) NOT NULL,
  operator TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user own wd" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user create wd" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins all wd" ON public.withdrawals FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Referrals
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  commission NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user own refs" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "admins all refs" ON public.referrals FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Bank accounts
CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  operator TEXT NOT NULL,
  phone TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user own bank" ON public.bank_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "admins read bank" ON public.bank_accounts FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Announcements
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all read announcements" ON public.announcements FOR SELECT USING (active);
CREATE POLICY "admins manage announcements" ON public.announcements FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trigger : créer profil + role à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

  INSERT INTO public.users (id, phone, country, ref_code, referred_by)
  VALUES (NEW.id, v_phone, v_country, v_ref, v_referrer);

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER users_touch BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed produits VIP1-VIP10 (réfrigérateurs)
INSERT INTO public.products (name, price, duration_days, daily_revenue, total_revenue, sort_order, image_url) VALUES
('VIP1', 2000, 90, 80, 7200, 1, 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400'),
('VIP2', 5000, 90, 220, 19800, 2, 'https://images.unsplash.com/photo-1536353284924-9220c464e262?w=400'),
('VIP3', 10000, 90, 470, 42300, 3, 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400'),
('VIP4', 20000, 90, 980, 88200, 4, 'https://images.unsplash.com/photo-1601599561213-832382fd07ba?w=400'),
('VIP5', 50000, 90, 2550, 229500, 5, 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400'),
('VIP6', 100000, 90, 5300, 477000, 6, 'https://images.unsplash.com/photo-1536353284924-9220c464e262?w=400'),
('VIP7', 200000, 90, 11000, 990000, 7, 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400'),
('VIP8', 500000, 90, 28000, 2520000, 8, 'https://images.unsplash.com/photo-1601599561213-832382fd07ba?w=400'),
('VIP9', 1000000, 90, 58000, 5220000, 9, 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400'),
('VIP10', 2000000, 90, 120000, 10800000, 10, 'https://images.unsplash.com/photo-1536353284924-9220c464e262?w=400');

INSERT INTO public.announcements (message) VALUES
('🎉 Bienvenue sur OceanProfit – la 1ère plateforme d''investissement dans la vente de réfrigérateurs en Afrique de l''Ouest'),
('💰 Bonus de parrainage NIV1 : 15% sur chaque dépôt confirmé');
