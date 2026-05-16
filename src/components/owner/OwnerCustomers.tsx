/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Order } from '@/types/order';

interface OwnerCustomersProps {
  orders: Order[];
  stats: any;
}

export default function OwnerCustomers({ orders, stats }: OwnerCustomersProps) {
  return (
    <div className="space-y-5 mt-6">
      <Card className="p-5 rounded-2xl">
        <h4 className="font-bold text-foreground mb-4 text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> Customer Insights
        </h4>
        {orders.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">No customer data yet</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-hide">
            {(() => {
              const customerMap: Record<string, { name: string; phone: string; orders: number; totalSpent: number; noShows: number; lastOrder: Date }> = {};
              orders.forEach(o => {
                const key = o.userPhone;
                if (!customerMap[key]) {
                  customerMap[key] = { name: o.customerName || '', phone: o.userPhone, orders: 0, totalSpent: 0, noShows: 0, lastOrder: o.createdAt };
                }
                customerMap[key].orders++;
                if (o.status !== 'rejected' && o.status !== 'cancelled' && o.status !== 'no_show') {
                  customerMap[key].totalSpent += o.totalAmount;
                }
                if (o.status === 'no_show') customerMap[key].noShows++;
                if (o.createdAt > customerMap[key].lastOrder) {
                  customerMap[key].lastOrder = o.createdAt;
                  customerMap[key].name = o.customerName || customerMap[key].name;
                }
              });
              return Object.values(customerMap)
                .sort((a, b) => b.totalSpent - a.totalSpent)
                .map((c, idx) => (
                  <motion.div key={c.phone} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                    className={`flex items-center justify-between py-3 px-4 rounded-xl border transition-colors ${
                      c.noShows > 0 ? 'border-destructive/20 bg-destructive/5' : 'border-border/30 hover:bg-secondary/40'
                    }`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        idx === 0 ? 'gradient-warm text-primary-foreground' :
                        idx === 1 ? 'gradient-cool text-accent-foreground' :
                        'bg-secondary text-muted-foreground'
                      }`}>
                        {c.name?.charAt(0)?.toUpperCase() || '#'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-foreground truncate">{c.name || 'Unknown'}</p>
                          {c.noShows > 0 && (
                            <Badge className="bg-destructive/15 text-destructive text-[8px] rounded-full px-1.5 py-0 font-bold shrink-0">
                              🚨 {c.noShows} NO-SHOW
                            </Badge>
                          )}
                          {c.orders >= 3 && c.noShows === 0 && (
                            <Badge className="bg-warning/15 text-warning text-[8px] rounded-full px-1.5 py-0 font-bold shrink-0">⭐ VIP</Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{c.phone} • {c.orders} order{c.orders > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-sm font-bold text-primary">₹{c.totalSpent.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {c.lastOrder.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </motion.div>
                ));
            })()}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 rounded-2xl text-center">
          <p className="text-lg font-black text-foreground">{stats.uniqueCustomers}</p>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total</p>
        </Card>
        <Card className="p-4 rounded-2xl text-center">
          <p className="text-lg font-black text-accent">
            {(() => {
              const phones = new Set<string>();
              const seen = new Set<string>();
              orders.forEach(o => {
                if (seen.has(o.userPhone)) phones.add(o.userPhone);
                seen.add(o.userPhone);
              });
              return phones.size;
            })()}
          </p>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Returning</p>
        </Card>
        <Card className="p-4 rounded-2xl text-center">
          <p className="text-lg font-black text-destructive">{stats.noShowCount}</p>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">No-Shows</p>
        </Card>
      </div>
    </div>
  );
}
