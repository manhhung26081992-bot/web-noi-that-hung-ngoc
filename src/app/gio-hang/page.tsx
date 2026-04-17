"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from '@/styles/Checkout.module.css';

export default function CheckoutClient() {
  const [cart, setCart] = useState<any[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [formData, setFormData] = useState({
    lastName: '', firstName: '', phone: '', address: '', note: ''
  });
const loadAndCalculateCart = () => {
  if (typeof window !== 'undefined') {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(savedCart);
    const total = savedCart.reduce((sum: number, item: any) => {
      // 1. Chuyển giá về dạng số, xóa bỏ mọi ký tự lạ
      let rawPrice = String(item.price).replace(/\D/g, "");
      let priceValue = parseInt(rawPrice) || 0;
      
      // 2. Ép kiểu số lượng để tránh lỗi
      let qtyValue = Number(item.quantity) || 1;
      
      return sum + (priceValue * qtyValue);
    }, 0);
    setTotalPrice(total);
  }
};
  // const loadAndCalculateCart = () => {
  //   if (typeof window !== 'undefined') {
  //     const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
  //     setCart(savedCart);
  //     const total = savedCart.reduce((sum: number, item: any) => {
  //       const priceValue = typeof item.price === 'string' 
  //         ? parseInt(item.price.replace(/\D/g, "")) 
  //         : (Number(item.price) || 0);
  //       return sum + (priceValue * (item.quantity || 1));
  //     }, 0);
  //     setTotalPrice(total);
  //   }
  // };

  useEffect(() => {
    loadAndCalculateCart();
    window.addEventListener("cartUpdate", loadAndCalculateCart);
    return () => window.removeEventListener("cartUpdate", loadAndCalculateCart);
  }, []);

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    const newQty = (newCart[index].quantity || 1) + delta;
    if (newQty > 0) {
      newCart[index].quantity = newQty;
      localStorage.setItem('cart', JSON.stringify(newCart));
      window.dispatchEvent(new Event("cartUpdate"));
    }
  };

  const removeItem = (index: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?")) {
      const newCart = cart.filter((_, i) => i !== index);
      localStorage.setItem('cart', JSON.stringify(newCart));
      window.dispatchEvent(new Event("cartUpdate"));
    }
  };
const handleZaloOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      alert("Giỏ hàng của bạn đang trống!");
      return;
    }

    const phoneNumber = "0347227377"; 
    
    // 1. Tạo nội dung tin nhắn
    let message = `🔔 ĐƠN HÀNG MỚI TỪ WEBSITE\n`;
    message += `--------------------------\n`;
    message += `👤 Khách hàng: ${formData.lastName} ${formData.firstName}\n`;
    message += `📞 Số điện thoại: ${formData.phone}\n`;
    message += `📍 Địa chỉ: ${formData.address}\n`;
    if (formData.note) message += `📝 Ghi chú: ${formData.note}\n`;
    message += `💳 Thanh toán: ${paymentMethod === 'bank' ? 'Chuyển khoản MB Bank' : 'Trả tiền mặt (COD)'}\n`;
    
    message += `\n🛒 CHI TIẾT ĐƠN HÀNG:\n`;
    cart.forEach((item, i) => {
      const itemPrice = typeof item.price === 'string' 
        ? parseInt(item.price.replace(/\D/g, "")) 
        : (Number(item.price) || 0);
      message += `${i + 1}. ${item.name} (x${item.quantity}) - ${itemPrice.toLocaleString()}₫\n`;
    });
    
    message += `--------------------------\n`;
    message += `💰 TỔNG CỘNG: ${totalPrice.toLocaleString()}₫`;

    try {
      // 2. Tự động Copy nội dung vào điện thoại khách
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(message);
        // Thông báo cho khách biết để họ chủ động dán nếu app Zalo bị trống
        alert("Đơn hàng đã được sao chép! Bạn chỉ cần nhấn 'Dán' (Paste) vào ô chat Zalo để gửi cho Nội Thất Hùng Ngọc nhé.");
      }
    } catch (err) {
      console.error("Lỗi copy:", err);
    }

    // 3. Mở Zalo (Vẫn đính kèm text dự phòng cho các dòng máy hỗ trợ)
    const zaloUrl = `https://zalo.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(zaloUrl, '_blank');
  };
  // const handleZaloOrder = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   const phoneNumber = "0347227377"; // Hotline Hùng Ngọc
  //   let message = `🔔 ĐƠN HÀNG MỚI\n👤 Khách: ${formData.lastName} ${formData.firstName}\n📞 SĐT: ${formData.phone}\n📍 ĐC: ${formData.address}\n\n🛒 CHI TIẾT:\n`;
  //   cart.forEach((item, i) => message += `${i + 1}. ${item.name} x ${item.quantity}\n`);
  //   message += `\n💰 TỔNG: ${totalPrice.toLocaleString()}₫`;
    
  //   window.open(`https://zalo.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  //   localStorage.removeItem('cart');
  //   window.dispatchEvent(new Event("cartUpdate"));
  // };

  return (
    <main className={styles.container}>
      <form className={styles.checkoutForm} onSubmit={handleZaloOrder}>
        <section className={styles.leftCol}>
          <h2 className={styles.sectionTitle}>Thông tin thanh toán</h2>
          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label>Họ *</label>
              <input type="text" required onChange={(e) => setFormData({...formData, lastName: e.target.value})} placeholder="Họ..." />
            </div>
            <div className={styles.inputGroup}>
              <label>Tên *</label>
              <input type="text" required onChange={(e) => setFormData({...formData, firstName: e.target.value})} placeholder="Tên..." />
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label>Số điện thoại *</label>
            <input type="tel" required onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="Số điện thoại..." />
          </div>
          <div className={styles.inputGroup}>
            <label>Địa chỉ nhận hàng *</label>
            <input type="text" required onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Địa chỉ chi tiết..." />
          </div>
          <div className={styles.inputGroup}>
            <label>Ghi chú</label>
            <textarea onChange={(e) => setFormData({...formData, note: e.target.value})} placeholder="Lưu ý cho người bán..."></textarea>
          </div>
        </section>

        <aside className={styles.rightCol}>
          <div className={styles.orderSummary}>
            <h2 className={styles.sectionTitle}>Đơn hàng của bạn</h2>
            <table className={styles.orderTable}>
              <thead>
                <tr>
                  <th>SẢN PHẨM</th>
                  <th style={{ textAlign: 'right' }}>TẠM TÍNH</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, index) => {
                  const itemPrice = typeof item.price === 'string' 
                    ? parseInt(item.price.replace(/\D/g, "")) 
                    : (Number(item.price) || 0);
                  return (
                    <tr key={index}>
                      <td className={styles.productCell}>
                        <button type="button" onClick={() => removeItem(index)} className={styles.removeBtn} title="Xóa sản phẩm">✕</button>
                        <div className={styles.productThumbnail}>
                          <Image src={item.image || '/default.webp'} alt={item.name} width={50} height={50} />
                        </div>
                        <div className={styles.productInfo}>
                          <span className={styles.productName}>{item.name}</span>
                          <div className={styles.quantityControl}>
                            <button type="button" onClick={() => updateQuantity(index, -1)} className={styles.qtyBtn}>-</button>
                            <span className={styles.productQty}>{item.quantity}</span>
                            <button type="button" onClick={() => updateQuantity(index, 1)} className={styles.qtyBtn}>+</button>
                          </div>
                        </div>
                      </td>
                      <td className={styles.productPrice}>
                        {(itemPrice * item.quantity).toLocaleString()}₫
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className={styles.paymentMethods}>
              <div className={styles.methodItem}>
                <input type="radio" id="bank" name="pay" checked={paymentMethod === 'bank'} onChange={() => setPaymentMethod('bank')} />
                <label htmlFor="bank">Chuyển khoản ngân hàng</label>
                {paymentMethod === 'bank' && (
                  <div className={styles.methodDesc}>
                    🏦 MB Bank - <strong>0777353192</strong><br/>
                    👤 Chủ TK: Bùi Văn Hùng
                  </div>
                )}
              </div>
              <div className={styles.methodItem}>
                <input type="radio" id="cod" name="pay" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                <label htmlFor="cod">Thanh toán khi nhận hàng (COD)</label>git commit -m "fix: responsive hero banner"
              </div>
            </div>

            <button type="submit" className={styles.zaloSubmitBtn} disabled={cart.length === 0}>
              ĐẶT HÀNG QUA ZALO NGAY
            </button>
          </div>
        </aside>
      </form>
    </main>
  );
}