import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
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
  cancelOrder: (orderId: string) => void;
  addMoreItems: (orderId: string, items: CartItem[]) => void;
  markBillSent: (orderId: string) => void;
  updateMenuItemAR: (menuItemId: string, arModelUrl: string) => Promise<void>;
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
    createdAt: new Date(row.created_at),
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
  }, [isAdmin, fetchOrders]);

  const toggleMenuAvailability = useCallback(async (id: string) => {
    const item = menu.find(m => m.id === id);
    if (!item) return;
    setMenu(prev => prev.map(m => m.id === id ? { ...m, available: !m.available } : m));
    await supabase.from('menu_items').update({ available: !item.available }).eq('id', id);
  }, [menu]);

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
      console.error('Failed to create order:', orderError);
      throw new Error('Failed to create order');
    }

    const orderItems = items.map(i => ({
      order_id: orderData.id,
      menu_item_id: i.menuItem.id,
      item_name: i.menuItem.name,
      item_price: i.menuItem.price,
      quantity: i.quantity,
      is_additional: false,
    }));
    await supabase.from('order_items').insert(orderItems);

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
    setDbOrderMap(prev => ({ ...prev, [orderNumber]: orderData.id }));

    return { orderNumber, pickupPin };
  }, [user]);

  const updateOrderStatus = useCallback(async (orderNumber: string, status: string) => {
    setOrders(prev => prev.map(o => o.id === orderNumber ? { ...o, status: status as any } : o));
    const dbId = dbOrderMap[orderNumber];
    if (dbId) {
      await supabase.from('orders').update({ status }).eq('id', dbId);
    }
  }, [dbOrderMap]);

  const confirmOrder = useCallback((id: string) => { updateOrderStatus(id, 'confirmed'); }, [updateOrderStatus]);
  const rejectOrder = useCallback((id: string) => { updateOrderStatus(id, 'rejected'); }, [updateOrderStatus]);
  const markReady = useCallback((id: string) => { updateOrderStatus(id, 'ready'); }, [updateOrderStatus]);
  const markNoShow = useCallback((id: string) => { updateOrderStatus(id, 'no_show'); }, [updateOrderStatus]);
  const cancelOrder = useCallback((id: string) => { updateOrderStatus(id, 'cancelled'); }, [updateOrderStatus]);

  const addMoreItems = useCallback(async (orderId: string, items: CartItem[]) => {
    const additionalTotal = items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      return { ...o, additionalRequests: [...o.additionalRequests, ...items], totalAmount: o.totalAmount + additionalTotal };
    }));

    const dbId = dbOrderMap[orderId];
    if (dbId) {
      const orderItems = items.map(i => ({
        order_id: dbId,
        menu_item_id: i.menuItem.id,
        item_name: i.menuItem.name,
        item_price: i.menuItem.price,
        quantity: i.quantity,
        is_additional: true,
      }));
      await supabase.from('order_items').insert(orderItems);
      const order = orders.find(o => o.id === orderId);
      if (order) {
        await supabase.from('orders').update({ total_amount: order.totalAmount + additionalTotal }).eq('id', dbId);
      }
    }
  }, [dbOrderMap, orders]);

  const markBillSent = useCallback(async (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, billSent: true } : o));
    const dbId = dbOrderMap[orderId];
    if (dbId) {
      await supabase.from('orders').update({ bill_sent: true }).eq('id', dbId);
    }
  }, [dbOrderMap]);

  const updateMenuItemAR = useCallback(async (menuItemId: string, arModelUrl: string) => {
    setMenu(prev => prev.map(m => m.id === menuItemId ? { ...m, ar_model_url: arModelUrl } : m));
    await (supabase.from('menu_items') as any).update({ ar_model_url: arModelUrl }).eq('id', menuItemId);
  }, []);

  const topItems = orders.length > 0 ? (() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      [...o.items, ...o.additionalRequests].forEach(i => {
        counts[i.menuItem.name] = (counts[i.menuItem.name] || 0) + i.quantity;
      });
    });
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, count]) => ({ name, count }));
  })() : [];

  return (
    <OrderContext.Provider value={{
      menu, orders, menuLoading, toggleMenuAvailability, placeOrder, confirmOrder,
      rejectOrder, markReady, markNoShow, addMoreItems, markBillSent, updateMenuItemAR,
      salesData: MOCK_SALES, topItems,
    }}>
      {children}
    </OrderContext.Provider>
  );
};
