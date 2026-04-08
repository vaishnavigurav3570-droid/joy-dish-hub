import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Order } from '@/types/order';
import BillReceipt from './BillReceipt';

interface SendWhatsAppBillProps {
  order: Order;
  onBillSent?: () => void;
}

const SendWhatsAppBill: React.FC<SendWhatsAppBillProps> = ({ order, onBillSent }) => {
  const billRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!billRef.current) return;
    setLoading(true);

    try {
      const canvas = await html2canvas(billRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFF8F0',
      });

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Failed to create image'))), 'image/png');
      });

      const fileName = `bill-${order.id}-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('bills')
        .upload(fileName, blob, { contentType: 'image/png', upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('bills').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      const promoText = `Skip the wait next time! Pre-order 20 mins before you arrive at: ${window.location.origin}`;
      const reviewText = `Thank you for choosing Curry Corner! 🍛 If you loved your meal, please take 10 seconds to leave us a 5-star review here: https://g.page/r/YOUR_SHORT_LINK_HERE`;
      const message = `Hello! Thank you for dining at Curry Corner. Your total is ₹${order.totalAmount}. Here is your official bill: ${publicUrl}\n\n${promoText}\n\n${reviewText}`;
      const cleanPhone = order.userPhone.replace(/\D/g, '');
      const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      const waUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;

      window.open(waUrl, '_blank');
      onBillSent?.();
      toast.success('Bill sent via WhatsApp!');
    } catch (err: unknown) {
      console.error('WhatsApp bill error:', err);
      toast.error((err as Error).message || 'Failed to send bill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <BillReceipt ref={billRef} order={order} />
      </div>

      <Button
        onClick={handleSend}
        disabled={loading}
        className="w-full gradient-warm text-primary-foreground rounded-xl font-semibold"
        size="sm"
      >
        {loading ? (
          <>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Generating Bill…
          </>
        ) : (
          <>
            <MessageCircle className="h-3 w-3 mr-1" /> Send Bill via WhatsApp
          </>
        )}
      </Button>
    </div>
  );
};

export default SendWhatsAppBill;
