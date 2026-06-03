import { getCartSummary } from './cart-core.js';

export const formatRp = (num, locale = 'id-ID') => `Rp ${num.toLocaleString(locale)}`;

export const formatWaDisplayNumber = (waNumber) => {
    if (!waNumber.startsWith('62')) return waNumber;
    return `WhatsApp: +62 ${waNumber.slice(2, 5)}-${waNumber.slice(5, 9)}-${waNumber.slice(9)}`;
};

export const buildDefaultWaLink = ({ waNumber, waGreeting }) => {
    const defaultText = `${waGreeting}, saya mau pesan Ayam Geprek`;
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(defaultText)}`;
};

export const buildOrderCode = (date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const rand = String(Math.floor(Math.random() * 9000) + 1000);
    return `GN-${y}${m}${d}-${rand}`;
};

export const buildWhatsAppMessage = ({
    cart,
    waGreeting,
    currency = 'id-ID',
    orderType = 'Delivery',
    note = '',
    now = new Date()
}) => {
    const orderCode = buildOrderCode(now);
    const orderTime = now.toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    const { totalItems, totalPrice } = getCartSummary(cart);
    let message = `${waGreeting}, saya ingin memesan:\n\n`;
    message += `Kode Order: ${orderCode}\n`;
    message += `Waktu Pesan: ${orderTime}\n\n`;

    Object.keys(cart).forEach((id) => {
        const item = cart[id];
        const subtotal = item.price * item.qty;
        const optionsStr = item.options.length > 0 ? ` [${item.options.join(', ')}]` : '';
        message += `- ${item.qty}x ${item.name}${optionsStr} (${formatRp(subtotal, currency)})\n`;
    });

    message += `\nTotal Item: ${totalItems}\n`;
    message += `*Total Akhir: ${formatRp(totalPrice, currency)}*\n\n`;
    message += `Metode: *${orderType}*\n`;
    if (note) {
        message += `Catatan: ${note}\n`;
    }
    message += 'Mohon info total pembayaran final + ongkir. Terima kasih!';

    return message;
};
