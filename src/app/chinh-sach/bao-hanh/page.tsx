import Style from "@/styles/Policy.module.css";
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Chính Sách Bảo Hành Sản Phẩm | Nội Thất Hùng Ngọc',
  description: 'Thông tin chi tiết về điều kiện và thời gian bảo hành các sản phẩm nội thất tại Hùng Ngọc. Cam kết bảo hành tận nơi nhanh chóng.',
};

export default function WarrantyPolicy() {
  return (
    <>
      <main className={Style.container}>
        <article className={Style.content}>
          <h1>Chính Sách Bảo Hành</h1>
          <p className={Style.updateDate}>Cập nhật lần cuối: Tháng 03/2026</p>

          <section>
            <h2>1. Thời gian bảo hành</h2>
            <p>
              Tất cả sản phẩm bàn, ghế, tủ văn phòng tại <strong>Nội Thất Hùng Ngọc</strong> được bảo hành từ <strong>06 - 12 tháng</strong> tùy theo loại sản phẩm và quy định của nhà sản xuất.
            </p>
          </section>
          
          <section>
            <h2>2. Điều kiện bảo hành</h2>
            <ul>
              <li>Sản phẩm còn trong thời hạn bảo hành tính từ ngày giao hàng.</li>
              <li>Lỗi do nhà sản xuất (cong vênh, hỏng khóa, mối mọt, phụ kiện lỗi...).</li>
              <li>Quý khách còn giữ hóa đơn hoặc thông tin số điện thoại mua hàng trên hệ thống để đối soát.</li>
            </ul>
          </section>

          <section>
            <h2>3. Các trường hợp không được bảo hành</h2>
            <ul>
              <li>Hỏng hóc do va đập, trầy xước, rơi vỡ trong quá trình khách hàng tự vận chuyển hoặc sử dụng sai cách.</li>
              <li>Sản phẩm bị ngâm nước lâu ngày dẫn đến hỏng cốt gỗ hoặc để ở môi trường quá ẩm ướt.</li>
              <li>Khách hàng tự ý tháo dỡ, thay đổi kết cấu hoặc sửa chữa sản phẩm khi chưa có sự đồng ý của kỹ thuật viên Hùng Ngọc.</li>
            </ul>
          </section>

          <section className={Style.contactInfo}>
            <p>Mọi yêu cầu hỗ trợ bảo hành, quý khách vui lòng liên hệ trực tiếp:</p>
            <p><strong>Nội Thất Hùng Ngọc - Giá Xưởng Hà Nội</strong></p>
            <p>Hotline: <a href="tel:0347227377">0974 336 571</a></p>
            <p>Địa chỉ: Số 211 Đường Nguyễn Văn Giáp, P. Cầu Diễn, Q. Nam Từ Liêm, Hà Nội</p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}