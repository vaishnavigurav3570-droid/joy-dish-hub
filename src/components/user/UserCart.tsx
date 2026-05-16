/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Minus, Plus, ShoppingCart, Send, PackagePlus, Loader2, X, MapPin, Clock, AlertCircle } from 'lucide-react';
import { CartItem } from '@/types/order';

export function UserCart({
  cart, cartCount, cartTotal, showCart, setShowCart,
  activeOrderId, isOrderConfirmed, orderType, setOrderType,
  removeFromCart, addToCart,
  customerName, setCustomerName, isAuthed,
  tableNumber, setTableNumber,
  phone, handlePhoneChange, phoneError,
  handlePlaceOrder, placing, handleRequestMore
}: any) {
  return (
    <>
      {/* Floating Cart Button */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <Button className="w-full gradient-warm text-primary-foreground rounded-2xl h-14 text-base font-bold shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all relative" onClick={() => setShowCart(true)}>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setShowCart(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto shadow-2xl border-t border-border/50" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}>
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
                  {cart.map((item: CartItem) => (
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
                        readOnly={isAuthed && !!customerName.trim()}
                        disabled={isAuthed && !!customerName.trim()}
                      />
                      <div className={`grid gap-3 ${orderType === 'dine-in' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {orderType === 'dine-in' && (
                          <Input className="rounded-xl h-12" placeholder="Table No." value={tableNumber} onChange={(e: any) => setTableNumber(e.target.value)} type="number" />
                        )}
                        <Input
                          className={`rounded-xl h-12 ${phoneError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                          placeholder="WhatsApp No."
                          value={phone}
                          onChange={(e: any) => handlePhoneChange(e.target.value)}
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
                      disabled={placing || !!activeOrderId} // Simplified condition
                    >
                      {placing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : !isAuthed ? (
                        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      ) : <Send className="h-4 w-4 mr-2" />}
                      {placing ? 'Placing...' : !isAuthed ? 'Continue with Google' : activeOrderId ? 'Waiting...' : orderType === 'preorder' ? '🔥 Place Pre-Order' : 'Place Order'}
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
    </>
  );
}
