import fs from 'fs';

const content = fs.readFileSync('src/context/OrderContext.tsx', 'utf8');

let newContent = content.replace(
  `import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';`,
  `import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';\nimport { useQuery, useQueryClient } from '@tanstack/react-query';`
);

newContent = newContent.replace(
  `  const { user, role } = useAuth();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [dbOrderMap, setDbOrderMap] = useState<Record<string, string>>({});

  const isAdmin = user && (role === 'worker' || role === 'owner');

  useEffect(() => {
    const fetchMenu = async () => {
      const { data } = await supabase.from('menu_items').select('*').order('category');
      if (data && data.length > 0) {
        setMenu(data.map(mapMenuItem));
      }
      setMenuLoading(false);
    };
    fetchMenu();
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!isAdmin) return;
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*, menu_items(*))')
      .order('created_at', { ascending: false });

    if (data) {
      setOrders(data.map(mapOrder));
      const idMap: Record<string, string> = {};
      data.forEach((row: any) => { idMap[row.order_number] = row.id; });
      setDbOrderMap(idMap);
    }
  }, [isAdmin]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, fetchOrders]);`,
  `  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [dbOrderMap, setDbOrderMap] = useState<Record<string, string>>({});

  const isAdmin = user && (role === 'worker' || role === 'owner');

  const { data: menuData, isLoading: menuLoading } = useQuery({
    queryKey: ['menu'],
    queryFn: async () => {
      const { data } = await supabase.from('menu_items').select('*').order('category');
      return data ? data.map(mapMenuItem) : [];
    }
  });

  const { data: ordersData } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      if (!isAdmin) return [];
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*, menu_items(*))')
        .order('created_at', { ascending: false });

      if (data) {
        const idMap: Record<string, string> = {};
        data.forEach((row: any) => { idMap[row.order_number] = row.id; });
        setDbOrderMap(idMap);
        return data.map(mapOrder);
      }
      return [];
    },
    enabled: !!isAdmin
  });

  const menu = menuData || [];
  const orders = ordersData || [];

  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => queryClient.invalidateQueries({ queryKey: ['orders'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => queryClient.invalidateQueries({ queryKey: ['orders'] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, queryClient]);`
);

// Replace setMenu inside toggleMenuAvailability
newContent = newContent.replace(
  `setMenu(prev => prev.map(m => m.id === id ? { ...m, available: !m.available } : m));`,
  `queryClient.setQueryData(['menu'], (prev: any) => prev?.map((m: any) => m.id === id ? { ...m, available: !m.available } : m) || []);`
);

// Replace setOrders(...[order, ...prev]) in placeOrder
newContent = newContent.replace(
  `setOrders(prev => [order, ...prev]);`,
  `queryClient.setQueryData(['orders'], (prev: any) => [order, ...(prev || [])]);`
);

// Replace setOrders map inside updateOrderStatus
newContent = newContent.replace(
  /setOrders\(prev => prev.map\(o => o.id === orderNumber \? { \.\.\.o, status: status as any } : o\)\);/g,
  `queryClient.setQueryData(['orders'], (prev: any) => prev?.map((o: any) => o.id === orderNumber ? { ...o, status: status as any } : o) || []);`
);

// Replace setOrders inside addMoreItems
newContent = newContent.replace(
  `setOrders(prev => prev.map(o => {`,
  `queryClient.setQueryData(['orders'], (prev: any) => prev?.map((o: any) => {`
);

// Replace setOrders inside markBillSent
newContent = newContent.replace(
  /setOrders\(prev => prev.map\(o => o.id === orderId \? \{ \.\.\.o, billSent: true \} : o\)\);/g,
  `queryClient.setQueryData(['orders'], (prev: any) => prev?.map((o: any) => o.id === orderId ? { ...o, billSent: true } : o) || []);`
);

fs.writeFileSync('src/context/OrderContext.tsx', newContent);
console.log('Success');
