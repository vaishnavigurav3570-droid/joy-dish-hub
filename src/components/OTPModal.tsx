import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Phone, ShieldCheck, User } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface OTPModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (phone: string, name: string) => void;
}

const OTPModal: React.FC<OTPModalProps> = ({ open, onClose, onSuccess }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const fullPhone = phone.startsWith('+91') ? phone : `+91${phone.replace(/^91/, '')}`;

  const handleSendOTP = async () => {
    if (!fullName.trim()) { toast.error('Please enter your name'); return; }
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10 || !/^[6-9]/.test(digits)) {
      toast.error('Enter a valid 10-digit Indian mobile number');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
      if (error) throw error;
      setStep('otp');
      toast.success('OTP sent to your phone!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) { toast.error('Enter the 6-digit OTP'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: otp,
        type: 'sms',
      });
      if (error) throw error;

      // Update user metadata with full name
      await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      });

      toast.success(`Welcome, ${fullName.trim()}! 🎉`);
      const cleanDigits = phone.replace(/\D/g, '');
      onSuccess(cleanDigits, fullName.trim());
      resetAndClose();
    } catch (err: any) {
      toast.error(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep('phone');
    setOtp('');
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && resetAndClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {step === 'phone' ? 'Verify Your Phone' : 'Enter OTP'}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'phone' ? (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4 pt-2"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Full Name
                </label>
                <Input
                  className="rounded-xl h-12"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> Phone Number
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-secondary rounded-xl text-sm font-semibold text-muted-foreground h-12 shrink-0">
                    +91
                  </div>
                  <Input
                    className="rounded-xl h-12"
                    placeholder="10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    type="tel"
                    maxLength={10}
                  />
                </div>
              </div>

              <Button
                className="w-full gradient-warm text-primary-foreground rounded-xl h-12 font-bold text-base"
                onClick={handleSendOTP}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Phone className="h-4 w-4 mr-2" />}
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </Button>

              <p className="text-[11px] text-muted-foreground text-center">
                We'll send a one-time code to verify your number
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5 pt-2"
            >
              <p className="text-sm text-muted-foreground text-center">
                Enter the 6-digit code sent to <span className="font-semibold text-foreground">+91 {phone}</span>
              </p>

              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                className="w-full gradient-warm text-primary-foreground rounded-xl h-12 font-bold text-base"
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </Button>

              <button
                onClick={() => { setStep('phone'); setOtp(''); }}
                className="text-xs text-primary font-medium w-full text-center hover:underline"
              >
                ← Change phone number
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default OTPModal;
