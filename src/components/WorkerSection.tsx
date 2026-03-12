import { useOrders } from '@/context/OrderContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, ChefHat, Clock, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import BlacklistBanner from './BlacklistBanner';

const WorkerSection = () => {
  const { orders, confirmOrder, rejectOrder, markReady } = useOrders();

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const activeOrders = orders.filter(o => o.status === 'confirmed');
  const readyOrders = orders.filter(o => o.status === 'ready');

  const handleConfirm = (id: string) => { confirmOrder(id); toast.success('Order confirmed! 👨‍🍳'); };
  const handleReject = (id: string) => { rejectOrder(id); toast.error('Order rejected'); };
  const handleReady = (id: string) => { markReady(id); toast.success('Order ready to serve! ✅'); };

  const OrderMeta = ({ order }: { order: typeof orders[0] }) => (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        <p className="font-bold text-foreground text-base">{order.id}</p>
        {order.orderType === 'preorder' && (
          <Badge className="bg-primary/15 text-primary text-[10px] font-bold rounded-full px-2 py-0.5 border-primary/30">🔥 PRE-ORDER</Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        {order.orderType === 'dine-in' ? `Table ${order.tableNumber} • ` : ''}
        {order.customerName}
        {order.pickupPin && <span className="font-semibold text-primary ml-1">• PIN: {order.pickupPin}</span>}
        {' • '}{order.createdAt.toLocaleTimeString()}
      </p>
    </div>
  );

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Kitchen</h2>
        <p className="text-muted-foreground text-sm mt-1">Manage incoming orders in real-time</p>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-3">
        {[
          { count: pendingOrders.length, label: 'Pending', color: 'warning', icon: Clock },
          { count: activeOrders.length, label: 'Cooking', color: 'primary', icon: Flame },
          { count: readyOrders.length, label: 'Ready', color: 'accent', icon: Check },
        ].map(stat => (
          <Card key={stat.label} className={`p-4 text-center rounded-2xl border-${stat.color}/20 bg-gradient-to-br from-${stat.color}/5 to-${stat.color}/10`}>
            <stat.icon className={`h-4 w-4 text-${stat.color} mx-auto mb-1`} />
            <motion.p key={stat.count} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className={`text-3xl font-extrabold text-${stat.color}`}>{stat.count}</motion.p>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium uppercase tracking-wider">{stat.label}</p>
          </Card>
        ))}
      </motion.div>

      {/* Pending Orders */}
      {pendingOrders.length > 0 && (
        <div>
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2 text-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-warning animate-pulse" /> New Orders
          </h3>
          <div className="space-y-3">
            <AnimatePresence>
              {pendingOrders.map(order => (
                <motion.div key={order.id} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30, height: 0 }} layout>
                  <Card className="p-5 rounded-2xl border-l-4 border-l-warning bg-gradient-to-r from-warning/5 to-transparent">
                    <BlacklistBanner order={order} allOrders={orders} />
                    <div className="flex items-start justify-between mb-3">
                      <OrderMeta order={order} />
                      <Badge className="bg-secondary text-foreground font-bold rounded-full px-3">₹{order.totalAmount}</Badge>
                    </div>
                    <div className="space-y-1.5 mb-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-foreground">
                          <span className="text-base">{item.menuItem.emoji}</span>
                          <span className="font-medium">{item.menuItem.name}</span>
                          <span className="text-muted-foreground">× {item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1 gradient-cool text-accent-foreground rounded-xl font-semibold h-11" onClick={() => handleConfirm(order.id)}>
                        <Check className="h-4 w-4 mr-1" /> Accept
                      </Button>
                      <Button variant="destructive" className="flex-1 rounded-xl font-semibold h-11" onClick={() => handleReject(order.id)}>
                        <X className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <div>
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2 text-lg">
            <Flame className="h-5 w-5 text-primary" /> Cooking Now
          </h3>
          <div className="space-y-3">
            <AnimatePresence>
              {activeOrders.map(order => (
                <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} layout>
                  <Card className="p-5 rounded-2xl border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
                    <BlacklistBanner order={order} allOrders={orders} />
                    <div className="flex items-start justify-between mb-3">
                      <OrderMeta order={order} />
                      <Badge className="gradient-warm text-primary-foreground rounded-full px-3">₹{order.totalAmount}</Badge>
                    </div>
                    <div className="space-y-1.5 mb-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-foreground">
                          <span className="text-base">{item.menuItem.emoji}</span>
                          <span>{item.menuItem.name}</span>
                          <span className="text-muted-foreground">× {item.quantity}</span>
                        </div>
                      ))}
                      {order.additionalRequests.length > 0 && (
                        <>
                          <p className="text-xs font-semibold text-primary mt-2">+ Additional:</p>
                          {order.additionalRequests.map((item, idx) => (
                            <div key={`add-${idx}`} className="flex items-center gap-2 text-sm text-primary">
                              <span className="text-base">{item.menuItem.emoji}</span>
                              <span>{item.menuItem.name}</span>
                              <span className="text-muted-foreground">× {item.quantity}</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                    <Button className="w-full mt-3 rounded-xl font-semibold h-11 gradient-cool text-accent-foreground" onClick={() => handleReady(order.id)}>
                      <Check className="h-4 w-4 mr-1" /> Mark Ready
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Ready */}
      {readyOrders.length > 0 && (
        <div>
          <h3 className="font-bold text-foreground mb-3 text-lg">✅ Ready to Serve</h3>
          <div className="space-y-3">
            {readyOrders.map(order => (
              <motion.div key={order.id} layout>
                <Card className="p-4 rounded-2xl border-l-4 border-l-accent bg-gradient-to-r from-accent/5 to-transparent">
                  <div className="flex items-center justify-between">
                    <OrderMeta order={order} />
                    <Badge className="gradient-cool text-accent-foreground rounded-full px-3 font-bold">₹{order.totalAmount}</Badge>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {orders.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-muted-foreground">
          <ChefHat className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No orders yet</p>
          <p className="text-sm">Waiting for customers to place orders...</p>
        </motion.div>
      )}
    </div>
  );
};

export default WorkerSection;
