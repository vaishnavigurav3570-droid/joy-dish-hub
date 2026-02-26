import { useState } from 'react';
import { useOrders } from '@/context/OrderContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, TrendingUp, UtensilsCrossed, BarChart3, Zap, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { generateWhatsAppBillLink } from '@/lib/phone';

const OwnerSection = () => {
  const { orders, menu, toggleMenuAvailability, markBillSent, salesData, topItems } = useOrders();
  const [ownerTab, setOwnerTab] = useState('orders');

  const liveOrders = orders.filter(o => o.status !== 'rejected');
  const totalRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = salesData.reduce((sum, d) => sum + d.orders, 0);

  const handleSendBill = (orderId: string, phone: string, order: typeof orders[0]) => {
    const items = [
      ...order.items.map(i => ({ name: i.menuItem.name, qty: i.quantity, price: i.menuItem.price })),
      ...order.additionalRequests.map(i => ({ name: i.menuItem.name, qty: i.quantity, price: i.menuItem.price })),
    ];
    const whatsappLink = generateWhatsAppBillLink(phone, orderId, items, order.totalAmount);
    window.open(whatsappLink, '_blank');
    markBillSent(orderId);
    toast.success(`Bill sent to ${phone} via WhatsApp!`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1">
          <Zap className="h-3.5 w-3.5 text-primary" /> Restaurant command center
        </p>
      </div>

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
            <div className="text-center py-20 text-muted-foreground">
              <UtensilsCrossed className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No active orders</p>
              <p className="text-sm">Orders will appear here in real-time</p>
            </div>
          ) : (
            liveOrders.map(order => (
              <Card key={order.id} className="p-5 rounded-2xl hover:food-card-shadow transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-foreground text-base">{order.id}</p>
                    <p className="text-sm text-muted-foreground">
                      Table {order.tableNumber} • {order.userPhone}
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
                        <img src={item.menuItem.image} alt="" className="w-5 h-5 rounded object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        {item.menuItem.name} × {item.quantity}
                      </span>
                      <span className="text-muted-foreground">₹{item.menuItem.price * item.quantity}</span>
                    </div>
                  ))}
                  {order.additionalRequests.map((item, idx) => (
                    <div key={`add-${idx}`} className="flex justify-between text-sm">
                      <span className="text-primary flex items-center gap-2">
                        <img src={item.menuItem.image} alt="" className="w-5 h-5 rounded object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        {item.menuItem.name} × {item.quantity} <span className="text-[10px]">(added)</span>
                      </span>
                      <span className="text-muted-foreground">₹{item.menuItem.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border/50 pt-3 flex items-center justify-between">
                  <p className="font-bold text-foreground text-lg">₹{order.totalAmount}</p>
                  {!order.billSent ? (
                    <Button size="sm" className="gradient-warm text-primary-foreground rounded-xl font-semibold" onClick={() => handleSendBill(order.id, order.userPhone, order)}>
                      <MessageCircle className="h-3 w-3 mr-1" /> Send via WhatsApp
                    </Button>
                  ) : (
                    <Badge className="rounded-full bg-accent/15 text-accent border-accent/30 font-semibold">✅ Bill Sent</Badge>
                  )}
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Menu Management */}
        <TabsContent value="menu" className="space-y-2 mt-6">
          <p className="text-sm text-muted-foreground mb-4 font-medium">Toggle item availability for today</p>
          {menu.map(item => (
            <div key={item.id} className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-secondary/50 transition-colors border-b border-border/30 last:border-0">
              <div className="flex items-center gap-3">
                <img src={item.image} alt={item.name}
                  className={`w-10 h-10 rounded-xl object-cover ${!item.available ? 'opacity-40 grayscale' : ''}`}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div>
                  <p className={`font-semibold text-sm ${item.available ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.category} • ₹{item.price}</p>
                </div>
              </div>
              <Switch checked={item.available} onCheckedChange={() => toggleMenuAvailability(item.id)} />
            </div>
          ))}
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-5 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border-primary/15 stat-glow">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Weekly Revenue</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">₹{totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-accent flex items-center gap-1 mt-2 font-semibold">
                <TrendingUp className="h-3 w-3" /> +12% vs last week
              </p>
            </Card>
            <Card className="p-5 rounded-2xl bg-gradient-to-br from-accent/5 to-accent/10 border-accent/15">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Orders</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{totalOrders}</p>
              <p className="text-xs text-muted-foreground mt-2">Avg ₹{Math.round(totalRevenue / totalOrders)}/order</p>
            </Card>
          </div>

          <Card className="p-5 rounded-2xl">
            <h4 className="font-bold text-foreground mb-4 text-base">Daily Revenue</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))' }} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5 rounded-2xl">
            <h4 className="font-bold text-foreground mb-4 text-base">🏆 Most Sold Items</h4>
            <div className="space-y-3">
              {topItems.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center ${
                      idx === 0 ? 'gradient-warm text-primary-foreground' :
                      idx === 1 ? 'bg-secondary text-foreground' :
                      'bg-muted text-muted-foreground'
                    }`}>{idx + 1}</span>
                    <span className="text-sm font-medium text-foreground">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-primary">{item.count} sold</span>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OwnerSection;
