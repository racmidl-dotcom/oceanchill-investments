-- Atomic purchase and withdrawal to ensure balance is debited reliably

CREATE OR REPLACE FUNCTION public.purchase_product(p_product_id UUID)
RETURNS TABLE (investment_id UUID, new_balance NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_product RECORD;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO v_product
  FROM public.products
  WHERE id = p_product_id
    AND active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'product not found';
  END IF;

  UPDATE public.users
  SET balance = balance - v_product.price
  WHERE id = v_user
    AND balance >= v_product.price
  RETURNING balance INTO new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'insufficient balance';
  END IF;

  INSERT INTO public.investments (
    user_id,
    product_id,
    amount,
    daily_revenue,
    total_revenue,
    end_date
  ) VALUES (
    v_user,
    v_product.id,
    v_product.price,
    v_product.daily_revenue,
    v_product.total_revenue,
    now() + (v_product.duration_days || ' days')::interval
  )
  RETURNING id INTO investment_id;

  RETURN QUERY SELECT investment_id, new_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_withdrawal(
  p_amount NUMERIC,
  p_fee NUMERIC,
  p_net_amount NUMERIC,
  p_operator TEXT,
  p_phone TEXT
)
RETURNS TABLE (withdrawal_id UUID, new_balance NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  UPDATE public.users
  SET balance = balance - p_amount
  WHERE id = v_user
    AND balance >= p_amount
  RETURNING balance INTO new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'insufficient balance';
  END IF;

  INSERT INTO public.withdrawals (
    user_id,
    amount,
    fee,
    net_amount,
    operator,
    phone
  ) VALUES (
    v_user,
    p_amount,
    p_fee,
    p_net_amount,
    p_operator,
    p_phone
  )
  RETURNING id INTO withdrawal_id;

  RETURN QUERY SELECT withdrawal_id, new_balance;
END;
$$;
