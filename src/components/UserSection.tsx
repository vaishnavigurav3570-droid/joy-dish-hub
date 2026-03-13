import { useState, useEffect } from 'react';
import { useOrders } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { CartItem, OrderType } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, Minus, ShoppingCart, Send, PackagePlus, Flame, AlertCircle, Loader2, X, MapPin, Clock, CheckCircle2, Copy, Box } from 'lucide-react';
import { toast } from 'sonner';
import { validateIndianPhone } from '@/lib/phone';
import { motion, AnimatePresence } from 'framer-motion';
import { lovable } from '@/integrations/lovable/index';
import ARViewerModal from './ARViewerModal';
import GoogleReviewButton from './GoogleReviewButton';

const UserSection = () => {
  const { menu, orders, placeOrder, addMoreItems, menuLoading } = useOrders();
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [successPin, setSuccessPin] = useState<string | null>(null);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [arModel, setArModel] = useState<{ url: string; name: string } | null>(null);

  // Auto-fill from authenticated user session (Google metadata)
  useEffect(() => {
    if (user) {
      const meta = user.user_metadata;
      const name = meta?.full_name || meta?.name || '';
      if (name) setCustomerName(name);
      // Load saved WhatsApp number from localStorage
      const savedPhone = localStorage.getItem(`wa_phone_${user.id}`);
      if (savedPhone) setPhone(savedPhone);
    }
  }, [user]);

  const isAuthed = !!user;

  const availableMenu = menu.filter(item => item.available);
  const categories = [...new Set(availableMenu.map(i => i.category))];

  const activeOrder = orders.find(o => o.id === activeOrderId);
  const isOrderConfirmed = activeOrder && (activeOrder.status === 'confirmed' || activeOrder.status === 'preparing' || activeOrder.status === 'ready');

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

  const handleGoogleLogin = async () => {
    setSigningIn(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error('Google sign-in failed');
      }
    } catch {
      toast.error('Google sign-in failed');
    } finally {
      setSigningIn(false);
    }
  };

  const executePlaceOrder = async () => {
    if (!customerName.trim()) { toast.error('Please enter your name'); return; }
    if (orderType === 'dine-in' && !tableNumber) { toast.error('Please enter table number'); return; }
    const { valid, cleaned, error } = validateIndianPhone(phone);
    if (!valid) { setPhoneError(error || 'Invalid phone'); toast.error(error || 'Invalid phone number'); return; }
    if (cart.length === 0) { toast.error('Add items to your cart first'); return; }

    // Save WhatsApp number to localStorage for auto-fill
    if (user) {
      localStorage.setItem(`wa_phone_${user.id}`, phone);
    }

    setPlacing(true);
    try {
      const tbl = orderType === 'preorder' ? 0 : parseInt(tableNumber);
      const result = await placeOrder(cart, tbl, cleaned, customerName.trim(), orderType);
      setActiveOrderId(result.orderNumber);
      setCart([]);

      if (orderType === 'preorder' && result.pickupPin) {
        setSuccessPin(result.pickupPin);
        setSuccessOrderId(result.orderNumber);
      } else {
        setShowCart(false);
        toast.success(`Order ${result.orderNumber} placed! 🎉`);
      }
    } catch (err) {
      toast.error('Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!isAuthed) {
      handleGoogleLogin();
      return;
    }
    await executePlaceOrder();
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

  const copyPin = () => {
    if (successPin) {
      navigator.clipboard.writeText(successPin);
      toast.success('PIN copied!');
    }
  };

  if (menuLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Loader2 className="h-10 w-10 text-primary" />
        </motion.div>
        <p className="text-muted-foreground text-sm animate-pulse">Loading delicious menu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AR Viewer Modal */}
      {arModel && (
        <ARViewerModal
          open={!!arModel}
          onClose={() => setArModel(null)}
          modelUrl={arModel.url}
          itemName={arModel.name}
        />
      )}

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center py-8 space-y-3">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }} className="text-5xl mb-2">🍛</motion.div>
        <h2 className="text-4xl font-extrabold text-foreground tracking-tight" style={{ fontFamily: 'var(--text-display)' }}>
          <span className="gradient-warm bg-clip-text text-transparent">Browse Menu</span>
        </h2>
        <p className="text-muted-foreground text-sm flex items-center justify-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-primary" /> Fresh & made with love at The Curry Corner
        </p>
        {isAuthed ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-primary font-medium">
            ✅ Logged in as {customerName || user?.email}
          </motion.p>
        ) : (
          <Button variant="outline" className="rounded-xl gap-2 mt-2" onClick={handleGoogleLogin} disabled={signingIn}>
            {signingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            )}
            Continue with Google
          </Button>
        )}
      </motion.div>

      {/* Pre-order Success Card */}
      <AnimatePresence>
        {successPin && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
            <Card className="p-8 rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 text-center space-y-4">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
              </motion.div>
              <h3 className="text-2xl font-extrabold text-foreground">Pre-Order Placed! 🎉</h3>
              <p className="text-sm text-muted-foreground">Order <span className="font-bold text-foreground">{successOrderId}</span></p>
              <div className="bg-card rounded-2xl p-6 border border-border shadow-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Your Pickup PIN</p>
                <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.4 }} className="text-6xl font-black text-primary tracking-[0.3em] font-mono">
                  {successPin}
                </motion.p>
              </div>
              <Button variant="outline" className="rounded-xl gap-2" onClick={copyPin}>
                <Copy className="h-4 w-4" /> Copy PIN
              </Button>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                📍 Show this PIN at the counter when you arrive to collect your order.
              </p>
              <Button className="w-full gradient-warm text-primary-foreground rounded-2xl h-12 font-bold" onClick={() => { setSuccessPin(null); setSuccessOrderId(null); setShowCart(false); }}>
                Done
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Order Status */}
      <AnimatePresence>
        {activeOrder && !successPin && (
          <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
            <Card className="p-5 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl food-card-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground text-lg">{activeOrder.id}</p>
                    {activeOrder.orderType === 'preorder' && (
                      <Badge className="bg-primary/15 text-primary text-[10px] font-bold rounded-full px-2">🔥 PRE-ORDER</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activeOrder.orderType === 'dine-in' ? `Table ${activeOrder.tableNumber} • ` : ''}{activeOrder.customerName}
                  </p>
                </div>
                <motion.div key={activeOrder.status} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
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
              {activeOrder.pickupPin && (
                <p className="text-sm mt-1 font-semibold text-primary">📍 Pickup PIN: <span className="font-mono text-lg">{activeOrder.pickupPin}</span></p>
              )}
              {isOrderConfirmed && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs mt-2 text-accent font-semibold">
                  ✨ Order confirmed — you can add more items below!
                </motion.p>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Chips */}
      {!successPin && (
        <>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeCategory === cat
                  ? 'gradient-warm text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
              }`}>
                {cat}
              </button>
            ))}
          </motion.div>

          {/* Menu Grid */}
          <AnimatePresence mode="wait">
            <motion.div key={activeCategory} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="grid grid-cols-2 gap-4">
              {availableMenu.filter(i => i.category === activeCategory).map((item, idx) => {
                const qty = getCartQty(item.id);
                const hasAR = !!(item as any).ar_model_url;
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                    <Card className="overflow-hidden rounded-2xl hover:food-card-shadow transition-all duration-300 group cursor-pointer border-border/50 hover:border-primary/30 hover:-translate-y-1 active:scale-[0.98]" onClick={() => addToCart(item)}>
                      <div className="relative h-36 overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-secondary text-5xl">${item.emoji}</div>`;
                          }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-secondary text-5xl">{item.emoji}</div>
                        )}
                        <AnimatePresence>
                          {qty > 0 && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute top-2 right-2 gradient-warm text-primary-foreground text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg">
                              {qty}
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        <div className="absolute bottom-2 left-3">
                          <p className="text-white font-bold text-sm drop-shadow-lg">{item.name}</p>
                        </div>
                        {hasAR && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setArModel({ url: (item as any).ar_model_url, name: item.name }); }}
                            className="absolute top-2 left-2 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg hover:scale-105 transition-transform"
                          >
                            <Box className="h-3 w-3" /> View in AR 🧊
                          </button>
                        )}
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
        </>
      )}

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cartCount > 0 && !successPin && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg">
            <Button className="w-full gradient-warm text-primary-foreground rounded-2xl h-14 text-base font-bold shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all relative" onClick={() => setShowCart(true)}>
              <ShoppingCart className="h-5 w-5 mr-3" />
              View Cart • {cartCount} item{cartCount > 1 ? 's' : ''} • ₹{cartTotal}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Overlay */}
      <AnimatePresence>
        {showCart && !successPin && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setShowCart(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto shadow-2xl border-t border-border/50">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-foreground text-xl flex items-center gap-2">🛒 Your Cart</h3>
                <button onClick={() => setShowCart(false)} className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {cart.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-10">Your cart is empty</p>
              ) : (
                <div className="space-y-4">
                  {/* Dine-in / Pre-order Toggle */}
                  {!activeOrderId && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between p-4 rounded-2xl bg-secondary/50 border border-border/50">
                      <div className="flex items-center gap-3">
                        {orderType === 'dine-in' ? (
                          <div className="h-9 w-9 rounded-full gradient-warm flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-primary-foreground" />
                          </div>
                        ) : (
                          <div className="h-9 w-9 rounded-full gradient-cool flex items-center justify-center">
                            <Clock className="h-4 w-4 text-accent-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-foreground">{orderType === 'dine-in' ? 'Dine-in' : 'Pre-order'}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {orderType === 'dine-in' ? 'Eating at the restaurant' : 'Pick up when you arrive'}
                          </p>
                        </div>
                      </div>
                      <Switch checked={orderType === 'preorder'} onCheckedChange={(checked) => setOrderType(checked ? 'preorder' : 'dine-in')} />
                    </motion.div>
                  )}

                  {/* Cart Items */}
                  {cart.map(item => (
                    <motion.div key={item.menuItem.id} layout className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                      <div className="flex items-center gap-3">
                        {item.menuItem.image && (
                          <img src={item.menuItem.image} alt={item.menuItem.name} className="w-12 h-12 rounded-xl object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
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
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-2">
                      <Input
                        className="rounded-xl h-12"
                        placeholder="Your Name"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        readOnly={isAuthed}
                        disabled={isAuthed}
                      />
                      <div className={`grid gap-3 ${orderType === 'dine-in' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {orderType === 'dine-in' && (
                          <Input className="rounded-xl h-12" placeholder="Table No." value={tableNumber} onChange={e => setTableNumber(e.target.value)} type="number" />
                        )}
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
                      {placing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : !isAuthed ? (
                        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      ) : <Send className="h-4 w-4 mr-2" />}
                      {placing ? 'Placing Order...' : !isAuthed ? 'Continue with Google to Order' : activeOrderId ? 'Waiting for confirmation...' : orderType === 'preorder' ? '🔥 Place Pre-Order' : 'Place Order'}
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
