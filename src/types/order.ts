export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  emoji: string;
  image: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface Order {
  id: string;
  tableNumber: number;
  items: CartItem[];
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'rejected';
  createdAt: Date;
  userPhone: string;
  customerName: string;
  totalAmount: number;
  billSent: boolean;
  additionalRequests: CartItem[];
}

export interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}
