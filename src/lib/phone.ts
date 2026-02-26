/**
 * Validates an Indian phone number (10 digits, starts with 6-9).
 * Accepts optional +91 or 91 prefix.
 */
export function validateIndianPhone(phone: string): { valid: boolean; cleaned: string; error?: string } {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  const match = cleaned.match(/^(?:\+?91)?([6-9]\d{9})$/);
  if (!match) {
    return { valid: false, cleaned, error: 'Enter a valid 10-digit Indian mobile number' };
  }
  return { valid: true, cleaned: match[1] };
}

/**
 * Generate a WhatsApp link with a pre-filled bill message.
 */
export function generateWhatsAppBillLink(
  phone: string,
  orderNumber: string,
  items: { name: string; qty: number; price: number }[],
  total: number
): string {
  const itemLines = items.map(i => `• ${i.name} × ${i.qty} — ₹${i.price * i.qty}`).join('\n');
  const message = `🧾 *OrderFlow Bill*\n\n📋 Order: *${orderNumber}*\n\n${itemLines}\n\n💰 *Total: ₹${total}*\n\nThank you for dining with us! 🙏`;
  const encodedMsg = encodeURIComponent(message);
  const cleanPhone = phone.replace(/\D/g, '');
  const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  return `https://wa.me/${fullPhone}?text=${encodedMsg}`;
}
