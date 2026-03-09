import { useState } from 'react';
import { useOrders } from '@/context/OrderContext';
import { CartItem } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Plus, Minus, ShoppingCart, Send, PackagePlus, Flame, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { validateIndianPhone } from '@/lib/phone';

const UserSection = () => {
  const { menu, orders, placeOrder, addMoreItems, menuLoading } = useOrders();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [placing, setPlacing] = useState(false);

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

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (value.length > 0) {
      const { valid, error } = validateIndianPhone(value);
      setPhoneError(valid ? '' : (error || ''));
    } else {
      setPhoneError('');
    }
  };

  const handlePlaceOrder = async () => {
    if (!customerName.trim()) { toast.error('Please enter your name'); return; }
    if (!tableNumber) { toast.error('Please enter table number'); return; }
    const { valid, cleaned, error } = validateIndianPhone(phone);
    if (!valid) { setPhoneError(error || 'Invalid phone'); toast.error(error || 'Invalid phone number'); return; }
    if (cart.length === 0) { toast.error('Add items to your cart first'); return; }

    setPlacing(true);
    try {
      const id = await placeOrder(cart, parseInt(tableNumber), cleaned, customerName.trim());
      setActiveOrderId(id);
      setCart([]);
      setShowCart(false);
      toast.success(`Order ${id} placed!`);
    } catch (err) {
      toast.error('Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  const handleRequestMore = async () => {
    if (cart.length === 0) { toast.error('Add items first'); return; }
    if (activeOrderId) {
      await addMoreItems(activeOrderId, cart);
      setCart([]);
      setShowCart(false);
      toast.success('Additional items requested!');
    }
  };

  const getCartQty = (id: string) => cart.find(c => c.menuItem.id === id)?.quantity || 0;

  if (menuLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-6 space-y-2">
        <h2 className="text-4xl font-extrabold text-foreground tracking-tight" style={{ fontFamily: 'var(--text-display)' }}>
          <span className="gradient-warm bg-clip-text text-transparent">Browse Menu</span>
        </h2>
        <p className="text-muted-foreground text-sm flex items-center justify-center gap-1">
          <Flame className="h-3.5 w-3.5 text-primary" /> Fresh & made with love at The Curry Corner
        </p>
      </div>

      {/* Cart Button */}
      <div className="flex justify-end">
        <Button
          className="relative gradient-warm text-primary-foreground rounded-2xl px-5 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
          onClick={() => setShowCart(!showCart)}
        >
          <ShoppingCart className="h-4 w-4 mr-2" /> Cart
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-bounce">
              {cartCount}
            </span>
          )}
        </Button>
      </div>

      {/* Active Order Status */}
      {activeOrder && (
        <Card className="p-5 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl food-card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-foreground text-lg">{activeOrder.id}</p>
              <p className="text-sm text-muted-foreground">Table {activeOrder.tableNumber}</p>
            </div>
            <Badge className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
              activeOrder.status === 'pending' ? 'bg-warning/15 text-warning border-warning/30' :
              activeOrder.status === 'confirmed' ? 'gradient-warm text-primary-foreground' :
              activeOrder.status === 'ready' ? 'gradient-cool text-accent-foreground' :
              activeOrder.status === 'rejected' ? 'bg-destructive/15 text-destructive' : ''
            }`}>
              {activeOrder.status === 'pending' && '⏳ Waiting'}
              {activeOrder.status === 'confirmed' && '👨‍🍳 Preparing'}
              {activeOrder.status === 'ready' && '✅ Ready!'}
              {activeOrder.status === 'rejected' && '❌ Rejected'}
            </Badge>
          </div>
          <p className="text-sm mt-3 text-muted-foreground font-medium">
            Total: <span className="text-primary font-bold text-base">₹{activeOrder.totalAmount}</span>
          </p>
          {isOrderConfirmed && (
            <p className="text-xs mt-2 text-accent font-semibold">✨ Order confirmed — add more items below</p>
          )}
        </Card>
      )}

      {/* Cart Panel */}
      {showCart && (
        <Card className="p-5 space-y-4 rounded-2xl glass food-card-shadow">
          <h3 className="font-bold text-foreground text-lg">🛒 Your Cart</h3>
          {cart.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">Your cart is empty — start adding delicious items!</p>
          ) : (
            <>
              {cart.map(item => (
                <div key={item.menuItem.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <img src={item.menuItem.image} alt={item.menuItem.name} className="w-10 h-10 rounded-xl object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <span className="text-sm font-medium text-foreground">{item.menuItem.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={() => removeFromCart(item.menuItem.id)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-bold w-6 text-center text-foreground">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={() => addToCart(item.menuItem)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-semibold text-primary w-16 text-right">₹{item.menuItem.price * item.quantity}</span>
                  </div>
                </div>
              ))}
              <div className="border-t border-border/50 pt-4 flex justify-between font-bold text-foreground text-lg">
                <span>Total</span>
                <span className="text-primary">₹{cartTotal}</span>
              </div>

              {!activeOrderId && (
                <div className="space-y-3">
                  <Input className="rounded-xl" placeholder="Your Name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input className="rounded-xl" placeholder="Table No." value={tableNumber} onChange={e => setTableNumber(e.target.value)} type="number" />
                    <Input
                      className={`rounded-xl ${phoneError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      placeholder="WhatsApp No."
                      value={phone}
                      onChange={e => handlePhoneChange(e.target.value)}
                    />
                  </div>
                  {phoneError && (
                    <p className="text-destructive text-xs flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {phoneError}
                    </p>
                  )}
                </div>
              )}

              {!isOrderConfirmed ? (
                <Button
                  className="w-full gradient-warm text-primary-foreground rounded-2xl h-12 text-base font-semibold shadow-lg shadow-primary/20"
                  onClick={handlePlaceOrder}
                  disabled={placing || (!!activeOrderId && activeOrder?.status === 'pending')}
                >
                  {placing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  {placing ? 'Placing...' : activeOrderId ? 'Waiting for confirmation...' : 'Place Order'}
                </Button>
              ) : (
                <Button className="w-full gradient-cool text-accent-foreground rounded-2xl h-12 text-base font-semibold" onClick={handleRequestMore}>
                  <PackagePlus className="h-4 w-4 mr-2" /> Request More Items
                </Button>
              )}
            </>
          )}
        </Card>
      )}

      {/* Menu Grid */}
      {categories.map(cat => (
        <div key={cat}>
          <h3 className="font-bold text-foreground mb-4 text-xl flex items-center gap-2">
            <span className="w-1 h-6 gradient-warm rounded-full inline-block" /> {cat}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {availableMenu.filter(i => i.category === cat).map(item => {
              const qty = getCartQty(item.id);
              return (
                <Card key={item.id} className="overflow-hidden rounded-2xl hover:food-card-shadow transition-all duration-300 group cursor-pointer border-border/50 hover:border-primary/30 hover:-translate-y-1" onClick={() => addToCart(item)}>
                  <div className="relative h-32 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-secondary text-4xl">${item.emoji}</div>`;
                        }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary text-4xl">{item.emoji}</div>
                    )}
                    {qty > 0 && (
                      <div className="absolute top-2 right-2 gradient-warm text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">{qty}</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-foreground text-sm truncate">{item.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-primary font-bold">₹{item.price}</p>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10 hover:bg-primary/20">
                        <Plus className="h-3.5 w-3.5 text-primary" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserSection;
