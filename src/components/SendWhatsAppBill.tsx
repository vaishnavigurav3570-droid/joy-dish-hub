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
      // 1. Screenshot the bill
      const canvas = await html2canvas(billRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFF8F0',
      });

      // 2. Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Failed to create image'))), 'image/png');
      });

      // 3. Upload to storage
      const fileName = `bill-${order.id}-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('bills')
        .upload(fileName, blob, { contentType: 'image/png', upsert: true });

      if (uploadError) throw uploadError;

      // 4. Get public URL
      const { data: urlData } = supabase.storage.from('bills').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      // 5. Build WhatsApp message
      const message = `Hello! Thank you for dining at Curry Corner. Your total is ₹${order.totalAmount}. Here is your official bill: ${publicUrl}`;
      const cleanPhone = order.userPhone.replace(/\D/g, '');
      const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      const waUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;

      // 6. Open WhatsApp
      window.open(waUrl, '_blank');
      onBillSent?.();
      toast.success('Bill sent via WhatsApp!');
    } catch (err: any) {
      console.error('WhatsApp bill error:', err);
      toast.error(err.message || 'Failed to send bill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden off-screen render for html2canvas */}
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
