import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
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
  const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' }).replace(' ', '_');
  pdf.save(`CurryCorner_Report_${month}.pdf`);
};

export const exportCSV = (archiveOrders: Order[], archiveLabel: string) => {
  if (archiveOrders.length === 0) throw new Error('No orders for this month');
  const headers = ['Name', 'Phone Number', 'Order ID', 'Amount', 'Date'];
  const rows = archiveOrders.map((o: Order) => [
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
  a.download = `CurryCorner_Bills_${archiveLabel.replace(' ', '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportArchivePDF = (archiveOrders: Order[], archiveLabel: string) => {
  if (archiveOrders.length === 0) throw new Error('No orders for this month');
  const totalRev = archiveOrders.filter((o: Order) => o.status !== 'rejected' && o.status !== 'no_show').reduce((s: number, o: Order) => s + o.totalAmount, 0);
  const noShowLoss = archiveOrders.filter((o: Order) => o.status === 'no_show').reduce((s: number, o: Order) => s + o.totalAmount, 0);
  const counts: Record<string, number> = {};
  archiveOrders.filter((o: Order) => o.status !== 'rejected').forEach((o: Order) => {
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
};
