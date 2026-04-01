import { useState, useRef, useCallback, useMemo } from 'react';
import { useOrders } from '@/context/OrderContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp, UtensilsCrossed, BarChart3, Zap, FileText, Download, Eye,
  IndianRupee, ShoppingBag, UserX, Upload, Loader2, Users, AlertTriangle,
  Clock, CheckCircle2, XCircle, ChefHat, ArrowUpRight, ArrowDownRight,
  CalendarDays, Percent, Star, Package, Archive, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { generateBillText } from '@/lib/phone';
import { Order } from '@/types/order';
import SendWhatsAppBill from './SendWhatsAppBill';
import BillReceipt from './BillReceipt';
import BlacklistBanner from './BlacklistBanner';
import MonthlyReportPDF from './MonthlyReportPDF';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { startOfDay, isToday, format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const OwnerSection = () => {
  const { orders, menu, toggleMenuAvailability, markBillSent, markNoShow, updateMenuItemAR, salesData, topItems } = useOrders();
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
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight);
      const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' }).replace(' ', '_');
      pdf.save(`CurryCorner_Report_${month}.pdf`);
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
    const live = todayOrders.filter(o => o.status !== 'rejected' && o.status !== 'no_show');
    const totalRevenue = live.reduce((s, o) => s + o.totalAmount, 0);
    const totalOrders = todayOrders.length;
    const noShowOrders = todayOrders.filter(o => o.status === 'no_show');
    const noShowCount = noShowOrders.length;
    const noShowLoss = noShowOrders.reduce((s, o) => s + o.totalAmount, 0);
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / (totalOrders - noShowCount || 1)) : 0;
    const uniqueCustomers = new Set(todayOrders.map(o => o.userPhone)).size;
    const billsSent = todayOrders.filter(o => o.billSent).length;
    return { totalRevenue, totalOrders, noShowCount, noShowLoss, avgOrderValue, uniqueCustomers, billsSent };
  }, [todayOrders]);

  // ── All-time stats for pipeline & analytics ──
  const stats = useMemo(() => {
    const liveOrders = orders.filter(o => o.status !== 'rejected' && o.status !== 'no_show');
    const totalRevenue = liveOrders.reduce((s, o) => s + o.totalAmount, 0);
    const totalOrders = orders.length;
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const confirmedCount = orders.filter(o => o.status === 'confirmed').length;
    const readyCount = orders.filter(o => o.status === 'ready').length;
    const noShowOrders = orders.filter(o => o.status === 'no_show');
    const noShowCount = noShowOrders.length;
    const noShowLoss = noShowOrders.reduce((s, o) => s + o.totalAmount, 0);
    const dineInOrders = orders.filter(o => o.orderType === 'dine-in' && o.status !== 'rejected');
    const preOrders = orders.filter(o => o.orderType === 'preorder' && o.status !== 'rejected');
    const dineInRevenue = dineInOrders.reduce((s, o) => s + o.totalAmount, 0);
    const preOrderRevenue = preOrders.reduce((s, o) => s + o.totalAmount, 0);
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / (totalOrders - noShowCount || 1)) : 0;
    const uniqueCustomers = new Set(orders.map(o => o.userPhone)).size;
    const billsSent = orders.filter(o => o.billSent).length;

    const counts: Record<string, { count: number; revenue: number; emoji: string }> = {};
    orders.filter(o => o.status !== 'rejected').forEach(o => {
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
      const headers = ['Name', 'Phone Number', 'Order ID', 'Amount', 'Date'];
      const rows = archiveOrders.map(o => [
        o.customerName || 'Unknown',
        o.userPhone,
        o.id,
        o.totalAmount.toString(),
        format(o.createdAt, 'yyyy-MM-dd HH:mm'),
      ]);
      const csvContent = [headers, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const [y, m] = archiveMonth.split('-');
      a.download = `CurryCorner_Bills_${archiveLabel.replace(' ', '_')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
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
      const totalRev = archiveOrders.filter(o => o.status !== 'rejected' && o.status !== 'no_show').reduce((s, o) => s + o.totalAmount, 0);
      const noShowLoss = archiveOrders.filter(o => o.status === 'no_show').reduce((s, o) => s + o.totalAmount, 0);
      const counts: Record<string, number> = {};
      archiveOrders.filter(o => o.status !== 'rejected').forEach(o => {
        [...o.items, ...o.additionalRequests].forEach(i => {
          counts[i.menuItem.name] = (counts[i.menuItem.name] || 0) + i.quantity;
        });
      });
      const top5 = Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 5);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const w = pdf.internal.pageSize.getWidth();

      pdf.setFillColor(229, 81, 0);
      pdf.rect(0, 0, w, 40, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text('The Curry Corner', 20, 22);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Monthly Summary — ${archiveLabel}`, 20, 32);

      let y = 55;
      pdf.setTextColor(50, 50, 50);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Summary', 20, y); y += 10;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total Monthly Revenue: Rs ${totalRev.toLocaleString()}`, 20, y); y += 8;
      pdf.text(`Total Orders: ${archiveOrders.length}`, 20, y); y += 8;
      pdf.text(`Revenue Lost to No-Shows: Rs ${noShowLoss.toLocaleString()}`, 20, y); y += 15;

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Top 5 Best-Selling Items', 20, y); y += 10;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      top5.forEach(([name, count], idx) => {
        pdf.text(`${idx + 1}. ${name} — ${count} sold`, 25, y); y += 7;
      });
      if (top5.length === 0) { pdf.text('No items sold this month', 25, y); y += 7; }

      y += 10;
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated on ${format(new Date(), 'dd MMM yyyy')} — The Curry Corner POS`, 20, y);

      pdf.save(`CurryCorner_Summary_${archiveLabel.replace(' ', '_')}.pdf`);
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
      // Force refresh via realtime
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete data');
    } finally {
      setDeletingMonth(false);
    }
  }, [archiveMonth, archiveOrders, archiveLabel]);

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
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('ar_models').getPublicUrl(fileName);
      await updateMenuItemAR(menuItemId, urlData.publicUrl);
      toast.success('3D model uploaded!');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingAR(null);
    }
  };

  const statusConfig: Record<string, { icon: React.ReactNode; label: string; classes: string }> = {
    pending: { icon: <Clock className="h-3 w-3" />, label: 'Pending', classes: 'bg-warning/15 text-warning border-warning/30' },
    confirmed: { icon: <ChefHat className="h-3 w-3" />, label: 'Preparing', classes: 'gradient-warm text-primary-foreground' },
    ready: { icon: <CheckCircle2 className="h-3 w-3" />, label: 'Ready', classes: 'gradient-cool text-accent-foreground' },
    rejected: { icon: <XCircle className="h-3 w-3" />, label: 'Rejected', classes: 'bg-destructive/15 text-destructive' },
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
        <Badge className="bg-accent/15 text-accent border-accent/30 rounded-full px-3 py-1 text-xs font-semibold">
          <span className="relative flex h-2 w-2 mr-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-accent" /></span>
          Live
        </Badge>
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
              { label: 'Pending', count: stats.pendingCount, color: 'bg-warning/20 text-warning' },
              { label: 'Preparing', count: stats.confirmedCount, color: 'bg-primary/20 text-primary' },
              { label: 'Ready', count: stats.readyCount, color: 'bg-accent/20 text-accent' },
              { label: 'No-Show', count: stats.noShowCount, color: 'bg-destructive/20 text-destructive' },
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
            { value: 'orders', icon: <UtensilsCrossed className="h-3.5 w-3.5" />, label: 'Orders', count: stats.pendingCount },
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

        {/* ═══════ ORDERS TAB ═══════ */}
        <TabsContent value="orders" className="space-y-4 mt-6">
          {stats.liveOrders.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-muted-foreground">
              <UtensilsCrossed className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No active orders</p>
              <p className="text-sm">Orders will appear here in real-time</p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {stats.liveOrders.map((order, idx) => {
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
                            onClick={() => { markNoShow(order.id); toast.error('Customer marked as No-Show'); }}
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
          )}
        </TabsContent>

        {/* ═══════ MENU TAB ═══════ */}
        <TabsContent value="menu" className="space-y-2 mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground font-medium">Toggle availability & upload 3D models</p>
            <Badge className="bg-secondary text-muted-foreground rounded-full text-xs">{menu.length} items</Badge>
          </div>
          <input ref={arFileRef} type="file" accept=".glb" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            const itemId = arFileRef.current?.dataset.itemId;
            if (file && itemId) handleARUpload(itemId, file);
            e.target.value = '';
          }} />
          <Card className="rounded-2xl overflow-hidden divide-y divide-border/30">
            {menu.map((item, idx) => (
              <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.02 }}
                className="flex items-center justify-between py-3.5 px-4 hover:bg-secondary/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`text-2xl w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center ${!item.available ? 'opacity-40 grayscale' : ''}`}>
                    {item.emoji}
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${item.available ? 'text-foreground' : 'text-muted-foreground line-through'}`}>{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{item.category}</span>
                      <span className="text-xs font-bold text-primary">₹{item.price}</span>
                      {(item as any).ar_model_url && (
                        <Badge className="bg-accent/15 text-accent text-[9px] rounded-full px-1.5 py-0 font-semibold">🧊 3D</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm" variant="ghost"
                    className="h-8 w-8 p-0 rounded-lg hover:bg-secondary"
                    disabled={uploadingAR === item.id}
                    onClick={() => {
                      if (arFileRef.current) {
                        arFileRef.current.dataset.itemId = item.id;
                        arFileRef.current.click();
                      }
                    }}
                  >
                    {uploadingAR === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  </Button>
                  <Switch checked={item.available} onCheckedChange={() => toggleMenuAvailability(item.id)} />
                </div>
              </motion.div>
            ))}
          </Card>
        </TabsContent>

        {/* ═══════ ANALYTICS TAB ═══════ */}
        <TabsContent value="analytics" className="space-y-5 mt-6">
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
                {stats.topItemsList.map((item, idx) => (
                  <motion.div key={item.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }}
                    className="flex items-center gap-3">
                    <span className={`text-xs font-extrabold w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      idx === 0 ? 'gradient-warm text-primary-foreground shadow-lg shadow-primary/20' :
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
        </TabsContent>

        {/* ═══════ CUSTOMERS TAB ═══════ */}
        <TabsContent value="customers" className="space-y-5 mt-6">
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
                      customerMap[key] = { name: o.customerName, phone: o.userPhone, orders: 0, totalSpent: 0, noShows: 0, lastOrder: o.createdAt };
                    }
                    customerMap[key].orders++;
                    customerMap[key].totalSpent += o.totalAmount;
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
        </TabsContent>

        {/* ═══════ ARCHIVES TAB ═══════ */}
        <TabsContent value="archives" className="space-y-5 mt-6">
          <Card className="p-5 rounded-2xl space-y-5">
            <div>
              <h4 className="font-bold text-foreground text-base flex items-center gap-2 mb-1">
                <Archive className="h-4 w-4 text-primary" /> Monthly Archives
              </h4>
              <p className="text-sm text-muted-foreground">Download reports or manage historical order data</p>
            </div>

            {/* Month Selector */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Select Month</label>
              <Select value={archiveMonth} onValueChange={setArchiveMonth}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {archiveMonthOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                {archiveLabel}: <span className="font-bold text-foreground">{archiveOrders.length}</span> orders • ₹
                <span className="font-bold text-primary">
                  {archiveOrders.filter(o => o.status !== 'rejected' && o.status !== 'no_show').reduce((s, o) => s + o.totalAmount, 0).toLocaleString()}
                </span> revenue
              </p>
            </div>

            {/* Download CSV */}
            <Button
              onClick={handleDownloadCSV}
              disabled={downloadingCSV || archiveOrders.length === 0}
              className="w-full rounded-xl h-12 font-semibold gradient-cool text-accent-foreground"
            >
              {downloadingCSV ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Download Detailed Bills (CSV)
            </Button>

            {/* Download PDF */}
            <Button
              onClick={handleDownloadArchivePDF}
              disabled={downloadingArchivePDF || archiveOrders.length === 0}
              className="w-full rounded-xl h-12 font-semibold gradient-warm text-primary-foreground"
            >
              {downloadingArchivePDF ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
              Download Monthly Summary (PDF)
            </Button>

            {/* Danger Zone */}
            <div className="border-2 border-destructive/20 rounded-xl p-4 space-y-3 bg-destructive/5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <p className="text-sm font-bold text-destructive">Danger Zone</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Permanently delete all <span className="font-bold text-foreground">{archiveOrders.length}</span> orders from {archiveLabel}. This action cannot be undone.
              </p>
              <Button
                variant="destructive"
                className="w-full rounded-xl h-11 font-semibold"
                disabled={archiveOrders.length === 0 || deletingMonth}
                onClick={() => setDeleteConfirmStep(1)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete {archiveLabel} Data
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Step 1 */}
      <AlertDialog open={deleteConfirmStep === 1} onOpenChange={(open) => !open && setDeleteConfirmStep(0)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Delete {archiveLabel} Data?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-bold">{archiveOrders.length} orders</span> from {archiveLabel}. 
              This action cannot be undone. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
              onClick={(e) => { e.preventDefault(); setDeleteConfirmStep(2); }}
            >
              Yes, continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Step 2 (Final) */}
      <AlertDialog open={deleteConfirmStep === 2} onOpenChange={(open) => !open && setDeleteConfirmStep(0)}>
        <AlertDialogContent className="rounded-2xl border-destructive/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Are you ABSOLUTELY sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-bold text-destructive">⚠️ This cannot be undone.</p>
              <p>You are about to permanently delete <span className="font-bold">{archiveOrders.length} orders</span> and all associated items from <span className="font-bold">{archiveLabel}</span>.</p>
              <p>All revenue data, customer records, and bill history for this month will be lost forever.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" onClick={() => setDeleteConfirmStep(0)}>Go back</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
              disabled={deletingMonth}
              onClick={(e) => { e.preventDefault(); handleDeleteMonthData(); }}
            >
              {deletingMonth ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
