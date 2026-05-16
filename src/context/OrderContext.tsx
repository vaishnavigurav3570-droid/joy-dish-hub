/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MenuItem, Order, CartItem, OrderType } from '@/types/order';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

const MOCK_SALES = [
  { date: '2026-02-19', revenue: 12400, orders: 34 },
  { date: '2026-02-20', revenue: 15800, orders: 42 },
  { date: '2026-02-21', revenue: 9200, orders: 25 },
  { date: '2026-02-22', revenue: 18600, orders: 51 },
  { date: '2026-02-23', revenue: 21000, orders: 58 },
  { date: '2026-02-24', revenue: 16400, orders: 45 },
  { date: '2026-02-25', revenue: 14200, orders: 39 },
];

const DEFAULT_MENU: MenuItem[] = [
  { id: 'm1', name: 'Butter Chicken', price: 320, category: 'Main Course', emoji: '🍛', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop', available: true },
  { id: 'm2', name: 'Paneer Tikka', price: 250, category: 'Starters', emoji: '🧀', image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop', available: true },
  { id: 'm3', name: 'Chicken Biryani', price: 280, category: 'Rice', emoji: '🍚', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop', available: true },
  { id: 'm4', name: 'Dal Makhani', price: 200, category: 'Main Course', emoji: '🍲', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop', available: true },
  { id: 'm5', name: 'Naan', price: 50, category: 'Breads', emoji: '🫓', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop', available: true },
  { id: 'm6', name: 'Tandoori Roti', price: 30, category: 'Breads', emoji: '🫓', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop', available: true },
  { id: 'm7', name: 'Gulab Jamun', price: 100, category: 'Desserts', emoji: '🍩', image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=400&h=300&fit=crop', available: true },
  { id: 'm8', name: 'Masala Chai', price: 40, category: 'Beverages', emoji: '☕', image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&h=300&fit=crop', available: true },
  { id: 'm9', name: 'Lassi', price: 80, category: 'Beverages', emoji: '🥛', image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400&h=300&fit=crop', available: true },
  { id: 'm10', name: 'Veg Manchurian', price: 180, category: 'Starters', emoji: '🥟', image: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400&h=300&fit=crop', available: true },
  { id: 'm11', name: 'Fish Fry', price: 300, category: 'Starters', emoji: '🐟', image: 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&h=300&fit=crop', available: false },
  { id: 'm12', name: 'Mutton Rogan Josh', price: 400, category: 'Main Course', emoji: '🥩', image: 'https://images.unsplash.com/photo-1545247181-516773cae754?w=400&h=300&fit=crop', available: true }
];

interface OrderContextType {
  menu: MenuItem[];
  orders: Order[];
  menuLoading: boolean;
  toggleMenuAvailability: (id: string) => void;
  placeOrder: (items: CartItem[], tableNumber: number, phone: string, customerName: string, orderType: OrderType) => Promise<{ orderNumber: string; pickupPin: string | null }>;
  confirmOrder: (orderId: string) => void;
  rejectOrder: (orderId: string) => void;
  markReady: (orderId: string) => void;
  markNoShow: (orderId: string) => void;
  cancelOrder: (orderId: string) => Promise<void>;
  addMoreItems: (orderId: string, items: CartItem[]) => Promise<void>;
  markBillSent: (orderId: string) => void;
  updateMenuItemAR: (menuItemId: string, arModelUrl: string) => Promise<void>;
  refreshOrders: () => Promise<void>;
  salesData: typeof MOCK_SALES;
  topItems: { name: string; count: number }[];
}

const OrderContext = createContext<OrderContextType | null>(null);

export const useOrders = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrders must be used within OrderProvider');
  return ctx;
};

const mapMenuItem = (row: any): MenuItem => ({
  id: row.id,
  name: row.name,
  price: Number(row.price),
  category: row.category,
  available: row.available,
  emoji: row.emoji || '🍽️',
  image: row.image_url || '',
  ar_model_url: row.ar_model_url || null,
});

const mapOrder = (row: any): Order => {
  const orderItems: CartItem[] = [];
  const additionalRequests: CartItem[] = [];

  (row.order_items || []).forEach((oi: any) => {
    const menuItem: MenuItem = oi.menu_items
      ? mapMenuItem(oi.menu_items)
      : {
          id: oi.menu_item_id,
          name: oi.item_name,
          price: Number(oi.item_price),
          category: '',
          available: true,
          emoji: '🍽️',
          image: '',
        };

    const cartItem: CartItem = { menuItem, quantity: oi.quantity };
    if (oi.is_additional) {
      additionalRequests.push(cartItem);
    } else {
      orderItems.push(cartItem);
    }
  });

  return {
    id: row.order_number,
    tableNumber: row.table_number,
    items: orderItems,
    status: row.status,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    userPhone: row.customer_phone,
    customerName: row.customer_name || '',
    totalAmount: Number(row.total_amount),
    billSent: row.bill_sent,
    additionalRequests,
    orderType: row.order_type || 'dine-in',
    pickupPin: row.pickup_pin || null,
  };
};

const generatePickupPin = (): string => {
  return String(Math.floor(1000 + Math.random() * 9000));
};

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [dbOrderMap, setDbOrderMap] = useState<Record<string, string>>({});
  // Ref always holds the latest dbOrderMap so callbacks never use stale closures
  const dbOrderMapRef = useRef<Record<string, string>>({});

  const isAdmin = user && (role === 'worker' || role === 'owner');

  // ── Menu via React Query ──
  const { data: menuData = [], isLoading: menuLoading } = useQuery({
    queryKey: ['menu'],
    queryFn: async () => {
      const { data, error } = await supabase.from('menu_items').select('*').order('category');
      if (error || !data || data.length === 0) {
        console.warn('Supabase menu fetch failed/empty, using fallback menu data');
        return DEFAULT_MENU;
      }
      return data.map(mapMenuItem);
    },
  });
  const menu = menuData;

  // ── Orders via manual fetch (complex optimistic update pattern) ──
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
      dbOrderMapRef.current = idMap;
    }
  }, [isAdmin]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    if (!isAdmin) return;
    // Debounce realtime refetches to prevent excessive API calls on busy days
    let timer: ReturnType<typeof setTimeout> | null = null;
    const debouncedFetch = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fetchOrders(), 500);
    };
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, debouncedFetch)
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [isAdmin, fetchOrders]);

  const toggleMenuAvailability = useCallback(async (id: string) => {
    const item = menu.find(m => m.id === id);
    if (!item) return;
    queryClient.setQueryData(['menu'], (prev: any) => prev?.map((m: any) => m.id === id ? { ...m, available: !m.available } : m) || []);
    const { error } = await supabase.from('menu_items').update({ available: !item.available }).eq('id', id);
    if (error) {
      // Rollback optimistic update on failure
      queryClient.setQueryData(['menu'], (prev: any) => prev?.map((m: any) => m.id === id ? { ...m, available: item.available } : m) || []);
      console.error('Toggle availability failed:', error.message);
    }
  }, [menu, queryClient]);

  const placeOrder = useCallback(async (
    items: CartItem[], tableNumber: number, phone: string, customerName: string, orderType: OrderType
  ): Promise<{ orderNumber: string; pickupPin: string | null }> => {
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const totalAmount = items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
    const pickupPin = orderType === 'preorder' ? generatePickupPin() : null;

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        table_number: tableNumber,
        customer_phone: phone,
        total_amount: totalAmount,
        status: 'pending',
        customer_name: customerName,
        order_type: orderType,
        pickup_pin: pickupPin,
        customer_user_id: user?.id || null,
      } as any)
      .select('id')
      .single();

    if (orderError || !orderData) {
      console.error('Failed to create order:', orderError?.message, orderError?.code, orderError?.details, orderError?.hint);
      throw new Error(`Failed to create order: ${orderError?.message || 'Unknown error'}`);
    }

    const orderItems = items.map(i => ({
      order_id: orderData.id,
      menu_item_id: i.menuItem.id,
      item_name: i.menuItem.name,
      item_price: i.menuItem.price,
      quantity: i.quantity,
      is_additional: false,
    }));
    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) {
      console.error('Failed to insert order items:', itemsError.message);
      // Clean up the orphaned order
      await supabase.from('orders').delete().eq('id', orderData.id);
      throw new Error(`Failed to save order items: ${itemsError.message}`);
    }

    const order: Order = {
      id: orderNumber,
      tableNumber,
      items,
      status: 'pending',
      createdAt: new Date(),
      userPhone: phone,
      customerName,
      totalAmount,
      billSent: false,
      additionalRequests: [],
      orderType,
      pickupPin,
    };
    setOrders(prev => [order, ...prev]);
    const newMap = { ...dbOrderMapRef.current, [orderNumber]: orderData.id };
    setDbOrderMap(newMap);
    dbOrderMapRef.current = newMap;

    return { orderNumber, pickupPin };
  }, [user]);

  const updateOrderStatus = useCallback(async (orderNumber: string, status: string) => {
    const prevOrders = orders;
    setOrders(prev => prev.map(o => o.id === orderNumber ? { ...o, status: status as any } : o));
    const dbId = dbOrderMapRef.current[orderNumber];
    if (dbId) {
      const { error } = await supabase.from('orders').update({ status }).eq('id', dbId);
      if (error) {
        console.error('UPDATE order status failed:', error.message, error.code, error.details);
        // Rollback optimistic update
        setOrders(prevOrders);
        throw new Error(`Failed to update order status: ${error.message}`);
      }
    } else {
      console.warn('No dbId found for order:', orderNumber);
    }
  }, [orders]);

  const confirmOrder = useCallback((id: string) => { updateOrderStatus(id, 'confirmed'); }, [updateOrderStatus]);
  const rejectOrder = useCallback((id: string) => { updateOrderStatus(id, 'rejected'); }, [updateOrderStatus]);
  const markReady = useCallback((id: string) => { updateOrderStatus(id, 'ready'); }, [updateOrderStatus]);
  const markNoShow = useCallback((id: string) => { updateOrderStatus(id, 'no_show'); }, [updateOrderStatus]);
  const cancelOrder = useCallback((id: string) => updateOrderStatus(id, 'cancelled'), [updateOrderStatus]);

  const addMoreItems = useCallback(async (orderId: string, items: CartItem[]) => {
    const additionalTotal = items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);

    // Compute newTotal from current state synchronously before any async work
    let newTotal = 0;
    setOrders(prev => {
      const updated = prev.map(o => {
        if (o.id !== orderId) return o;
        newTotal = o.totalAmount + additionalTotal;
        return { ...o, additionalRequests: [...o.additionalRequests, ...items], totalAmount: newTotal };
      });
      return updated;
    });

    const dbId = dbOrderMapRef.current[orderId];
    if (dbId) {
      const orderItems = items.map(i => ({
        order_id: dbId,
        menu_item_id: i.menuItem.id,
        item_name: i.menuItem.name,
        item_price: i.menuItem.price,
        quantity: i.quantity,
        is_additional: true,
      }));
      const { error: insertError } = await supabase.from('order_items').insert(orderItems);
      if (insertError) {
        console.error('Failed to insert additional items:', insertError.message);
        // Rollback the optimistic local state update by removing the last N items added
        const rollbackCount = items.length;
        setOrders(prev => prev.map(o => {
          if (o.id !== orderId) return o;
          return {
            ...o,
            additionalRequests: o.additionalRequests.slice(0, -rollbackCount),
            totalAmount: o.totalAmount - additionalTotal,
          };
        }));
        throw new Error('Failed to add items. Please try again.');
      }
      if (newTotal > 0) {
        await supabase.from('orders').update({ total_amount: newTotal }).eq('id', dbId);
      }
    }
  }, []);

  const markBillSent = useCallback(async (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, billSent: true, status: 'completed' } : o));
    const dbId = dbOrderMapRef.current[orderId];
    if (dbId) {
      const { error } = await supabase.from('orders').update({ bill_sent: true, status: 'completed' }).eq('id', dbId);
      if (error) {
        console.error('UPDATE markBillSent failed:', error.message, error.code, error.details);
        // Rollback optimistic update
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, billSent: false, status: 'ready' } : o));
      }
    } else {
      console.warn('No dbId found for markBillSent:', orderId);
    }
  }, []);

  const updateMenuItemAR = useCallback(async (menuItemId: string, arModelUrl: string) => {
    queryClient.setQueryData(['menu'], (prev: any) => prev?.map((m: any) => m.id === menuItemId ? { ...m, ar_model_url: arModelUrl } : m) || []);
    try {
      const { error } = await (supabase.from('menu_items') as any).update({ ar_model_url: arModelUrl }).eq('id', menuItemId);
      if (error) console.warn('Supabase DB update skipped:', error.message);
    } catch { /* ignore */ }
  }, [queryClient]);

  const topItems = useMemo(() => {
    if (orders.length === 0) return [];
    const counts: Record<string, number> = {};
    orders
      .filter(o => o.status !== 'rejected' && o.status !== 'cancelled' && o.status !== 'no_show')
      .forEach(o => {
        [...o.items, ...o.additionalRequests].forEach(i => {
          counts[i.menuItem.name] = (counts[i.menuItem.name] || 0) + i.quantity;
        });
      });
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, count]) => ({ name, count }));
  }, [orders]);

  return (
    <OrderContext.Provider value={{
      menu, orders, menuLoading, toggleMenuAvailability, placeOrder, confirmOrder,
      rejectOrder, markReady, markNoShow, cancelOrder, addMoreItems, markBillSent, updateMenuItemAR,
      refreshOrders: fetchOrders,
      salesData: MOCK_SALES, topItems,
    }}>
      {children}
    </OrderContext.Provider>
  );
};
