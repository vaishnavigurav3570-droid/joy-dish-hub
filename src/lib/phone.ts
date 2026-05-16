/**
 * Validates an Indian phone number (10 digits, starts with 6-9).
 * Accepts optional +91 or 91 prefix.
 */
export function validateIndianPhone(phone: string): { valid: boolean; cleaned: string; error?: string } {
  const cleaned = phone.replace(/[\s\-()]/g, '');
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
  total: number,
  customerName?: string
): string {
  const itemLines = items.map(i => `• ${i.name} × ${i.qty} — ₹${i.price * i.qty}`).join('\n');
  const greeting = customerName ? `Hi ${customerName}! ` : '';
  const message = `🧾 *The Curry Corner - Bill*\n\n${greeting}📋 Order: *${orderNumber}*\n\n${itemLines}\n\n💰 *Total: ₹${total}*\n\nThank you for dining with us! 🙏`;
  const encodedMsg = encodeURIComponent(message);
  const cleanPhone = phone.replace(/\D/g, '');
  const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  return `https://wa.me/${fullPhone}?text=${encodedMsg}`;
}

/**
 * Generate a plain-text bill for file storage.
 */
export function generateBillText(
  orderNumber: string,
  tableNumber: number,
  customerName: string,
  phone: string,
  items: { name: string; qty: number; price: number }[],
  total: number,
  date: Date
): string {
  const sep = '═'.repeat(40);
  const thin = '─'.repeat(40);
  const itemLines = items.map(i => {
    const name = i.name.padEnd(22);
    const qty = `x${i.qty}`.padStart(4);
    const price = `₹${(i.price * i.qty).toFixed(0)}`.padStart(10);
    return `  ${name}${qty}${price}`;
  }).join('\n');

  return `${sep}
       THE CURRY CORNER
         Restaurant Bill
${sep}

  Order:    ${orderNumber}
  ${tableNumber === 0 ? 'Type:     Pre-order Pickup' : `Table:    ${tableNumber}`}
  Customer: ${customerName}
  Phone:    ${phone}
  Date:     ${date.toLocaleDateString('en-IN')}
  Time:     ${date.toLocaleTimeString('en-IN')}

${thin}
  ITEMS
${thin}
${itemLines}
${thin}
  TOTAL${`₹${total.toFixed(0)}`.padStart(33)}
${sep}

  Thank you for dining with us!
  Visit again — The Curry Corner 🍛

${sep}`;
}
