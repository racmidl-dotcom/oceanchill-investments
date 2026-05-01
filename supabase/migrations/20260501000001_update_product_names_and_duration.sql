-- Update product names VIP1..VIP7 and set duration to 60 days
UPDATE public.products
SET name = CASE name
  WHEN 'VIP1' THEN 'Starter'
  WHEN 'VIP2' THEN 'Basic'
  WHEN 'VIP3' THEN 'Standard'
  WHEN 'VIP4' THEN 'Silver'
  WHEN 'VIP5' THEN 'Gold'
  WHEN 'VIP6' THEN 'Premium'
  WHEN 'VIP7' THEN 'Vip'
  ELSE name
END,
    duration_days = CASE
      WHEN name IN ('VIP1','VIP2','VIP3','VIP4','VIP5','VIP6','VIP7') THEN 60
      ELSE duration_days
    END
WHERE name IN ('VIP1','VIP2','VIP3','VIP4','VIP5','VIP6','VIP7');
