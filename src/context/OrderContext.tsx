import React, { createContext, useContext, useState, useCallback } from 'react';
import { MenuItem, Order, CartItem } from '@/types/order';

const DEFAULT_MENU: MenuItem[] = [
  { id: '1', name: 'Butter Chicken', price: 320, category: 'Main Course', available: true, emoji: '🍛', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop' },
  { id: '2', name: 'Paneer Tikka', price: 250, category: 'Starters', available: true, emoji: '🧀', image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop' },
  { id: '3', name: 'Chicken Biryani', price: 280, category: 'Rice', available: true, emoji: '🍚', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop' },
  { id: '4', name: 'Dal Makhani', price: 200, category: 'Main Course', available: true, emoji: '🍲', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop' },
  { id: '5', name: 'Naan', price: 50, category: 'Breads', available: true, emoji: '🫓', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop' },
  { id: '6', name: 'Tandoori Roti', price: 30, category: 'Breads', available: true, emoji: '🫓', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop' },
  { id: '7', name: 'Gulab Jamun', price: 100, category: 'Desserts', available: true, emoji: '🍩', image: 'https://images.unsplash.com/photo-1666190070736-c956240tried?w=400&h=300&fit=crop' },
  { id: '8', name: 'Masala Chai', price: 40, category: 'Beverages', available: true, emoji: '☕', image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&h=300&fit=crop' },
  { id: '9', name: 'Lassi', price: 80, category: 'Beverages', available: true, emoji: '🥛', image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400&h=300&fit=crop' },
  { id: '10', name: 'Veg Manchurian', price: 180, category: 'Starters', available: true, emoji: '🥟', image: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400&h=300&fit=crop' },
  { id: '11', name: 'Fish Fry', price: 300, category: 'Starters', available: false, emoji: '🐟', image: 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&h=300&fit=crop' },
  { id: '12', name: 'Mutton Rogan Josh', price: 400, category: 'Main Course', available: true, emoji: '🥩', image: 'https://images.unsplash.com/photo-1545247181-516773cae754?w=400&h=300&fit=crop' },
];

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
  toggleMenuAvailability: (id: string) => void;
  placeOrder: (items: CartItem[], tableNumber: number, phone: string, customerName: string) => string;
  confirmOrder: (orderId: string) => void;
  rejectOrder: (orderId: string) => void;
  markReady: (orderId: string) => void;
  addMoreItems: (orderId: string, items: CartItem[]) => void;
  markBillSent: (orderId: string) => void;
  salesData: typeof MOCK_SALES;
  topItems: { name: string; count: number }[];
}

const OrderContext = createContext<OrderContextType | null>(null);

export const useOrders = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrders must be used within OrderProvider');
  return ctx;
};

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menu, setMenu] = useState<MenuItem[]>(DEFAULT_MENU);
  const [orders, setOrders] = useState<Order[]>([]);

  const toggleMenuAvailability = useCallback((id: string) => {
    setMenu(prev => prev.map(item => item.id === id ? { ...item, available: !item.available } : item));
  }, []);

  const placeOrder = useCallback((items: CartItem[], tableNumber: number, phone: string, customerName: string) => {
    const id = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const totalAmount = items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
    const order: Order = {
      id,
      tableNumber,
      items,
      status: 'pending',
      createdAt: new Date(),
      userPhone: phone,
      customerName,
      totalAmount,
      billSent: false,
      additionalRequests: [],
    };
    setOrders(prev => [order, ...prev]);
    return id;
  }, []);

  const confirmOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'confirmed' as const } : o));
  }, []);

  const rejectOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'rejected' as const } : o));
  }, []);

  const markReady = useCallback((orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'ready' as const } : o));
  }, []);

  const addMoreItems = useCallback((orderId: string, items: CartItem[]) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const additionalTotal = items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
      return {
        ...o,
        additionalRequests: [...o.additionalRequests, ...items],
        totalAmount: o.totalAmount + additionalTotal,
      };
    }));
  }, []);

  const markBillSent = useCallback((orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, billSent: true } : o));
  }, []);

  const topItems = [
    { name: 'Butter Chicken', count: 156 },
    { name: 'Chicken Biryani', count: 142 },
    { name: 'Paneer Tikka', count: 98 },
    { name: 'Naan', count: 234 },
    { name: 'Masala Chai', count: 189 },
  ];

  return (
    <OrderContext.Provider value={{
      menu, orders, toggleMenuAvailability, placeOrder, confirmOrder,
      rejectOrder, markReady, addMoreItems, markBillSent,
      salesData: MOCK_SALES, topItems,
    }}>
      {children}
    </OrderContext.Provider>
  );
};
