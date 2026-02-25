import { useState } from 'react';
import { useOrders } from '@/context/OrderContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, TrendingUp, UtensilsCrossed, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const OwnerSection = () => {
  const { orders, menu, toggleMenuAvailability, markBillSent, salesData, topItems } = useOrders();
  const [ownerTab, setOwnerTab] = useState('orders');

  const liveOrders = orders.filter(o => o.status !== 'rejected');
  const totalRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = salesData.reduce((sum, d) => sum + d.orders, 0);

  const handleSendBill = (orderId: string, phone: string) => {
    markBillSent(orderId);
    toast.success(`Bill sent to ${phone} on WhatsApp!`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Owner Dashboard</h2>
        <p className="text-muted-foreground text-sm">Manage your restaurant</p>
      </div>

      <Tabs value={ownerTab} onValueChange={setOwnerTab}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="orders" className="text-xs sm:text-sm">
            <UtensilsCrossed className="h-3 w-3 mr-1" /> Orders
          </TabsTrigger>
          <TabsTrigger value="menu" className="text-xs sm:text-sm">
            <UtensilsCrossed className="h-3 w-3 mr-1" /> Menu
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">
            <BarChart3 className="h-3 w-3 mr-1" /> Analytics
          </TabsTrigger>
        </TabsList>

        {/* Live Orders */}
        <TabsContent value="orders" className="space-y-4 mt-4">
          {liveOrders.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <UtensilsCrossed className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No active orders</p>
            </div>
          ) : (
            liveOrders.map(order => (
              <Card key={order.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-foreground">{order.id}</p>
                    <p className="text-sm text-muted-foreground">
                      Table {order.tableNumber} • {order.userPhone}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      order.status === 'pending' ? 'secondary' :
                      order.status === 'confirmed' ? 'default' :
                      order.status === 'ready' ? 'outline' : 'secondary'
                    }>
                      {order.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1 mb-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-foreground">{item.menuItem.emoji} {item.menuItem.name} × {item.quantity}</span>
                      <span className="text-muted-foreground">₹{item.menuItem.price * item.quantity}</span>
                    </div>
                  ))}
                  {order.additionalRequests.map((item, idx) => (
                    <div key={`add-${idx}`} className="flex justify-between text-sm">
                      <span className="text-primary">{item.menuItem.emoji} {item.menuItem.name} × {item.quantity} (added)</span>
                      <span className="text-muted-foreground">₹{item.menuItem.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3 flex items-center justify-between">
                  <p className="font-bold text-foreground">Total: ₹{order.totalAmount}</p>
                  {!order.billSent ? (
                    <Button size="sm" onClick={() => handleSendBill(order.id, order.userPhone)}>
                      <Send className="h-3 w-3 mr-1" /> Send Bill
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-success border-success">✅ Bill Sent</Badge>
                  )}
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Menu Management */}
        <TabsContent value="menu" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">Toggle item availability for today</p>
          {menu.map(item => (
            <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.emoji}</span>
                <div>
                  <p className={`font-medium ${item.available ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
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
        <TabsContent value="analytics" className="space-y-6 mt-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">This Week Revenue</p>
              <p className="text-2xl font-bold text-foreground">₹{totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-success flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" /> +12% vs last week
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold text-foreground">{totalOrders}</p>
              <p className="text-xs text-muted-foreground mt-1">Avg ₹{Math.round(totalRevenue / totalOrders)}/order</p>
            </Card>
          </div>

          {/* Chart */}
          <Card className="p-4">
            <h4 className="font-semibold text-foreground mb-4">Daily Revenue</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Top Items */}
          <Card className="p-4">
            <h4 className="font-semibold text-foreground mb-3">Most Sold Items</h4>
            <div className="space-y-3">
              {topItems.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-5">#{idx + 1}</span>
                    <span className="text-sm text-foreground">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-primary">{item.count} sold</span>
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
