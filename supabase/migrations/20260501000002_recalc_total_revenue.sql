-- Recalculate total_revenue using daily_revenue * duration_days
UPDATE public.products
SET total_revenue = daily_revenue * duration_days;
