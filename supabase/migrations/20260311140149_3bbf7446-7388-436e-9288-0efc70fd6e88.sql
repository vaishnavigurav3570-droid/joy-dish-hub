
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type text NOT NULL DEFAULT 'dine-in';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_pin text;
