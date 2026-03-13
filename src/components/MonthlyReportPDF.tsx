import React, { forwardRef } from 'react';
import { Order } from '@/types/order';

interface MonthlyReportPDFProps {
  orders: Order[];
}

const MonthlyReportPDF = forwardRef<HTMLDivElement, MonthlyReportPDFProps>(({ orders }, ref) => {
  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = orders.length;

  const noShowOrders = orders.filter(o => o.status === 'no_show');
  const noShowRevenue = noShowOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Top 5 items
  const counts: Record<string, number> = {};
  orders.forEach(o => {
    [...o.items, ...o.additionalRequests].forEach(i => {
      counts[i.menuItem.name] = (counts[i.menuItem.name] || 0) + i.quantity;
    });
  });
  const topItems = Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 5);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 0,
        width: '794px', // A4 width at 96dpi
        padding: '48px',
        background: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#1a1a2e',
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: '3px solid #e65100', paddingBottom: '20px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: '#e65100' }}>
              🍛 The Curry Corner
            </h1>
            <p style={{ fontSize: '16px', color: '#666', margin: '4px 0 0' }}>Monthly Analytics Report</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: '#333' }}>{monthName}</p>
            <p style={{ fontSize: '12px', color: '#999', margin: '2px 0 0' }}>
              Generated: {now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#fff3e0', borderRadius: '12px', padding: '20px', border: '1px solid #ffe0b2' }}>
          <p style={{ fontSize: '12px', color: '#e65100', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Revenue</p>
          <p style={{ fontSize: '32px', fontWeight: 800, margin: '8px 0 0', color: '#e65100' }}>₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div style={{ background: '#e8f5e9', borderRadius: '12px', padding: '20px', border: '1px solid #c8e6c9' }}>
          <p style={{ fontSize: '12px', color: '#2e7d32', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Orders</p>
          <p style={{ fontSize: '32px', fontWeight: 800, margin: '8px 0 0', color: '#2e7d32' }}>{totalOrders}</p>
        </div>
        <div style={{ background: '#ffebee', borderRadius: '12px', padding: '20px', border: '1px solid #ffcdd2' }}>
          <p style={{ fontSize: '12px', color: '#c62828', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>No-Show Loss</p>
          <p style={{ fontSize: '32px', fontWeight: 800, margin: '8px 0 0', color: '#c62828' }}>₹{noShowRevenue.toLocaleString()}</p>
          <p style={{ fontSize: '11px', color: '#999', margin: '4px 0 0' }}>{noShowOrders.length} no-show order{noShowOrders.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Top 5 Best-Selling Items */}
      <div style={{ background: '#fafafa', borderRadius: '12px', padding: '24px', border: '1px solid #eee', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px', color: '#1a1a2e' }}>🏆 Top 5 Best-Selling Items</h2>
        {topItems.length === 0 ? (
          <p style={{ color: '#999', fontSize: '14px' }}>No order data available</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '12px', color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rank</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '12px', color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Item Name</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: '12px', color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qty Sold</th>
              </tr>
            </thead>
            <tbody>
              {topItems.map(([name, count], idx) => (
                <tr key={name} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px', fontSize: '14px', fontWeight: 700, color: idx === 0 ? '#e65100' : '#333' }}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', fontWeight: 500, color: '#333' }}>{name}</td>
                  <td style={{ padding: '12px', fontSize: '14px', fontWeight: 700, color: '#e65100', textAlign: 'right' }}>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #eee', paddingTop: '16px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', color: '#bbb', margin: 0 }}>
          This report was auto-generated by The Curry Corner POS System • {now.getFullYear()}
        </p>
      </div>
    </div>
  );
});

MonthlyReportPDF.displayName = 'MonthlyReportPDF';

export default MonthlyReportPDF;
