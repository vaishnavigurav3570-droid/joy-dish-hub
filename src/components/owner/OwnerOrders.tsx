import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Download, UserX, UtensilsCrossed, CalendarDays, CheckCircle2, Clock, XCircle, ChefHat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Order } from '@/types/order';
import BlacklistBanner from '@/components/BlacklistBanner';
import SendWhatsAppBill from '@/components/SendWhatsAppBill';

interface OwnerOrdersProps {
  liveOrders: Order[];
  orders: Order[];
  markNoShow: (id: string) => void;
  markBillSent: (id: string) => void;
  setPreviewOrder: (order: Order) => void;
  handleDownloadBill: (order: Order) => void;
}

const statusConfig: Record<string, { icon: React.ReactNode; label: string; classes: string }> = {
  pending: { icon: <Clock className="h-3 w-3" />, label: 'Pending', classes: 'bg-warning/15 text-warning border-warning/30' },
  confirmed: { icon: <ChefHat className="h-3 w-3" />, label: 'Preparing', classes: 'gradient-warm text-primary-foreground' },
  ready: { icon: <CheckCircle2 className="h-3 w-3" />, label: 'Ready', classes: 'gradient-cool text-accent-foreground' },
  rejected: { icon: <XCircle className="h-3 w-3" />, label: 'Rejected', classes: 'bg-destructive/15 text-destructive' },
  no_show: { icon: <UserX className="h-3 w-3" />, label: 'No-Show', classes: 'bg-destructive/15 text-destructive' },
};

export default function OwnerOrders({ liveOrders, orders, markNoShow, markBillSent, setPreviewOrder, handleDownloadBill }: OwnerOrdersProps) {
  if (liveOrders.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-muted-foreground mt-6">
        <UtensilsCrossed className="h-16 w-16 mx-auto mb-4 opacity-20" />
        <p className="text-lg font-medium">No active orders</p>
        <p className="text-sm">Orders will appear here in real-time</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4 mt-6">
      <AnimatePresence>
        {liveOrders.map((order, idx) => {
          const sc = statusConfig[order.status] || statusConfig.pending;
          return (
            <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} layout>
              <Card className="p-5 rounded-2xl card-hover border-border/50">
                <BlacklistBanner order={order} allOrders={orders} />
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-foreground text-base">{order.id}</p>
                      {order.orderType === 'preorder' && (
                        <Badge className="bg-primary/15 text-primary text-[10px] font-bold rounded-full px-2 py-0.5 border-primary/30">🔥 PRE-ORDER</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {order.orderType === 'dine-in' ? `Table ${order.tableNumber} • ` : ''}
                      {order.customerName} • {order.userPhone}
                      {order.pickupPin && <span className="font-semibold text-primary ml-1">• PIN: {order.pickupPin}</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      <CalendarDays className="h-3 w-3 inline mr-0.5" />
                      {order.createdAt.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <motion.div key={order.status} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
                    <Badge className={`rounded-full px-3 py-1.5 text-xs font-semibold flex items-center gap-1 ${sc.classes}`}>
                      {sc.icon} {sc.label}
                    </Badge>
                  </motion.div>
                </div>

                <div className="space-y-1.5 mb-3 bg-secondary/30 rounded-xl p-3">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-foreground flex items-center gap-2">
                        <span>{item.menuItem.emoji}</span>
                        {item.menuItem.name} × {item.quantity}
                      </span>
                      <span className="text-muted-foreground font-medium">₹{item.menuItem.price * item.quantity}</span>
                    </div>
                  ))}
                  {order.additionalRequests.map((item, i) => (
                    <div key={`add-${i}`} className="flex justify-between text-sm">
                      <span className="text-primary flex items-center gap-2">
                        <span>{item.menuItem.emoji}</span>
                        {item.menuItem.name} × {item.quantity}
                        <Badge className="bg-primary/10 text-primary text-[8px] rounded px-1">ADDED</Badge>
                      </span>
                      <span className="text-muted-foreground font-medium">₹{item.menuItem.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border/50 pt-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="font-black text-foreground text-xl">₹{order.totalAmount}</p>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" className="rounded-xl text-xs h-8" onClick={() => setPreviewOrder(order)}>
                        <Eye className="h-3 w-3 mr-1" /> Preview
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl text-xs h-8" onClick={() => handleDownloadBill(order)}>
                        <Download className="h-3 w-3 mr-1" /> Bill
                      </Button>
                    </div>
                  </div>

                  {(order.status === 'pending' || order.status === 'confirmed' || order.status === 'ready') && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full rounded-xl text-xs font-semibold h-9"
                      onClick={() => markNoShow(order.id)}
                    >
                      <UserX className="h-3 w-3 mr-1" /> Mark as No-Show
                    </Button>
                  )}

                  {!order.billSent ? (
                    <SendWhatsAppBill order={order} onBillSent={() => markBillSent(order.id)} />
                  ) : (
                    <Badge className="rounded-full bg-accent/15 text-accent border-accent/30 font-semibold w-full justify-center py-1.5">✅ Bill Sent</Badge>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
