import React, { forwardRef } from 'react';
import { Order } from '@/types/order';

interface BillReceiptProps {
  order: Order;
}

const BillReceipt = forwardRef<HTMLDivElement, BillReceiptProps>(({ order }, ref) => {
  const allItems = [
    ...order.items.map(i => ({ name: i.menuItem.name, qty: i.quantity, price: i.menuItem.price })),
    ...order.additionalRequests.map(i => ({ name: i.menuItem.name, qty: i.quantity, price: i.menuItem.price })),
  ];

  return (
    <div
      ref={ref}
      style={{
        width: 400,
        padding: 32,
        background: 'linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 100%)',
        fontFamily: "'Segoe UI', sans-serif",
        color: '#1a1a1a',
        borderRadius: 16,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 36, marginBottom: 4 }}>🍛</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#C2410C', letterSpacing: 1 }}>
          THE CURRY CORNER
        </h1>
        <p style={{ fontSize: 11, color: '#78716c', margin: '4px 0 0', letterSpacing: 2, textTransform: 'uppercase' }}>
          Restaurant Bill
        </p>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '2px dashed #e7e5e4', margin: '0 0 16px' }} />

      {/* Order Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#57534e', marginBottom: 12 }}>
        <div>
          <p style={{ margin: 0 }}><strong>Order:</strong> {order.id}</p>
          <p style={{ margin: '2px 0 0' }}><strong>{order.orderType === 'preorder' ? 'Type:' : 'Table:'}</strong> {order.orderType === 'preorder' ? 'Pre-order Pickup' : order.tableNumber}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0 }}><strong>Customer:</strong> {order.customerName}</p>
          <p style={{ margin: '2px 0 0' }}>{order.createdAt.toLocaleDateString('en-IN')}</p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #e7e5e4', margin: '8px 0 12px' }} />

      {/* Items header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>
        <span>Item</span>
        <span>Amount</span>
      </div>

      {/* Item rows */}
      {allItems.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid #f5f5f4' }}>
          <span style={{ fontWeight: 500 }}>
            {item.name} <span style={{ color: '#a8a29e' }}>× {item.qty}</span>
          </span>
          <span style={{ fontWeight: 600 }}>₹{item.price * item.qty}</span>
        </div>
      ))}

      {/* Total */}
      <div style={{ borderTop: '2px solid #C2410C', marginTop: 16, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#44403c' }}>TOTAL</span>
        <span style={{ fontSize: 22, fontWeight: 800, color: '#C2410C' }}>₹{order.totalAmount}</span>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 12, borderTop: '2px dashed #e7e5e4' }}>
        <p style={{ fontSize: 12, color: '#78716c', margin: 0 }}>Thank you for dining with us! 🙏</p>
        <p style={{ fontSize: 10, color: '#a8a29e', margin: '4px 0 0' }}>Visit again — The Curry Corner</p>
      </div>
    </div>
  );
});

BillReceipt.displayName = 'BillReceipt';
export default BillReceipt;
