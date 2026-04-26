"use client";
import { supabase } from '@/lib/supabase'; // Đường dẫn tới file config supabase của bạn
import { useState, useEffect } from 'react';
import styles from '@/styles/Checkout.module.css';

export default function CheckoutClient() {
  const [cart, setCart] = useState<any[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [formData, setFormData] = useState({
    lastName: '', firstName: '', phone: '', address: '', note: ''
  });

  // 1. Hàm load giỏ hàng và tính tổng tiền chuẩn (Xử lý cả số và chuỗi có ký tự lạ)
  const loadAndCalculateCart = () => {
    if (typeof window !== 'undefined') {
      const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCart(savedCart);
      const total = savedCart.reduce((sum: number, item: any) => {
        const rawPrice = String(item.price).replace(/\D/g, "");
        const priceValue = parseInt(rawPrice) || 0;
        const qtyValue = Number(item.quantity) || 1;
        return sum + (priceValue * qtyValue);
      }, 0);
      setTotalPrice(total);
    }
  };

  useEffect(() => {
    loadAndCalculateCart();
    window.addEventListener("cartUpdate", loadAndCalculateCart);
    return () => window.removeEventListener("cartUpdate", loadAndCalculateCart);
  }, []);

  // 2. Cập nhật số lượng
  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    const newQty = (newCart[index].quantity || 1) + delta;
    if (newQty > 0) {
      newCart[index].quantity = newQty;
      localStorage.setItem('cart', JSON.stringify(newCart));
      window.dispatchEvent(new Event("cartUpdate"));
    }
  };

  // 3. Xóa sản phẩm
  const removeItem = (index: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      const newCart = cart.filter((_, i) => i !== index);
      localStorage.setItem('cart', JSON.stringify(newCart));
      window.dispatchEvent(new Event("cartUpdate"));
    }
  };

  // 4. HÀM XỬ LÝ ĐẶT HÀNG TỔNG HỢP (Mail + QR + Zalo + Reset)
  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Giỏ hàng đang trống!");
      return;
    }

    try {
      // --- BƯỚC A.1: LƯU VÀO SUPABASE (THÊM MỚI VÀO ĐÂY) ---
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone_number: formData.phone,
            address_detail: formData.address,
            payment_method: paymentMethod === 'bank' ? 'VietQR' : 'COD',
            total_amount: totalPrice,
            order_items: cart, // Lưu nguyên mảng giỏ hàng vào jsonb
            status: 'Chờ xác nhận'
          }
        ]);
      // BƯỚC A: Gửi Mail thông báo qua API Route
      await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, cart, totalPrice, paymentMethod }),
      });

      // BƯỚC B: Tạo nội dung tin nhắn Zalo
      const phoneNumber = "0347227377"; 
      let message = `🔔 ĐƠN HÀNG MỚI TỪ WEBSITE\n`;
      message += `👤 Khách: ${formData.lastName} ${formData.firstName}\n`;
      message += `📞 SĐT: ${formData.phone}\n`;
      message += `📍 ĐC: ${formData.address}\n`;
      message += `💳 HTTT: ${paymentMethod === 'bank' ? 'Chuyển khoản' : 'COD'}\n\n🛒 CHI TIẾT:\n`;
      
      cart.forEach((item, i) => {
        const itemPrice = parseInt(String(item.price).replace(/\D/g, "")) || 0;
        message += `${i + 1}. ${item.name} x${item.quantity} - ${itemPrice.toLocaleString()}₫\n`;
      });
      message += `\n💰 TỔNG CỘNG: ${totalPrice.toLocaleString()}₫`;

      // BƯỚC C: Xử lý theo phương thức thanh toán
      if (paymentMethod === 'bank') {
        const qrUrl = `https://img.vietqr.io/image/mbbank-0777353192-compact.png?amount=${totalPrice}&addInfo=HUNGNGOC%20${formData.phone}&accountName=Bui%20Van%20Hung`;
        alert("Cảm ơn bạn! Hệ thống sẽ hiển thị mã QR thanh toán và chuyển bạn đến Zalo để xác nhận.");
        window.open(qrUrl, '_blank');
      }

      // BƯỚC D: Mở Zalo
      window.open(`https://zalo.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');

      // BƯỚC E: RESET GIỎ HÀNG (Quan trọng nhất)
      localStorage.removeItem('cart'); // Xóa dữ liệu trong máy khách
      setCart([]); // Xóa state để giao diện cập nhật ngay
      setTotalPrice(0);
      window.dispatchEvent(new Event("cartUpdate")); // Báo cho Navbar cập nhật số lượng icon giỏ hàng
      
      alert("Đặt hàng thành công! Cảm ơn bạn đã tin tưởng Nội Thất Hùng Ngọc.");

    } catch (err) {
      console.error("Lỗi đặt hàng:", err);
      alert("Có lỗi xảy ra, vui lòng thử lại hoặc liên hệ hotline.");
    }
  };

  return (
    <main className={styles.container}>
      <form className={styles.checkoutForm} onSubmit={handleOrder}>
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
                  const itemPrice = parseInt(String(item.price).replace(/\D/g, "")) || 0;
                  return (
                    <tr key={index}>
                      <td className={styles.productCell}>
                        <button type="button" onClick={() => removeItem(index)} className={styles.removeBtn}>✕</button>
                        <div className={styles.productThumbnail}>
                          <img src={item.image || '/default.webp'} alt={item.name} width={50} height={50} />
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
                <label htmlFor="bank">Chuyển khoản ngân hàng (VietQR)</label>
                {paymentMethod === 'bank' && (
                  <div className={styles.methodDesc}>
                    🏦 MB Bank: <strong>0777353192</strong><br/>
                    👤 Chủ TK: Bùi Văn Hùng
                  </div>
                )}
              </div>
              <div className={styles.methodItem}>
                <input type="radio" id="cod" name="pay" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                <label htmlFor="cod">Thanh toán khi nhận hàng (COD)</label>
              </div>
            </div>

            <button type="submit" className={styles.zaloSubmitBtn} disabled={cart.length === 0}>
              XÁC NHẬN ĐẶT HÀNG
            </button>
          </div>
        </aside>
      </form>
    </main>
  );
}
