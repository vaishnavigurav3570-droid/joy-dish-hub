
-- Fix orders insert policy: drop restrictive, create permissive
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders
FOR INSERT TO public
WITH CHECK (true);

-- Fix order_items insert policy: drop restrictive, create permissive
DROP POLICY IF EXISTS "Insert order items" ON public.order_items;
CREATE POLICY "Insert order items" ON public.order_items
FOR INSERT TO public
WITH CHECK (true);

-- Also fix the select policies to be permissive
DROP POLICY IF EXISTS "View order items" ON public.order_items;
CREATE POLICY "View order items" ON public.order_items
FOR SELECT TO public
USING (true);

-- Fix orders select for guest users (customers without login)
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
CREATE POLICY "Customers can view own orders" ON public.orders
FOR SELECT TO public
USING (true);

-- Fix staff update policy
DROP POLICY IF EXISTS "Staff can update orders" ON public.orders;
CREATE POLICY "Staff can update orders" ON public.orders
FOR UPDATE TO public
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'worker'::app_role));

-- Fix menu select policy
DROP POLICY IF EXISTS "Anyone can view menu" ON public.menu_items;
CREATE POLICY "Anyone can view menu" ON public.menu_items
FOR SELECT TO public
USING (true);

-- Fix menu manage policy
DROP POLICY IF EXISTS "Owners can manage menu" ON public.menu_items;
CREATE POLICY "Owners can manage menu" ON public.menu_items
FOR ALL TO public
USING (has_role(auth.uid(), 'owner'::app_role));
