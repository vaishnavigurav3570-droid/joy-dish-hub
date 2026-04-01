
-- Allow owners to delete orders
CREATE POLICY "Owners can delete orders"
ON public.orders
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'::app_role));

-- Allow owners to delete order_items
CREATE POLICY "Owners can delete order items"
ON public.order_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
    AND public.has_role(auth.uid(), 'owner'::app_role)
  )
);
