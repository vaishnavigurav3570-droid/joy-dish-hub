import { useOrders } from '@/context/OrderContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, ChefHat } from 'lucide-react';
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
        <h2 className="text-2xl font-bold text-foreground">Kitchen Dashboard</h2>
        <p className="text-muted-foreground text-sm">Manage incoming orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-warning">{pendingOrders.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Pending</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-primary">{activeOrders.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Preparing</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-success">{readyOrders.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Ready</p>
        </Card>
      </div>

      {/* Pending Orders */}
      {pendingOrders.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
            New Orders
          </h3>
          <div className="space-y-3">
            {pendingOrders.map(order => (
              <Card key={order.id} className="p-4 border-l-4 border-l-warning">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-foreground">{order.id}</p>
                    <p className="text-sm text-muted-foreground">Table {order.tableNumber} • {order.createdAt.toLocaleTimeString()}</p>
                  </div>
                  <Badge variant="secondary">₹{order.totalAmount}</Badge>
                </div>
                <div className="space-y-1 mb-4">
                  {order.items.map((item, idx) => (
                    <p key={idx} className="text-sm text-foreground">
                      {item.menuItem.emoji} {item.menuItem.name} × {item.quantity}
                    </p>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => handleConfirm(order.id)}>
                    <Check className="h-4 w-4 mr-1" /> Accept
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => handleReject(order.id)}>
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
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <ChefHat className="h-4 w-4 text-primary" />
            Preparing
          </h3>
          <div className="space-y-3">
            {activeOrders.map(order => (
              <Card key={order.id} className="p-4 border-l-4 border-l-primary">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-foreground">{order.id}</p>
                    <p className="text-sm text-muted-foreground">Table {order.tableNumber}</p>
                  </div>
                  <Badge>₹{order.totalAmount}</Badge>
                </div>
                <div className="space-y-1 mb-2">
                  {order.items.map((item, idx) => (
                    <p key={idx} className="text-sm text-foreground">
                      {item.menuItem.emoji} {item.menuItem.name} × {item.quantity}
                    </p>
                  ))}
                  {order.additionalRequests.length > 0 && (
                    <>
                      <p className="text-xs font-medium text-primary mt-2">+ Additional Items:</p>
                      {order.additionalRequests.map((item, idx) => (
                        <p key={`add-${idx}`} className="text-sm text-foreground">
                          {item.menuItem.emoji} {item.menuItem.name} × {item.quantity}
                        </p>
                      ))}
                    </>
                  )}
                </div>
                <Button className="w-full mt-2" variant="outline" onClick={() => handleReady(order.id)}>
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
          <h3 className="font-semibold text-foreground mb-3">✅ Ready to Serve</h3>
          <div className="space-y-3">
            {readyOrders.map(order => (
              <Card key={order.id} className="p-4 border-l-4 border-l-success opacity-75">
                <p className="font-semibold text-foreground">{order.id} — Table {order.tableNumber}</p>
                <p className="text-sm text-muted-foreground">₹{order.totalAmount}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {orders.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <ChefHat className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No orders yet. Waiting for customers...</p>
        </div>
      )}
    </div>
  );
};

export default WorkerSection;
