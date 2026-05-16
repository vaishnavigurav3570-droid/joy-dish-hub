import React from 'react';
import { Order } from '@/types/order';
import { motion } from 'framer-motion';

interface BlacklistBannerProps {
  order: Order;
  allOrders: Order[];
}

const BlacklistBanner: React.FC<BlacklistBannerProps> = ({ order, allOrders }) => {
  // Check if this customer has any previous no_show orders (by phone match)
  const noShowOrders = allOrders.filter(
    o => o.id !== order.id && o.status === 'no_show' && o.userPhone === order.userPhone
  );

  if (noShowOrders.length === 0) return null;

  const totalLoss = noShowOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0.8 }}
      animate={{ opacity: 1, scaleY: 1 }}
      className="rounded-xl border-2 border-destructive bg-destructive/10 p-3 mb-3"
    >
      <p className="text-destructive font-extrabold text-sm flex items-center gap-1.5">
        🚨 BLACKLISTED CUSTOMER — {noShowOrders.length} Previous No-Show{noShowOrders.length > 1 ? 's' : ''}
      </p>
      <p className="text-destructive/80 text-xs mt-1">
        Total unpaid: <span className="font-bold">₹{totalLoss.toLocaleString()}</span>
      </p>
    </motion.div>
  );
};

export default BlacklistBanner;
