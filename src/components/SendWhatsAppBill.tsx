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

      let publicUrl = '';
      try {
        const fileName = `bill-${order.id}.png`;
        const { error: uploadError } = await supabase.storage
          .from('bills')
          .upload(fileName, blob, { contentType: 'image/png', upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('bills').getPublicUrl(fileName);
          publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
        } else {
          console.warn('Bill storage upload failed (RLS or bucket missing), sending text-only:', uploadError.message);
        }
      } catch {
        console.warn('Bill storage upload threw, sending text-only message');
      }

      const promoText = `Skip the wait next time! Pre-order 20 mins before you arrive at: ${window.location.origin}`;
      const billLine = publicUrl ? ` Here is your official bill: ${publicUrl}` : '';
      const message = `Hello! Thank you for dining at Curry Corner. Your total is ₹${order.totalAmount}.${billLine}\n\n${promoText}`;
      const cleanPhone = order.userPhone.replace(/\D/g, '');
      const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      const waUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;

      const win = window.open(waUrl, '_blank');
      if (win) {
        onBillSent?.();
        toast.success(publicUrl ? 'Bill sent via WhatsApp!' : 'Bill message sent (image upload unavailable)');
      } else {
        toast.error('Popup blocked! Please allow popups to send WhatsApp bills.');
      }
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
