export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  emoji: string;
  image: string;
  ar_model_url?: string | null;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export type OrderType = 'dine-in' | 'preorder';

export interface Order {
  id: string;
  tableNumber: number;
  items: CartItem[];
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'rejected' | 'cancelled' | 'no_show';
  createdAt: Date;
  userPhone: string;
  customerName: string;
  totalAmount: number;
  billSent: boolean;
  additionalRequests: CartItem[];
  orderType: OrderType;
  pickupPin: string | null;
}

export interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}
