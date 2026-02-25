import { useOrders } from '@/context/OrderContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, ChefHat, Clock, Flame } from 'lucide-react';
import { toast } from 'sonner';

const WorkerSection = () => {
  const { orders, confirmOrder, rejectOrder, markReady } = useOrders();

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const activeOrders = orders.filter(o => o.status === 'confirmed');
  const readyOrders = orders.filter(o => o.status === 'ready');

  const handleConfirm = (id: string) => {
    confirmOrder(id);
    toast.success('Order confirmed!');
  };

  const handleReject = (id: string) => {
    rejectOrder(id);
    toast.error('Order rejected');
  };

  const handleReady = (id: string) => {
    markReady(id);
    toast.success('Order marked as ready!');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Kitchen</h2>
        <p className="text-muted-foreground text-sm mt-1">Manage incoming orders in real-time</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center rounded-2xl border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Clock className="h-3.5 w-3.5 text-warning" />
          </div>
          <p className="text-3xl font-extrabold text-warning">{pendingOrders.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1 font-medium uppercase tracking-wider">Pending</p>
        </Card>
        <Card className="p-4 text-center rounded-2xl border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 stat-glow">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Flame className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-3xl font-extrabold text-primary">{activeOrders.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1 font-medium uppercase tracking-wider">Cooking</p>
        </Card>
        <Card className="p-4 text-center rounded-2xl border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Check className="h-3.5 w-3.5 text-accent" />
          </div>
          <p className="text-3xl font-extrabold text-accent">{readyOrders.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1 font-medium uppercase tracking-wider">Ready</p>
        </Card>
      </div>

      {/* Pending Orders */}
      {pendingOrders.length > 0 && (
        <div>
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2 text-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-warning animate-pulse" />
            New Orders
          </h3>
          <div className="space-y-3">
            {pendingOrders.map(order => (
              <Card key={order.id} className="p-5 rounded-2xl border-l-4 border-l-warning bg-gradient-to-r from-warning/5 to-transparent">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-foreground text-base">{order.id}</p>
                    <p className="text-sm text-muted-foreground">Table {order.tableNumber} • {order.createdAt.toLocaleTimeString()}</p>
                  </div>
                  <Badge className="bg-secondary text-foreground font-bold rounded-full px-3">₹{order.totalAmount}</Badge>
                </div>
                <div className="space-y-1.5 mb-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-foreground">
                      <img src={item.menuItem.image} alt="" className="w-6 h-6 rounded-lg object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <span>{item.menuItem.name}</span>
                      <span className="text-muted-foreground">× {item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 gradient-cool text-accent-foreground rounded-xl font-semibold" onClick={() => handleConfirm(order.id)}>
                    <Check className="h-4 w-4 mr-1" /> Accept
                  </Button>
                  <Button variant="destructive" className="flex-1 rounded-xl font-semibold" onClick={() => handleReject(order.id)}>
                    <X className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <div>
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2 text-lg">
            <Flame className="h-5 w-5 text-primary" />
            Cooking Now
          </h3>
          <div className="space-y-3">
            {activeOrders.map(order => (
              <Card key={order.id} className="p-5 rounded-2xl border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-foreground">{order.id}</p>
                    <p className="text-sm text-muted-foreground">Table {order.tableNumber}</p>
                  </div>
                  <Badge className="gradient-warm text-primary-foreground rounded-full px-3">₹{order.totalAmount}</Badge>
                </div>
                <div className="space-y-1.5 mb-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-foreground">
                      <img src={item.menuItem.image} alt="" className="w-6 h-6 rounded-lg object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <span>{item.menuItem.name}</span>
                      <span className="text-muted-foreground">× {item.quantity}</span>
                    </div>
                  ))}
                  {order.additionalRequests.length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-primary mt-2">+ Additional:</p>
                      {order.additionalRequests.map((item, idx) => (
                        <div key={`add-${idx}`} className="flex items-center gap-2 text-sm text-foreground">
                          <img src={item.menuItem.image} alt="" className="w-6 h-6 rounded-lg object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          <span>{item.menuItem.name}</span>
                          <span className="text-muted-foreground">× {item.quantity}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
                <Button className="w-full mt-3 rounded-xl font-semibold gradient-cool text-accent-foreground" onClick={() => handleReady(order.id)}>
                  <Check className="h-4 w-4 mr-1" /> Mark Ready
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Ready */}
      {readyOrders.length > 0 && (
        <div>
          <h3 className="font-bold text-foreground mb-3 text-lg">✅ Ready to Serve</h3>
          <div className="space-y-3">
            {readyOrders.map(order => (
              <Card key={order.id} className="p-4 rounded-2xl border-l-4 border-l-accent bg-gradient-to-r from-accent/5 to-transparent opacity-80">
                <p className="font-bold text-foreground">{order.id} — Table {order.tableNumber}</p>
                <p className="text-sm text-muted-foreground font-medium">₹{order.totalAmount}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {orders.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <ChefHat className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No orders yet</p>
          <p className="text-sm">Waiting for customers to place orders...</p>
        </div>
      )}
    </div>
  );
};

export default WorkerSection;
