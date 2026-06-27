import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type CheckoutFormData = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  note?: string;
};

type CartItem = {
  name?: string;
  price?: number | string;
  quantity?: number | string;
  image?: string;
  slug?: string;
};

function normalizeText(value: unknown) {
  return String(value || '').trim();
}

function normalizePhone(phone: string) {
  const compactPhone = phone.replace(/[\s.\-()]/g, '');
  return compactPhone.startsWith('+84') ? `0${compactPhone.slice(3)}` : compactPhone;
}

function validateVietnamPhone(phone: string) {
  const normalizedPhone = normalizePhone(phone);
  return /^0[35789]\d{8}$/.test(normalizedPhone) ? normalizedPhone : null;
}

function getItemPrice(item: CartItem) {
  return parseInt(String(item.price || '').replace(/\D/g, ''), 10) || 0;
}

function validateCheckoutData(body: any) {
  const formData: CheckoutFormData = body?.formData || {};
  const cart: CartItem[] = Array.isArray(body?.cart) ? body.cart : [];
  const paymentMethod = body?.paymentMethod === 'cod' ? 'cod' : 'bank';

  const firstName = normalizeText(formData.firstName);
  const lastName = normalizeText(formData.lastName);
  const phone = normalizeText(formData.phone);
  const address = normalizeText(formData.address);
  const note = normalizeText(formData.note);
  const customerName = `${lastName} ${firstName}`.trim();
  const normalizedPhone = validateVietnamPhone(phone);

  if (!firstName || !lastName) {
    return { error: 'Vui long nhap day du ho va ten.' };
  }

  if (!normalizedPhone) {
    return {
      error:
        'So dien thoai khong hop le. Vui long nhap so Viet Nam bat dau bang 0 hoac +84, nha mang 3/5/7/8/9 va du 10 so.',
    };
  }

  if (!address) {
    return { error: 'Vui long nhap dia chi nhan hang.' };
  }

  if (customerName.toLowerCase().includes('oila')) {
    return { error: 'Thong tin khach hang khong hop le.' };
  }

  if (phone.replace(/\D/g, '') === '6502530000') {
    return { error: 'So dien thoai khong hop le.' };
  }

  if (address.toLowerCase().includes('athena')) {
    return { error: 'Dia chi nhan hang khong hop le.' };
  }

  if (cart.length === 0) {
    return { error: 'Gio hang dang trong.' };
  }

  const cleanCart = cart.map((item) => {
    const name = normalizeText(item.name);
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const price = getItemPrice(item);

    return {
      ...item,
      name,
      quantity,
      price,
    };
  });

  if (cleanCart.some((item) => !item.name || item.price <= 0 || item.quantity <= 0)) {
    return { error: 'Thong tin san pham trong gio hang khong hop le.' };
  }

  const totalPrice = cleanCart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return {
    data: {
      formData: {
        firstName,
        lastName,
        phone: normalizedPhone,
        address,
        note,
      },
      cart: cleanCart,
      totalPrice,
      paymentMethod,
    },
  };
}

function buildTelegramMessage(
  formData: Required<CheckoutFormData>,
  cart: Array<CartItem & { name: string; price: number; quantity: number }>,
  totalPrice: number,
  paymentMethod: string
) {
  let message = `🔔 <b>DON HANG MOI: NOI THAT HUNG NGOC</b>\n`;
  message += `━━━━━━━━━━━━━━━━━━\n`;
  message += `👤 <b>Khach:</b> ${formData.lastName} ${formData.firstName}\n`;
  message += `📞 <b>SDT:</b> ${formData.phone}\n`;
  message += `📍 <b>DC:</b> ${formData.address}\n`;
  if (formData.note) message += `📝 <b>Ghi chu:</b> ${formData.note}\n`;
  message += `💳 <b>Thanh toan:</b> ${paymentMethod === 'bank' ? 'Chuyen khoan' : 'COD'}\n\n`;
  message += `🛒 <b>SAN PHAM:</b>\n`;

  cart.forEach((item, index) => {
    message += `${index + 1}. ${item.name} (x${item.quantity}) - ${item.price.toLocaleString()}d\n`;
  });

  message += `\n💰 <b>TONG CONG: ${totalPrice.toLocaleString()}d</b>`;
  return message;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validateCheckoutData(body);

    if ('error' in validation) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const { formData, cart, totalPrice, paymentMethod } = validation.data;

    const { error: orderError } = await supabase.from('orders').insert([
      {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phone,
        address_detail: formData.address,
        payment_method: paymentMethod === 'bank' ? 'VietQR' : 'COD',
        total_amount: totalPrice,
        order_items: cart,
        status: 'Cho xac nhan',
      },
    ]);

    if (orderError) {
      console.error('Loi luu don hang:', orderError.message);
      return NextResponse.json(
        { success: false, error: 'Khong luu duoc don hang. Vui long thu lai hoac goi hotline.' },
        { status: 500 }
      );
    }

    const TELEGRAM_BOT_TOKEN = '8781443837:AAHaF8ZTybjFQXlmRTY6vH2R09nu84E6Qy4';
    const TELEGRAM_CHAT_ID = '8619570438';
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: buildTelegramMessage(formData, cart, totalPrice, paymentMethod),
        parse_mode: 'HTML',
      }),
    });

    if (!telegramResponse.ok) {
      console.error('Telegram API error:', await telegramResponse.text());
      return NextResponse.json({
        success: true,
        warning: 'Don hang da duoc luu nhung gui Telegram chua thanh cong.',
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Loi xu ly don hang:', err);
    return NextResponse.json({ success: false, error: 'Loi xu ly don hang.' }, { status: 500 });
  }
}
