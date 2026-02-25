import { useState } from 'react';
import { useOrders } from '@/context/OrderContext';
import { CartItem } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Plus, Minus, ShoppingCart, Send, PackagePlus } from 'lucide-react';
import { toast } from 'sonner';

const UserSection = () => {
  const { menu, orders, placeOrder, addMoreItems } = useOrders();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);

  const availableMenu = menu.filter(item => item.available);
  const categories = [...new Set(availableMenu.map(i => i.category))];

  const activeOrder = orders.find(o => o.id === activeOrderId);
  const isOrderConfirmed = activeOrder && (activeOrder.status === 'confirmed' || activeOrder.status === 'preparing' || activeOrder.status === 'ready');

  const addToCart = (menuItem: typeof menu[0]) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === menuItem.id);
      if (existing) return prev.map(c => c.menuItem.id === menuItem.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItem, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === id);
      if (existing && existing.quantity > 1) return prev.map(c => c.menuItem.id === id ? { ...c, quantity: c.quantity - 1 } : c);
      return prev.filter(c => c.menuItem.id !== id);
    });
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const handlePlaceOrder = () => {
    if (!tableNumber || !phone) { toast.error('Please enter table number and phone'); return; }
    if (cart.length === 0) { toast.error('Add items to your cart first'); return; }
    const id = placeOrder(cart, parseInt(tableNumber), phone);
    setActiveOrderId(id);
    setCart([]);
    setShowCart(false);
    toast.success(`Order ${id} placed!`);
  };

  const handleRequestMore = () => {
    if (cart.length === 0) { toast.error('Add items first'); return; }
    if (activeOrderId) {
      addMoreItems(activeOrderId, cart);
      setCart([]);
      setShowCart(false);
      toast.success('Additional items requested!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Menu</h2>
          <p className="text-muted-foreground text-sm">Browse and order your favourites</p>
        </div>
        <Button
          variant="default"
          className="relative"
          onClick={() => setShowCart(!showCart)}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Cart
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Button>
      </div>

      {/* Active Order Status */}
      {activeOrder && (
        <Card className="p-4 border-2 border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">Order {activeOrder.id}</p>
              <p className="text-sm text-muted-foreground">Table {activeOrder.tableNumber}</p>
            </div>
            <Badge variant={
              activeOrder.status === 'pending' ? 'secondary' :
              activeOrder.status === 'confirmed' ? 'default' :
              activeOrder.status === 'ready' ? 'outline' :
              activeOrder.status === 'rejected' ? 'destructive' : 'secondary'
            }>
              {activeOrder.status === 'pending' && '⏳ Waiting for confirmation'}
              {activeOrder.status === 'confirmed' && '👨‍🍳 Being prepared'}
              {activeOrder.status === 'ready' && '✅ Ready!'}
              {activeOrder.status === 'rejected' && '❌ Rejected'}
            </Badge>
          </div>
          <p className="text-sm mt-2 text-muted-foreground">
            Total: ₹{activeOrder.totalAmount}
            {activeOrder.additionalRequests.length > 0 && ` (includes ${activeOrder.additionalRequests.length} additional items)`}
          </p>
          {isOrderConfirmed && (
            <p className="text-xs mt-1 text-primary font-medium">Order confirmed — you can request more items below</p>
          )}
        </Card>
      )}

      {/* Cart Panel */}
      {showCart && (
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-foreground">Your Cart</h3>
          {cart.length === 0 ? (
            <p className="text-muted-foreground text-sm">Your cart is empty</p>
          ) : (
            <>
              {cart.map(item => (
                <div key={item.menuItem.id} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{item.menuItem.emoji} {item.menuItem.name}</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => removeFromCart(item.menuItem.id)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => addToCart(item.menuItem)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm text-muted-foreground w-16 text-right">₹{item.menuItem.price * item.quantity}</span>
                  </div>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between font-semibold text-foreground">
                <span>Total</span>
                <span>₹{cartTotal}</span>
              </div>

              {!activeOrderId && (
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Table No." value={tableNumber} onChange={e => setTableNumber(e.target.value)} type="number" />
                  <Input placeholder="Phone (WhatsApp)" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              )}

              {!isOrderConfirmed ? (
                <Button className="w-full" onClick={handlePlaceOrder} disabled={!!activeOrderId && activeOrder?.status === 'pending'}>
                  <Send className="h-4 w-4 mr-2" />
                  {activeOrderId ? 'Waiting for confirmation...' : 'Confirm Order'}
                </Button>
              ) : (
                <Button className="w-full" onClick={handleRequestMore}>
                  <PackagePlus className="h-4 w-4 mr-2" />
                  Request More Items
                </Button>
              )}
            </>
          )}
        </Card>
      )}

      {/* Menu Grid */}
      {categories.map(cat => (
        <div key={cat}>
          <h3 className="font-semibold text-foreground mb-3 text-lg">{cat}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableMenu.filter(i => i.category === cat).map(item => (
              <Card key={item.id} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer group" onClick={() => addToCart(item)}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-sm text-primary font-semibold">₹{item.price}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserSection;
