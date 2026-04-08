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
import { UserHero } from './user/UserHero';
import { UserMenuViewer } from './user/UserMenuViewer';
import { UserCart } from './user/UserCart';
import { UserPreOrderSuccess, UserActiveOrder } from './user/UserActiveOrder';

const UserSection = () => {
  const { menu, orders, placeOrder, addMoreItems, cancelOrder, menuLoading } = useOrders();
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
  const canCancelOrder = activeOrder && activeOrder.status === 'pending';

  useEffect(() => {
    if (!activeCategory && categories.length > 0) {
      setActiveCategory(categories[0]);
    }
  }, [categories.length]); // eslint-disable-line react-hooks/exhaustive-deps

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
        const msg = result.error?.message || '';
        if (msg.includes('404') || msg.includes('configuration') || msg.includes('not found')) {
          toast.error('Login configuration error. Please contact the admin.');
        } else {
          toast.error('Google sign-in failed. Please try again.');
        }
      }
    } catch (err: unknown) {
      const msg = (err as Error)?.message || '';
      if (msg.includes('404') || msg.includes('configuration') || msg.includes('not found')) {
        toast.error('Login configuration error. Please contact the admin.');
      } else {
        toast.error('Google sign-in failed. Please try again.');
      }
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

      <UserHero
        isAuthed={isAuthed}
        customerName={customerName}
        email={user?.email}
        handleGoogleLogin={handleGoogleLogin}
        signingIn={signingIn}
      />

      <UserPreOrderSuccess
        successPin={successPin}
        successOrderId={successOrderId}
        copyPin={copyPin}
        setSuccessPin={setSuccessPin}
        setSuccessOrderId={setSuccessOrderId}
        setShowCart={setShowCart}
        setActiveOrderId={setActiveOrderId}
      />

      <UserActiveOrder
        activeOrder={activeOrder}
        successPin={successPin}
        isOrderConfirmed={isOrderConfirmed}
        canCancelOrder={canCancelOrder}
        cancelOrder={cancelOrder}
        setActiveOrderId={setActiveOrderId}
        toast={toast}
      />

      {!successPin && (
        <UserMenuViewer
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          availableMenu={availableMenu}
          getCartQty={getCartQty}
          addToCart={addToCart}
          setArModel={setArModel}
        />
      )}

      {!successPin && (
        <UserCart
          cart={cart}
          cartCount={cartCount}
          cartTotal={cartTotal}
          showCart={showCart}
          setShowCart={setShowCart}
          activeOrderId={activeOrderId}
          isOrderConfirmed={isOrderConfirmed}
          orderType={orderType}
          setOrderType={setOrderType}
          removeFromCart={removeFromCart}
          addToCart={addToCart}
          customerName={customerName}
          setCustomerName={setCustomerName}
          isAuthed={isAuthed}
          tableNumber={tableNumber}
          setTableNumber={setTableNumber}
          phone={phone}
          handlePhoneChange={handlePhoneChange}
          phoneError={phoneError}
          handlePlaceOrder={handlePlaceOrder}
          placing={placing}
          handleRequestMore={handleRequestMore}
        />
      )}
      {/* Footer */}
      {!successPin && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="pt-6 pb-24">
          <p className="text-center text-[11px] text-muted-foreground mt-3">Curry Corner • Ponda, Goa 🍛</p>
        </motion.div>
      )}
    </div>
  );
};

export default UserSection;
