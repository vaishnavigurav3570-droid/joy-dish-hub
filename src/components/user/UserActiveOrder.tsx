/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, CheckCircle2, Copy } from 'lucide-react';
import GoogleReviewButton from '@/components/GoogleReviewButton';

export function UserPreOrderSuccess({ successPin, successOrderId, copyPin, setSuccessPin, setSuccessOrderId, setShowCart, setActiveOrderId }: any) {
  return (
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
            <GoogleReviewButton />
            <Button className="w-full gradient-warm text-primary-foreground rounded-2xl h-12 font-bold" onClick={() => { setSuccessPin(null); setSuccessOrderId(null); setShowCart(false); setActiveOrderId(successOrderId); }}>
              Done
            </Button>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function UserActiveOrder({ activeOrder, successPin, isOrderConfirmed, canCancelOrder, cancelOrder, setActiveOrderId, toast }: any) {
  return (
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
                  activeOrder.status === 'rejected' ? 'bg-destructive/15 text-destructive' :
                  activeOrder.status === 'cancelled' ? 'bg-muted text-muted-foreground' :
                  activeOrder.status === 'completed' ? 'gradient-cool text-accent-foreground' :
                  activeOrder.status === 'no_show' ? 'bg-destructive/15 text-destructive' : ''
                }`}>
                  {activeOrder.status === 'pending' && '⏳ Waiting for Kitchen'}
                  {activeOrder.status === 'confirmed' && '👨‍🍳 Being Prepared'}
                  {activeOrder.status === 'ready' && '✅ Ready for Pickup!'}
                  {activeOrder.status === 'rejected' && '❌ Rejected'}
                  {activeOrder.status === 'cancelled' && '🚫 Cancelled'}
                  {activeOrder.status === 'completed' && '✅ Completed'}
                  {activeOrder.status === 'no_show' && '⚠️ Marked No-Show'}
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
            {canCancelOrder && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5"
                  onClick={async () => {
                    try {
                      await cancelOrder(activeOrder.id);
                      setActiveOrderId(null);
                      toast.success('Order cancelled successfully');
                    } catch {
                      toast.error('Failed to cancel order. Please try again.');
                    }
                  }}
                >
                  <X className="h-3.5 w-3.5" /> Cancel Order
                </Button>
              </motion.div>
            )}
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
