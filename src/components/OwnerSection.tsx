import { useState, useRef, useCallback, useMemo } from 'react';
import { useOrders } from '@/context/OrderContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  UtensilsCrossed, BarChart3, Zap, FileText, Download, Eye,
  IndianRupee, ShoppingBag, UserX, Users,
  Clock, CheckCircle2, XCircle, ChefHat,
  Package, Archive, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { generateBillText } from '@/lib/phone';
import { Order } from '@/types/order';
import SendWhatsAppBill from './SendWhatsAppBill';
import BillReceipt from './BillReceipt';
import MonthlyReportPDF from './MonthlyReportPDF';
import OwnerAnalytics from './owner/OwnerAnalytics';
import OwnerMenuManager from './owner/OwnerMenuManager';
import OwnerOrders from './owner/OwnerOrders';
import OwnerArchives from './owner/OwnerArchives';
import OwnerCustomers from './owner/OwnerCustomers';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { exportPDFReport, exportCSV, exportArchivePDF } from "@/lib/exportUtils";
import { startOfDay, isToday, format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const OwnerSection = () => {
  const { orders, menu, toggleMenuAvailability, markBillSent, markNoShow, updateMenuItemAR, refreshOrders, salesData, topItems, isRestaurantOpen, toggleRestaurantStatus } = useOrders();
  const [ownerTab, setOwnerTab] = useState('orders');
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [uploadingAR, setUploadingAR] = useState<string | null>(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const arFileRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Archives state
  const [archiveMonth, setArchiveMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [downloadingCSV, setDownloadingCSV] = useState(false);
  const [downloadingArchivePDF, setDownloadingArchivePDF] = useState(false);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(0); // 0=none, 1=first, 2=second
  const [deletingMonth, setDeletingMonth] = useState(false);

  // ── PDF Export ──
  const handleExportPDF = useCallback(async () => {
    if (!reportRef.current) return;
    setExportingPDF(true);
    try {
      await exportPDFReport(reportRef);
      toast.success('PDF report downloaded!');
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setExportingPDF(false);
    }
  }, []);

  // ── Today's orders for dashboard ──
  const todayOrders = useMemo(() => orders.filter(o => isToday(o.createdAt)), [orders]);

  // ── Computed stats (TODAY only for top cards) ──
  const todayStats = useMemo(() => {
    const live = todayOrders.filter(o => o.status !== 'rejected' && o.status !== 'cancelled' && o.status !== 'no_show');
    const totalRevenue = live.reduce((s, o) => s + o.totalAmount, 0);
    const totalOrders = todayOrders.length;
    const pendingCount = todayOrders.filter(o => o.status === 'pending').length;
    const confirmedCount = todayOrders.filter(o => o.status === 'confirmed').length;
    const readyCount = todayOrders.filter(o => o.status === 'ready').length;
    const noShowOrders = todayOrders.filter(o => o.status === 'no_show');
    const noShowCount = noShowOrders.length;
    const noShowLoss = noShowOrders.reduce((s, o) => s + o.totalAmount, 0);
    const avgOrderValue = live.length > 0 ? Math.round(totalRevenue / live.length) : 0;
    const uniqueCustomers = new Set(todayOrders.map(o => o.userPhone)).size;
    const billsSent = todayOrders.filter(o => o.billSent).length;
    return { totalRevenue, totalOrders, pendingCount, confirmedCount, readyCount, noShowCount, noShowLoss, avgOrderValue, uniqueCustomers, billsSent };
  }, [todayOrders]);

  // ── All-time stats for pipeline & analytics ──
  const stats = useMemo(() => {
    const liveOrders = orders.filter(o => o.status !== 'rejected' && o.status !== 'cancelled' && o.status !== 'no_show');
    const totalRevenue = liveOrders.reduce((s, o) => s + o.totalAmount, 0);
    const totalOrders = orders.length;
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const confirmedCount = orders.filter(o => o.status === 'confirmed').length;
    const readyCount = orders.filter(o => o.status === 'ready').length;
    const noShowOrders = orders.filter(o => o.status === 'no_show');
    const noShowCount = noShowOrders.length;
    const noShowLoss = noShowOrders.reduce((s, o) => s + o.totalAmount, 0);
    const dineInOrders = orders.filter(o => o.orderType === 'dine-in' && o.status !== 'rejected' && o.status !== 'cancelled' && o.status !== 'no_show');
    const preOrders = orders.filter(o => o.orderType === 'preorder' && o.status !== 'rejected' && o.status !== 'cancelled' && o.status !== 'no_show');
    const dineInRevenue = dineInOrders.reduce((s, o) => s + o.totalAmount, 0);
    const preOrderRevenue = preOrders.reduce((s, o) => s + o.totalAmount, 0);
    const avgOrderValue = liveOrders.length > 0 ? Math.round(totalRevenue / liveOrders.length) : 0;
    const uniqueCustomers = new Set(orders.map(o => o.userPhone)).size;
    const billsSent = orders.filter(o => o.billSent).length;

    const counts: Record<string, { count: number; revenue: number; emoji: string }> = {};
    orders.filter(o => o.status !== 'rejected' && o.status !== 'cancelled' && o.status !== 'no_show').forEach(o => {
      [...o.items, ...o.additionalRequests].forEach(i => {
        if (!counts[i.menuItem.name]) counts[i.menuItem.name] = { count: 0, revenue: 0, emoji: i.menuItem.emoji };
        counts[i.menuItem.name].count += i.quantity;
        counts[i.menuItem.name].revenue += i.menuItem.price * i.quantity;
      });
    });
    const topItemsList = Object.entries(counts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 6)
      .map(([name, data]) => ({ name, ...data }));
    const maxItemCount = topItemsList.length > 0 ? topItemsList[0].count : 1;

    return {
      liveOrders, totalRevenue, totalOrders, pendingCount, confirmedCount, readyCount,
      noShowCount, noShowLoss, dineInRevenue, preOrderRevenue, avgOrderValue,
      uniqueCustomers, billsSent, topItemsList, maxItemCount,
      dineInCount: dineInOrders.length, preOrderCount: preOrders.length,
    };
  }, [orders]);

  // ── Archive helpers ──
  const archiveMonthOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = subMonths(new Date(), i);
      opts.push({ value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy') });
    }
    return opts;
  }, []);

  const archiveOrders = useMemo(() => {
    const [year, month] = archiveMonth.split('-').map(Number);
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));
    return orders.filter(o => o.createdAt >= start && o.createdAt <= end);
  }, [orders, archiveMonth]);

  const archiveLabel = useMemo(() => {
    const match = archiveMonthOptions.find(o => o.value === archiveMonth);
    return match?.label || archiveMonth;
  }, [archiveMonth, archiveMonthOptions]);

  const handleDownloadCSV = useCallback(async () => {
    if (archiveOrders.length === 0) { toast.error('No orders for this month'); return; }
    setDownloadingCSV(true);
    try {
      exportCSV(archiveOrders, archiveLabel);
      toast.success('CSV downloaded!');
    } catch {
      toast.error('Failed to generate CSV');
    } finally {
      setDownloadingCSV(false);
    }
  }, [archiveOrders, archiveMonth, archiveLabel]);

  const handleDownloadArchivePDF = useCallback(async () => {
    if (archiveOrders.length === 0) { toast.error('No orders for this month'); return; }
    setDownloadingArchivePDF(true);
    try {
      exportArchivePDF(archiveOrders, archiveLabel);
      toast.success('PDF summary downloaded!');
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setDownloadingArchivePDF(false);
    }
  }, [archiveOrders, archiveLabel]);

  const handleDeleteMonthData = useCallback(async () => {
    if (archiveOrders.length === 0) { toast.error('No orders to delete'); setDeleteConfirmStep(0); return; }
    setDeletingMonth(true);
    try {
      const [year, month] = archiveMonth.split('-').map(Number);
      const start = startOfMonth(new Date(year, month - 1)).toISOString();
      const end = endOfMonth(new Date(year, month - 1)).toISOString();

      // Get order IDs for this month
      const { data: monthOrders } = await supabase
        .from('orders')
        .select('id')
        .gte('created_at', start)
        .lte('created_at', end);

      if (monthOrders && monthOrders.length > 0) {
        const orderIds = monthOrders.map(o => o.id);
        // Delete order items first
        for (const oid of orderIds) {
          await supabase.from('order_items').delete().eq('order_id', oid);
        }
        // Delete orders
        await supabase.from('orders').delete().gte('created_at', start).lte('created_at', end);
      }

      toast.success(`Deleted ${archiveOrders.length} orders from ${archiveLabel}`);
      setDeleteConfirmStep(0);
      // Refresh local state to reflect the deletion immediately
      await refreshOrders();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to delete data');
    } finally {
      setDeletingMonth(false);
    }
  }, [archiveMonth, archiveOrders, archiveLabel, refreshOrders]);

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

  const handleARUpload = async (menuItemId: string, file: File) => {
    setUploadingAR(menuItemId);
    try {
      const fileName = `${menuItemId}-${Date.now()}.glb`;
      const { error: uploadError } = await supabase.storage
        .from('ar_models')
        .upload(fileName, file, { contentType: 'model/gltf-binary', upsert: true });

      let finalUrl = '';
      if (uploadError) {
        console.warn('Storage upload RLS blocked, using local blob fallback:', uploadError.message);
        finalUrl = URL.createObjectURL(file);
      } else {
        const { data: urlData } = supabase.storage.from('ar_models').getPublicUrl(fileName);
        finalUrl = urlData.publicUrl;
      }

      await updateMenuItemAR(menuItemId, finalUrl);
      toast.success(uploadError ? 'Model loaded locally (DB prevented upload)' : '3D model uploaded!');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Upload failed');
    } finally {
      setUploadingAR(null);
    }
  };

  const statusConfig: Record<string, { icon: React.ReactNode; label: string; classes: string }> = {
    pending: { icon: <Clock className="h-3 w-3" />, label: 'Pending', classes: 'bg-warning/15 text-warning border-warning/30' },
    confirmed: { icon: <ChefHat className="h-3 w-3" />, label: 'Preparing', classes: 'gradient-warm text-primary-foreground' },
    ready: { icon: <CheckCircle2 className="h-3 w-3" />, label: 'Ready', classes: 'gradient-cool text-accent-foreground' },
    rejected: { icon: <XCircle className="h-3 w-3" />, label: 'Rejected', classes: 'bg-destructive/15 text-destructive' },
    cancelled: { icon: <XCircle className="h-3 w-3" />, label: 'Cancelled', classes: 'bg-muted text-muted-foreground' },
    no_show: { icon: <UserX className="h-3 w-3" />, label: 'No-Show', classes: 'bg-destructive/15 text-destructive' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight" style={{ fontFamily: 'var(--text-display)' }}>
            <span className="text-gradient-warm">Dashboard</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-primary" /> Today's Overview — {format(new Date(), 'dd MMM yyyy')}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge className="bg-accent/15 text-accent border-accent/30 rounded-full px-3 py-1 text-xs font-semibold">
            <span className="relative flex h-2 w-2 mr-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-accent" /></span>
            Live
          </Badge>
          <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full border border-border/50">
            <span className={`text-xs font-bold ${isRestaurantOpen ? 'text-success' : 'text-muted-foreground'}`}>
              {isRestaurantOpen ? 'SHOP OPEN' : 'SHOP CLOSED'}
            </span>
            <Switch checked={isRestaurantOpen} onCheckedChange={async () => {
              try {
                await toggleRestaurantStatus();
                toast.success(isRestaurantOpen ? 'Shop is now CLOSED' : 'Shop is now OPEN');
              } catch (err: any) {
                toast.error(err.message || 'Failed to change shop status');
              }
            }} />
          </div>
        </div>
      </motion.div>

      {/* Today's Stat Cards */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <IndianRupee className="h-4 w-4" />, value: `₹${todayStats.totalRevenue.toLocaleString()}`, label: "Today's Revenue", gradient: 'from-primary/10 to-primary/5', iconBg: 'gradient-warm', glow: 'stat-glow' },
          { icon: <ShoppingBag className="h-4 w-4" />, value: todayStats.totalOrders, label: "Today's Orders", gradient: 'from-accent/10 to-accent/5', iconBg: 'gradient-cool', glow: 'stat-glow-accent' },
          { icon: <Users className="h-4 w-4" />, value: todayStats.uniqueCustomers, label: 'Customers Today', gradient: 'from-info/10 to-info/5', iconBg: 'gradient-ocean', glow: '' },
          { icon: <IndianRupee className="h-4 w-4" />, value: `₹${todayStats.avgOrderValue}`, label: 'Avg Order', gradient: 'from-warning/10 to-warning/5', iconBg: 'bg-warning', glow: '' },
        ].map((stat, idx) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + idx * 0.05 }}>
            <Card className={`p-4 rounded-2xl bg-gradient-to-br ${stat.gradient} border-border/50 card-hover ${stat.glow}`}>
              <div className={`h-8 w-8 rounded-xl ${stat.iconBg} text-primary-foreground flex items-center justify-center mb-2`}>
                {stat.icon}
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-foreground animate-count-up">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Status Pipeline */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="p-4 rounded-2xl">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Order Pipeline</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Pending', count: todayStats.pendingCount, color: 'bg-warning/20 text-warning' },
              { label: 'Preparing', count: todayStats.confirmedCount, color: 'bg-primary/20 text-primary' },
              { label: 'Ready', count: todayStats.readyCount, color: 'bg-accent/20 text-accent' },
              { label: 'No-Show', count: todayStats.noShowCount, color: 'bg-destructive/20 text-destructive' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className={`rounded-xl py-2.5 ${s.color} font-black text-lg`}>{s.count}</div>
                <p className="text-[10px] text-muted-foreground font-medium mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      <Tabs value={ownerTab} onValueChange={setOwnerTab}>
        <TabsList className="w-full grid grid-cols-5 rounded-2xl bg-secondary/80 p-1 h-auto">
          {[
            { value: 'orders', icon: <UtensilsCrossed className="h-3.5 w-3.5" />, label: 'Orders', count: todayStats.pendingCount },
            { value: 'menu', icon: <Package className="h-3.5 w-3.5" />, label: 'Menu' },
            { value: 'analytics', icon: <BarChart3 className="h-3.5 w-3.5" />, label: 'Analytics' },
            { value: 'customers', icon: <Users className="h-3.5 w-3.5" />, label: 'Customers' },
            { value: 'archives', icon: <Archive className="h-3.5 w-3.5" />, label: 'Archives' },
          ].map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="rounded-xl text-[10px] sm:text-sm py-2.5 data-[state=active]:gradient-warm data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg relative">
              {tab.icon}
              <span className="ml-1 hidden sm:inline">{tab.label}</span>
              {tab.count && tab.count > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {tab.count}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="orders">
          <OwnerOrders
            liveOrders={todayOrders.filter(o => o.status !== 'rejected' && o.status !== 'cancelled' && o.status !== 'no_show')}
            orders={orders}
            markNoShow={markNoShow}
            markBillSent={markBillSent}
            setPreviewOrder={setPreviewOrder}
            handleDownloadBill={handleDownloadBill}
          />
        </TabsContent>

        <TabsContent value="menu">
          <OwnerMenuManager
            menu={menu}
            arFileRef={arFileRef}
            handleARUpload={handleARUpload}
            uploadingAR={uploadingAR}
            toggleMenuAvailability={toggleMenuAvailability}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <OwnerAnalytics
            orders={orders}
            menu={menu}
            stats={stats}
            handleExportPDF={handleExportPDF}
            exportingPDF={exportingPDF}
            setPreviewOrder={setPreviewOrder}
            handleDownloadBill={handleDownloadBill}
          />
        </TabsContent>

        <TabsContent value="customers">
          <OwnerCustomers orders={orders} stats={stats} />
        </TabsContent>

        <TabsContent value="archives">
          <OwnerArchives
            archiveMonth={archiveMonth}
            setArchiveMonth={setArchiveMonth}
            archiveMonthOptions={archiveMonthOptions}
            archiveLabel={archiveLabel}
            archiveOrders={archiveOrders}
            handleDownloadCSV={handleDownloadCSV}
            downloadingCSV={downloadingCSV}
            handleDownloadArchivePDF={handleDownloadArchivePDF}
            downloadingArchivePDF={downloadingArchivePDF}
            deleteConfirmStep={deleteConfirmStep}
            setDeleteConfirmStep={setDeleteConfirmStep}
            deletingMonth={deletingMonth}
            handleDeleteMonthData={handleDeleteMonthData}
          />
        </TabsContent>
      </Tabs>

      {/* Bill Preview Dialog */}
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

      {/* Hidden PDF report for export */}
      <MonthlyReportPDF ref={reportRef} orders={orders} />
    </div>
  );
};

export default OwnerSection;
