/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { FileText, IndianRupee, AlertTriangle, Star, Percent, ArrowUpRight, Loader2, Download, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Order, MenuItem } from '@/types/order';

interface OwnerAnalyticsProps {
  orders: Order[];
  menu: MenuItem[];
  stats: any;
  handleExportPDF: () => void;
  exportingPDF: boolean;
  setPreviewOrder: (order: Order) => void;
  handleDownloadBill: (order: Order) => void;
}

export default function OwnerAnalytics({ orders, menu, stats, handleExportPDF, exportingPDF, setPreviewOrder, handleDownloadBill }: OwnerAnalyticsProps) {
  return (
    <div className="space-y-5 mt-6">
      <Button onClick={handleExportPDF} disabled={exportingPDF} className="w-full rounded-2xl gradient-warm text-primary-foreground font-bold py-6 text-base shadow-lg shadow-primary/20">
        {exportingPDF ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <FileText className="h-5 w-5 mr-2" />}
        {exportingPDF ? 'Generating Report…' : '📄 Download PDF Report'}
      </Button>

      <Card className="p-5 rounded-2xl">
        <h4 className="font-bold text-foreground mb-4 text-base flex items-center gap-2">
          <IndianRupee className="h-4 w-4 text-primary" /> Revenue Breakdown
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary/5 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Dine-in</p>
            <p className="text-lg font-black text-foreground mt-1">₹{stats.dineInRevenue.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">{stats.dineInCount} orders</p>
          </div>
          <div className="bg-accent/5 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Pre-orders</p>
            <p className="text-lg font-black text-foreground mt-1">₹{stats.preOrderRevenue.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">{stats.preOrderCount} orders</p>
          </div>
        </div>
        {stats.noShowCount > 0 && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 bg-destructive/5 rounded-xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-destructive/15 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-bold text-destructive">₹{stats.noShowLoss.toLocaleString()} lost</p>
              <p className="text-[10px] text-muted-foreground">{stats.noShowCount} no-show order{stats.noShowCount > 1 ? 's' : ''}</p>
            </div>
          </motion.div>
        )}
      </Card>

      <Card className="p-5 rounded-2xl">
        <h4 className="font-bold text-foreground mb-4 text-base flex items-center gap-2">
          <Star className="h-4 w-4 text-warning" /> Best Sellers
        </h4>
        {stats.topItemsList.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">Place orders to see analytics</p>
        ) : (
          <div className="space-y-3">
            {stats.topItemsList.map((item: any, idx: number) => (
              <motion.div key={item.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }}
                className="flex items-center gap-3">
                <span className={`text-xs font-extrabold w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${idx === 0 ? 'gradient-warm text-primary-foreground shadow-lg shadow-primary/20' :
                    idx === 1 ? 'bg-secondary text-foreground' :
                      'bg-muted text-muted-foreground'
                  }`}>{idx + 1}</span>
                <span className="text-lg">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground truncate">{item.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">₹{item.revenue.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary mt-1.5">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(item.count / stats.maxItemCount) * 100}%` }}
                      transition={{ delay: 0.4 + idx * 0.08, duration: 0.6 }} className="h-full rounded-full gradient-warm" />
                  </div>
                </div>
                <span className="text-sm font-bold text-primary w-8 text-right shrink-0">{item.count}</span>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 rounded-2xl text-center">
          <Percent className="h-4 w-4 text-accent mx-auto mb-1" />
          <p className="text-lg font-black text-foreground">{stats.totalOrders > 0 ? Math.round((stats.billsSent / stats.totalOrders) * 100) : 0}%</p>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Bills Sent</p>
        </Card>
        <Card className="p-4 rounded-2xl text-center">
          <ArrowUpRight className="h-4 w-4 text-accent mx-auto mb-1" />
          <p className="text-lg font-black text-foreground">{menu.filter(m => m.available).length}/{menu.length}</p>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Menu Active</p>
        </Card>
      </div>

      <Card className="p-5 rounded-2xl">
        <h4 className="font-bold text-foreground mb-4 text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" /> All Bills
        </h4>
        {orders.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">No bills yet</p>
        ) : (
          <div className="space-y-1 max-h-72 overflow-y-auto scrollbar-hide">
            {orders.map(order => (
              <div key={order.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-secondary/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-foreground truncate">{order.id}</p>
                    {order.orderType === 'preorder' && <Badge className="bg-primary/15 text-primary text-[8px] font-bold rounded-full px-1.5 py-0">🔥</Badge>}
                    {order.status === 'no_show' && <Badge className="bg-destructive/15 text-destructive text-[8px] font-bold rounded-full px-1.5 py-0">NO-SHOW</Badge>}
                    {order.billSent && <Badge className="bg-accent/15 text-accent text-[8px] font-bold rounded-full px-1.5 py-0">SENT</Badge>}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{order.customerName} • ₹{order.totalAmount}</p>
                </div>
                <div className="flex gap-1 shrink-0">
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
    </div>
  );
}
