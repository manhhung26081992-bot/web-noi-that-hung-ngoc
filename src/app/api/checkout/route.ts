import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { formData, cart, totalPrice, paymentMethod } = body;

    // --- THÔNG TIN ĐÃ CẤU HÌNH XONG ---
    const TELEGRAM_BOT_TOKEN = '8781443837:AAHaF8ZTybjFQXlmRTY6vH2R09nu84E6Qy4';
    const TELEGRAM_CHAT_ID = '8619570438'; 
    // ---------------------------------

    let message = `🔔 <b>ĐƠN HÀNG MỚI: NỘI THẤT HÙNG NGỌC</b>\n`;
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `👤 <b>Khách:</b> ${formData.lastName} ${formData.firstName}\n`;
    message += `📞 <b>SĐT:</b> ${formData.phone}\n`;
    message += `📍 <b>ĐC:</b> ${formData.address}\n`;
    if (formData.note) message += `📝 <b>Ghi chú:</b> ${formData.note}\n`;
    message += `💳 <b>Thanh toán:</b> ${paymentMethod === 'bank' ? 'Chuyển khoản' : 'COD'}\n\n`;
    
    message += `🛒 <b>SẢN PHẨM:</b>\n`;
    cart.forEach((item: any, i: number) => {
      const itemPrice = parseInt(String(item.price).replace(/\D/g, "")) || 0;
      message += `${i + 1}. ${item.name} (x${item.quantity}) - ${itemPrice.toLocaleString()}₫\n`;
    });
    
    message += `\n💰 <b>TỔNG CỘNG: ${totalPrice.toLocaleString()}₫</b>`;

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const res = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!res.ok) throw new Error('Telegram API error');

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Lỗi gửi Telegram:", err);
    return NextResponse.json({ error: 'Lỗi xử lý đơn hàng' }, { status: 500 });
  }
}