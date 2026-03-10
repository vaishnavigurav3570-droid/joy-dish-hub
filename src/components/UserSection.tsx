import { useState } from 'react';
import { useOrders } from '@/context/OrderContext';
import { CartItem } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Plus, Minus, ShoppingCart, Send, PackagePlus, Flame, AlertCircle, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { validateIndianPhone } from '@/lib/phone';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const availableMenu = menu.filter(item => item.available);
  const categories = [...new Set(availableMenu.map(i => i.category))];

  const activeOrder = orders.find(o => o.id === activeOrderId);
  const isOrderConfirmed = activeOrder && (activeOrder.status === 'confirmed' || activeOrder.status === 'preparing' || activeOrder.status === 'ready');

  // Set default active category
  if (!activeCategory && categories.length > 0) {
    setActiveCategory(categories[0]);
  }

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
      toast.success(`Order ${id} placed! 🎉`);
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
      toast.success('Additional items requested! 🍽️');
    }
  };

  const getCartQty = (id: string) => cart.find(c => c.menuItem.id === id)?.quantity || 0;

  if (menuLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="h-10 w-10 text-primary" />
        </motion.div>
        <p className="text-muted-foreground text-sm animate-pulse">Loading delicious menu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center py-8 space-y-3"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-5xl mb-2"
        >
          🍛
        </motion.div>
        <h2 className="text-4xl font-extrabold text-foreground tracking-tight" style={{ fontFamily: 'var(--text-display)' }}>
          <span className="gradient-warm bg-clip-text text-transparent">Browse Menu</span>
        </h2>
        <p className="text-muted-foreground text-sm flex items-center justify-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-primary" /> Fresh & made with love at The Curry Corner
        </p>
      </motion.div>

      {/* Active Order Status */}
      <AnimatePresence>
        {activeOrder && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="p-5 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl food-card-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground text-lg">{activeOrder.id}</p>
                  <p className="text-sm text-muted-foreground">Table {activeOrder.tableNumber} • {activeOrder.customerName}</p>
                </div>
                <motion.div
                  key={activeOrder.status}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring' }}
                >
                  <Badge className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                    activeOrder.status === 'pending' ? 'bg-warning/15 text-warning border-warning/30' :
                    activeOrder.status === 'confirmed' ? 'gradient-warm text-primary-foreground' :
                    activeOrder.status === 'ready' ? 'gradient-cool text-accent-foreground' :
                    activeOrder.status === 'rejected' ? 'bg-destructive/15 text-destructive' : ''
                  }`}>
                    {activeOrder.status === 'pending' && '⏳ Waiting for Kitchen'}
                    {activeOrder.status === 'confirmed' && '👨‍🍳 Being Prepared'}
                    {activeOrder.status === 'ready' && '✅ Ready for Pickup!'}
                    {activeOrder.status === 'rejected' && '❌ Rejected'}
                  </Badge>
                </motion.div>
              </div>
              <p className="text-sm mt-3 text-muted-foreground font-medium">
                Total: <span className="text-primary font-bold text-base">₹{activeOrder.totalAmount}</span>
              </p>
              {isOrderConfirmed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs mt-2 text-accent font-semibold"
                >
                  ✨ Order confirmed — you can add more items below!
                </motion.p>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Chips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
      >
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
              activeCategory === cat
                ? 'gradient-warm text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </motion.div>

      {/* Menu Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 gap-4"
        >
          {availableMenu.filter(i => i.category === activeCategory).map((item, idx) => {
            const qty = getCartQty(item.id);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card
                  className="overflow-hidden rounded-2xl hover:food-card-shadow transition-all duration-300 group cursor-pointer border-border/50 hover:border-primary/30 hover:-translate-y-1 active:scale-[0.98]"
                  onClick={() => addToCart(item)}
                >
                  <div className="relative h-36 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-secondary text-5xl">${item.emoji}</div>`;
                        }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary text-5xl">{item.emoji}</div>
                    )}
                    <AnimatePresence>
                      {qty > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute top-2 right-2 gradient-warm text-primary-foreground text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg"
                        >
                          {qty}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-3">
                      <p className="text-white font-bold text-sm drop-shadow-lg">{item.name}</p>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <p className="text-primary font-extrabold text-lg">₹{item.price}</p>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      qty > 0 ? 'gradient-warm text-primary-foreground shadow-md' : 'bg-primary/10 text-primary group-hover:bg-primary/20'
                    }`}>
                      <Plus className="h-4 w-4" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg"
          >
            <Button
              className="w-full gradient-warm text-primary-foreground rounded-2xl h-14 text-base font-bold shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all relative"
              onClick={() => setShowCart(true)}
            >
              <ShoppingCart className="h-5 w-5 mr-3" />
              View Cart • {cartCount} item{cartCount > 1 ? 's' : ''} • ₹{cartTotal}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Overlay */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setShowCart(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto shadow-2xl border-t border-border/50"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-foreground text-xl flex items-center gap-2">
                  🛒 Your Cart
                </h3>
                <button
                  onClick={() => setShowCart(false)}
                  className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {cart.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-10">Your cart is empty</p>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <motion.div
                      key={item.menuItem.id}
                      layout
                      className="flex items-center justify-between py-3 border-b border-border/30 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        {item.menuItem.image && (
                          <img src={item.menuItem.image} alt={item.menuItem.name} className="w-12 h-12 rounded-xl object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        )}
                        <div>
                          <span className="text-sm font-semibold text-foreground">{item.menuItem.name}</span>
                          <p className="text-xs text-muted-foreground">₹{item.menuItem.price} each</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => removeFromCart(item.menuItem.id)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-bold w-6 text-center text-foreground">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => addToCart(item.menuItem)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-bold text-primary w-16 text-right">₹{item.menuItem.price * item.quantity}</span>
                      </div>
                    </motion.div>
                  ))}

                  <div className="border-t-2 border-border pt-4 flex justify-between font-bold text-foreground text-xl">
                    <span>Total</span>
                    <span className="text-primary">₹{cartTotal}</span>
                  </div>

                  {!activeOrderId && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3 pt-2"
                    >
                      <Input className="rounded-xl h-12" placeholder="Your Name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                      <div className="grid grid-cols-2 gap-3">
                        <Input className="rounded-xl h-12" placeholder="Table No." value={tableNumber} onChange={e => setTableNumber(e.target.value)} type="number" />
                        <Input
                          className={`rounded-xl h-12 ${phoneError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
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
                    </motion.div>
                  )}

                  {!isOrderConfirmed ? (
                    <Button
                      className="w-full gradient-warm text-primary-foreground rounded-2xl h-14 text-base font-bold shadow-lg shadow-primary/20 mt-2"
                      onClick={handlePlaceOrder}
                      disabled={placing || (!!activeOrderId && activeOrder?.status === 'pending')}
                    >
                      {placing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                      {placing ? 'Placing Order...' : activeOrderId ? 'Waiting for confirmation...' : 'Place Order'}
                    </Button>
                  ) : (
                    <Button className="w-full gradient-cool text-accent-foreground rounded-2xl h-14 text-base font-bold mt-2" onClick={handleRequestMore}>
                      <PackagePlus className="h-4 w-4 mr-2" /> Request More Items
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserSection;
