import { useState } from 'react';
import { useOrders } from '@/context/OrderContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrendingUp, UtensilsCrossed, BarChart3, Zap, FileText, Download, Eye, IndianRupee, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { generateBillText } from '@/lib/phone';
import { Order } from '@/types/order';
import SendWhatsAppBill from './SendWhatsAppBill';
import BillReceipt from './BillReceipt';
import { motion, AnimatePresence } from 'framer-motion';

const OwnerSection = () => {
  const { orders, menu, toggleMenuAvailability, markBillSent, salesData, topItems } = useOrders();
  const [ownerTab, setOwnerTab] = useState('orders');
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);

  const liveOrders = orders.filter(o => o.status !== 'rejected');
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = orders.length;
  const pendingCount = orders.filter(o => o.status === 'pending').length;

  const getOrderItems = (order: Order) => [
    ...order.items.map(i => ({ name: i.menuItem.name, qty: i.quantity, price: i.menuItem.price })),
    ...order.additionalRequests.map(i => ({ name: i.menuItem.name, qty: i.quantity, price: i.menuItem.price })),
  ];

  const getBillText = (order: Order) => generateBillText(
    order.id, order.tableNumber, order.customerName, order.userPhone,
    getOrderItems(order), order.totalAmount, order.createdAt
  );

  const handleDownloadBill = (order: Order) => {
    const text = getBillText(order);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bill-${order.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Bill downloaded!');
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1">
          <Zap className="h-3.5 w-3.5 text-primary" /> The Curry Corner — command center
        </p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        <Card className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border-primary/15 stat-glow">
          <IndianRupee className="h-4 w-4 text-primary mb-1" />
          <p className="text-2xl font-extrabold text-foreground">₹{totalRevenue.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Revenue</p>
        </Card>
        <Card className="p-4 rounded-2xl bg-gradient-to-br from-accent/5 to-accent/10 border-accent/15">
          <ShoppingBag className="h-4 w-4 text-accent mb-1" />
          <p className="text-2xl font-extrabold text-foreground">{totalOrders}</p>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Orders</p>
        </Card>
        <Card className="p-4 rounded-2xl bg-gradient-to-br from-warning/5 to-warning/10 border-warning/15">
          <TrendingUp className="h-4 w-4 text-warning mb-1" />
          <p className="text-2xl font-extrabold text-foreground">{pendingCount}</p>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Pending</p>
        </Card>
      </motion.div>

      <Tabs value={ownerTab} onValueChange={setOwnerTab}>
        <TabsList className="w-full grid grid-cols-3 rounded-2xl bg-secondary/80 p-1 h-auto">
          <TabsTrigger value="orders" className="rounded-xl text-xs sm:text-sm py-2.5 data-[state=active]:gradient-warm data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg">
            <UtensilsCrossed className="h-3.5 w-3.5 mr-1" /> Orders
          </TabsTrigger>
          <TabsTrigger value="menu" className="rounded-xl text-xs sm:text-sm py-2.5 data-[state=active]:gradient-warm data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg">
            <UtensilsCrossed className="h-3.5 w-3.5 mr-1" /> Menu
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-xl text-xs sm:text-sm py-2.5 data-[state=active]:gradient-warm data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg">
            <BarChart3 className="h-3.5 w-3.5 mr-1" /> Analytics
          </TabsTrigger>
        </TabsList>

        {/* Live Orders */}
        <TabsContent value="orders" className="space-y-4 mt-6">
          {liveOrders.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-muted-foreground">
              <UtensilsCrossed className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No active orders</p>
              <p className="text-sm">Orders will appear here in real-time</p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {liveOrders.map((order, idx) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  layout
                >
                  <Card className="p-5 rounded-2xl hover:food-card-shadow transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-foreground text-base">{order.id}</p>
                        <p className="text-sm text-muted-foreground">
                          Table {order.tableNumber} • {order.customerName} • {order.userPhone}
                        </p>
                      </div>
                      <Badge className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        order.status === 'pending' ? 'bg-warning/15 text-warning' :
                        order.status === 'confirmed' ? 'gradient-warm text-primary-foreground' :
                        order.status === 'ready' ? 'gradient-cool text-accent-foreground' : 'bg-secondary text-foreground'
                      }`}>
                        {order.status}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 mb-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-foreground flex items-center gap-2">
                            <span>{item.menuItem.emoji}</span>
                            {item.menuItem.name} × {item.quantity}
                          </span>
                          <span className="text-muted-foreground">₹{item.menuItem.price * item.quantity}</span>
                        </div>
                      ))}
                      {order.additionalRequests.map((item, idx) => (
                        <div key={`add-${idx}`} className="flex justify-between text-sm">
                          <span className="text-primary flex items-center gap-2">
                            <span>{item.menuItem.emoji}</span>
                            {item.menuItem.name} × {item.quantity} <span className="text-[10px]">(added)</span>
                          </span>
                          <span className="text-muted-foreground">₹{item.menuItem.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-border/50 pt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-foreground text-lg">₹{order.totalAmount}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => setPreviewOrder(order)}>
                            <Eye className="h-3 w-3 mr-1" /> Preview
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => handleDownloadBill(order)}>
                            <Download className="h-3 w-3 mr-1" /> Download
                          </Button>
                        </div>
                      </div>
                      {!order.billSent ? (
                        <SendWhatsAppBill order={order} onBillSent={() => markBillSent(order.id)} />
                      ) : (
                        <Badge className="rounded-full bg-accent/15 text-accent border-accent/30 font-semibold w-full justify-center py-1.5">✅ Bill Sent</Badge>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </TabsContent>

        {/* Menu Management */}
        <TabsContent value="menu" className="space-y-2 mt-6">
          <p className="text-sm text-muted-foreground mb-4 font-medium">Toggle item availability for today</p>
          {menu.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-secondary/50 transition-colors border-b border-border/30 last:border-0"
            >
              <div className="flex items-center gap-3">
                <span className={`text-2xl ${!item.available ? 'opacity-40 grayscale' : ''}`}>{item.emoji}</span>
                <div>
                  <p className={`font-semibold text-sm ${item.available ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.category} • ₹{item.price}</p>
                </div>
              </div>
              <Switch checked={item.available} onCheckedChange={() => toggleMenuAvailability(item.id)} />
            </motion.div>
          ))}
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6 mt-6">
          <Card className="p-5 rounded-2xl">
            <h4 className="font-bold text-foreground mb-4 text-base">🏆 Most Ordered Items</h4>
            {orders.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Place some orders to see analytics</p>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const counts: Record<string, number> = {};
                  orders.forEach(o => {
                    [...o.items, ...o.additionalRequests].forEach(i => {
                      counts[i.menuItem.name] = (counts[i.menuItem.name] || 0) + i.quantity;
                    });
                  });
                  return Object.entries(counts)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([name, count], idx) => (
                      <motion.div
                        key={name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-extrabold w-7 h-7 rounded-full flex items-center justify-center ${
                            idx === 0 ? 'gradient-warm text-primary-foreground' :
                            idx === 1 ? 'bg-secondary text-foreground' :
                            'bg-muted text-muted-foreground'
                          }`}>{idx + 1}</span>
                          <span className="text-sm font-medium text-foreground">{name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 rounded-full bg-primary/20 w-20">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (count / Math.max(...Object.values(counts))) * 100)}%` }}
                              transition={{ delay: 0.5 + idx * 0.1, duration: 0.5 }}
                              className="h-full rounded-full gradient-warm"
                            />
                          </div>
                          <span className="text-sm font-bold text-primary w-12 text-right">{count}</span>
                        </div>
                      </motion.div>
                    ));
                })()}
              </div>
            )}
          </Card>

          <Card className="p-5 rounded-2xl">
            <h4 className="font-bold text-foreground mb-4 text-base">📋 All Bills</h4>
            {orders.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No bills yet</p>
            ) : (
              <div className="space-y-2">
                {orders.map(order => (
                  <div key={order.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-secondary/50 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{order.id}</p>
                      <p className="text-xs text-muted-foreground">{order.customerName} • ₹{order.totalAmount}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg" onClick={() => setPreviewOrder(order)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg" onClick={() => handleDownloadBill(order)}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bill Preview Dialog — shows visual receipt */}
      <Dialog open={!!previewOrder} onOpenChange={() => setPreviewOrder(null)}>
        <DialogContent className="max-w-md rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Bill Preview
            </DialogTitle>
          </DialogHeader>
          {previewOrder && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <BillReceipt order={previewOrder} />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 rounded-xl" variant="outline" onClick={() => handleDownloadBill(previewOrder)}>
                  <Download className="h-4 w-4 mr-1" /> Download
                </Button>
                {!previewOrder.billSent && (
                  <div className="flex-1">
                    <SendWhatsAppBill order={previewOrder} onBillSent={() => { markBillSent(previewOrder.id); setPreviewOrder(null); }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerSection;
