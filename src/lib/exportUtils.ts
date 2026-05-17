import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { Order } from '@/types/order';
import type React from 'react';

export const exportPDFReport = async (reportRef: React.RefObject<HTMLDivElement>) => {
  if (!reportRef.current) throw new Error("No report ref");
  const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const imgHeight = (canvas.height * pageWidth) / canvas.width;
  pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight);
  const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' }).replace(/\s+/g, '_');
  pdf.save(`CurryCorner_Report_${month}.pdf`);
};

export const exportCSV = (archiveOrders: Order[], archiveLabel: string) => {
  if (archiveOrders.length === 0) throw new Error('No orders for this month');
  const headers = ['Name', 'Phone Number', 'Order ID', 'Amount', 'Status', 'Order Type', 'Items', 'Date'];
  const rows = archiveOrders.map((o: Order) => [
    o.customerName || 'Unknown',
    o.userPhone,
    o.id,
    o.totalAmount.toString(),
    o.status,
    o.orderType,
    [...o.items, ...o.additionalRequests].map(i => `${i.menuItem.name} x${i.quantity}`).join('; '),
    format(o.createdAt, 'yyyy-MM-dd HH:mm'),
  ]);
  const csvContent = [headers, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CurryCorner_Bills_${archiveLabel.replace(/ /g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportArchivePDF = (archiveOrders: Order[], archiveLabel: string) => {
  if (archiveOrders.length === 0) throw new Error('No orders for this month');

  const pdf = new jsPDF('p', 'mm', 'a4');
  const w = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const marginL = 15;
  const marginR = 15;
  const contentW = w - marginL - marginR;

  // Helper: check if we need a new page
  const checkPage = (neededSpace: number) => {
    if (y + neededSpace > pageH - 20) {
      pdf.addPage();
      y = 20;
    }
  };

  // ── Filter valid revenue orders ──
  const revenueOrders = archiveOrders.filter(o => o.status !== 'rejected' && o.status !== 'cancelled' && o.status !== 'no_show');
  const totalRevenue = revenueOrders.reduce((s, o) => s + o.totalAmount, 0);
  const noShowOrders = archiveOrders.filter(o => o.status === 'no_show');
  const noShowLoss = noShowOrders.reduce((s, o) => s + o.totalAmount, 0);

  // ── HEADER ──
  pdf.setFillColor(229, 81, 0);
  pdf.rect(0, 0, w, 42, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('The Curry Corner', marginL, 18);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Monthly Report — ${archiveLabel}`, marginL, 28);
  pdf.setFontSize(9);
  pdf.text(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, marginL, 36);

  let y = 52;

  // ── MONTHLY SUMMARY BOX ──
  pdf.setFillColor(255, 248, 240);
  pdf.roundedRect(marginL, y, contentW, 30, 3, 3, 'F');
  pdf.setDrawColor(229, 81, 0);
  pdf.roundedRect(marginL, y, contentW, 30, 3, 3, 'S');

  const col1 = marginL + 10;
  const col2 = marginL + contentW / 3 + 5;
  const col3 = marginL + (contentW * 2) / 3 + 5;

  pdf.setTextColor(150, 150, 150);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('TOTAL REVENUE', col1, y + 10);
  pdf.text('TOTAL ORDERS', col2, y + 10);
  pdf.text('NO-SHOW LOSS', col3, y + 10);

  pdf.setTextColor(229, 81, 0);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Rs ${totalRevenue.toLocaleString()}`, col1, y + 22);
  pdf.setTextColor(50, 50, 50);
  pdf.text(`${archiveOrders.length}`, col2, y + 22);
  pdf.setTextColor(200, 40, 40);
  pdf.text(`Rs ${noShowLoss.toLocaleString()}`, col3, y + 22);

  y += 40;

  // ── DAY-BY-DAY BREAKDOWN ──
  pdf.setTextColor(229, 81, 0);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Day-by-Day Breakdown', marginL, y);
  y += 3;
  pdf.setDrawColor(229, 81, 0);
  pdf.setLineWidth(0.5);
  pdf.line(marginL, y, marginL + 60, y);
  y += 10;

  // Build days from the actual orders' dates
  const firstOrder = archiveOrders.reduce((min, o) => o.createdAt < min ? o.createdAt : min, archiveOrders[0].createdAt);
  const lastOrder = archiveOrders.reduce((max, o) => o.createdAt > max ? o.createdAt : max, archiveOrders[0].createdAt);
  const monthStart = startOfMonth(firstOrder);
  const monthEnd = endOfMonth(firstOrder);
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd > new Date() ? new Date() : monthEnd });

  allDays.forEach(day => {
    const dayOrders = archiveOrders.filter(o => isSameDay(o.createdAt, day));
    if (dayOrders.length === 0) return; // Skip days with no orders

    const dayRevenue = dayOrders
      .filter(o => o.status !== 'rejected' && o.status !== 'cancelled' && o.status !== 'no_show')
      .reduce((s, o) => s + o.totalAmount, 0);

    // Collect items sold this day
    const dayItems: Record<string, number> = {};
    dayOrders
      .filter(o => o.status !== 'rejected' && o.status !== 'cancelled' && o.status !== 'no_show')
      .forEach(o => {
        [...o.items, ...o.additionalRequests].forEach(i => {
          dayItems[i.menuItem.name] = (dayItems[i.menuItem.name] || 0) + i.quantity;
        });
      });
    const sortedItems = Object.entries(dayItems).sort(([, a], [, b]) => b - a);

    // Calculate space needed: date header (8) + items (5 each) + revenue line (8) + spacing (6)
    const blockHeight = 8 + Math.min(sortedItems.length, 10) * 5 + 8 + 8;
    checkPage(blockHeight);

    // Day header
    pdf.setFillColor(245, 245, 245);
    pdf.rect(marginL, y - 4, contentW, 8, 'F');
    pdf.setTextColor(50, 50, 50);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(format(day, 'EEEE, dd MMM yyyy'), marginL + 3, y + 1);
    pdf.setTextColor(229, 81, 0);
    pdf.setFontSize(10);
    pdf.text(`${dayOrders.length} orders`, marginL + contentW - 30, y + 1);
    y += 8;

    // Items
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    sortedItems.slice(0, 10).forEach(([name, qty]) => {
      pdf.text(`  ${name}`, marginL + 5, y);
      pdf.text(`x${qty}`, marginL + contentW - 15, y);
      y += 5;
    });
    if (sortedItems.length > 10) {
      pdf.setTextColor(150, 150, 150);
      pdf.text(`  ...and ${sortedItems.length - 10} more items`, marginL + 5, y);
      y += 5;
    }

    // Day total
    pdf.setTextColor(229, 81, 0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Day Revenue: Rs ${dayRevenue.toLocaleString()}`, marginL + 5, y + 2);
    y += 10;

    // Separator
    pdf.setDrawColor(230, 230, 230);
    pdf.setLineWidth(0.2);
    pdf.line(marginL + 10, y - 3, marginL + contentW - 10, y - 3);
  });

  // ── TOP SELLING ITEMS (MONTH) ──
  checkPage(60);
  y += 5;
  pdf.setTextColor(229, 81, 0);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Top Selling Items — Full Month', marginL, y);
  y += 3;
  pdf.setDrawColor(229, 81, 0);
  pdf.setLineWidth(0.5);
  pdf.line(marginL, y, marginL + 70, y);
  y += 10;

  const monthCounts: Record<string, number> = {};
  revenueOrders.forEach(o => {
    [...o.items, ...o.additionalRequests].forEach(i => {
      monthCounts[i.menuItem.name] = (monthCounts[i.menuItem.name] || 0) + i.quantity;
    });
  });
  const topMonth = Object.entries(monthCounts).sort(([, a], [, b]) => b - a).slice(0, 10);

  // Table header
  pdf.setFillColor(229, 81, 0);
  pdf.rect(marginL, y - 4, contentW, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RANK', marginL + 5, y + 1);
  pdf.text('ITEM NAME', marginL + 25, y + 1);
  pdf.text('QTY SOLD', marginL + contentW - 30, y + 1);
  y += 8;

  topMonth.forEach(([name, count], idx) => {
    checkPage(7);
    const bg = idx % 2 === 0 ? 255 : 248;
    pdf.setFillColor(bg, bg, bg);
    pdf.rect(marginL, y - 4, contentW, 7, 'F');

    pdf.setTextColor(idx < 3 ? 229 : 80, idx < 3 ? 81 : 80, idx < 3 ? 0 : 80);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', idx < 3 ? 'bold' : 'normal');
    const medal = idx === 0 ? '#1' : idx === 1 ? '#2' : idx === 2 ? '#3' : `#${idx + 1}`;
    pdf.text(medal, marginL + 8, y);
    pdf.setTextColor(50, 50, 50);
    pdf.text(name, marginL + 25, y);
    pdf.setTextColor(229, 81, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${count}`, marginL + contentW - 20, y);
    y += 7;
  });

  if (topMonth.length === 0) {
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(10);
    pdf.text('No items sold this month', marginL + 25, y);
    y += 7;
  }

  // ── GRAND TOTAL FOOTER ──
  checkPage(30);
  y += 10;
  pdf.setFillColor(229, 81, 0);
  pdf.roundedRect(marginL, y, contentW, 18, 3, 3, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`TOTAL MONTHLY REVENUE: Rs ${totalRevenue.toLocaleString()}`, marginL + 10, y + 12);

  y += 28;
  checkPage(10);
  pdf.setFontSize(7);
  pdf.setTextColor(180, 180, 180);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`This report was auto-generated by The Curry Corner POS System on ${format(new Date(), 'dd MMM yyyy')}`, marginL, y);

  pdf.save(`CurryCorner_Monthly_${archiveLabel.replace(/ /g, '_')}.pdf`);
};
