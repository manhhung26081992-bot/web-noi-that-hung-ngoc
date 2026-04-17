import Style from "@/styles/Policy.module.css";
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Chính Sách Đổi Trả & Hoàn Tiền | Nội Thất Hùng Ngọc',
  description: 'Quy định chi tiết về việc đổi trả sản phẩm nội thất tại Hùng Ngọc. Hỗ trợ đổi mới 1-1 nếu có lỗi từ nhà sản xuất.',
};

export default function ReturnPolicy() {
  return (
    <>
      <main className={Style.container}>
        <article className={Style.content}>
          <h1>Chính Sách Đổi Trả & Hoàn Tiền</h1>
          <p className={Style.updateDate}>Cập nhật lần cuối: Tháng 03/2026</p>

          <section>
            <h2>1. Trường hợp được đổi trả sản phẩm</h2>
            <p><strong>Nội Thất Hùng Ngọc</strong> cam kết đổi mới hoặc nhận lại sản phẩm trong các trường hợp sau:</p>
            <ul>
              <li>Sản phẩm bị lỗi kỹ thuật, hỏng hóc do nhà sản xuất (cong vênh, nứt vỡ, thiếu phụ kiện...).</li>
              <li>Sản phẩm giao không đúng mẫu mã, màu sắc hoặc kích thước như khách hàng đã đặt.</li>
              <li>Sản phẩm bị hư hỏng nghiêm trọng trong quá trình vận chuyển của nhân viên Hùng Ngọc.</li>
            </ul>
          </section>
          
          <section>
            <h2>2. Điều kiện đổi trả</h2>
            <ul>
              <li>Sản phẩm phải còn mới 100%, chưa qua sử dụng và không có dấu hiệu tháo lắp sai cách.</li>
              <li>Thời gian thông báo đổi trả: Trong vòng <strong>48 giờ</strong> kể từ khi nhận hàng.</li>
              <li>Có đầy đủ hóa đơn mua hàng hoặc thông tin đơn hàng trên hệ thống của chúng tôi.</li>
            </ul>
          </section>

          <section>
            <h2>3. Quy trình thực hiện</h2>
            <p>Để đảm bảo quyền lợi nhanh nhất, quý khách vui lòng thực hiện theo các bước:</p>
            <ul>
              <li><strong>Bước 1:</strong> Chụp ảnh hoặc quay video tình trạng sản phẩm lỗi ngay khi nhận hàng.</li>
              <li><strong>Bước 2:</strong> Liên hệ Hotline <strong>0347.227.377</strong> để thông báo tình trạng.</li>
              <li><strong>Bước 3:</strong> Kỹ thuật viên sẽ xác nhận và tiến hành đổi mới sản phẩm tại nhà cho quý khách trong vòng 24h - 48h.</li>
            </ul>
          </section>

          <section>
            <h2>4. Chi phí đổi trả</h2>
            <ul>
              <li>Nếu lỗi do nhà sản xuất hoặc do phía Hùng Ngọc: <strong>Miễn phí 100%</strong> chi phí vận chuyển và đổi mới.</li>
              <li>Nếu khách hàng muốn đổi mẫu khác do thay đổi ý định: Quý khách vui lòng hỗ trợ chi phí vận chuyển phát sinh theo thỏa thuận.</li>
            </ul>
          </section>

          <section className={Style.contactInfo}>
            <p>Chúng tôi luôn nỗ lực để mang lại trải nghiệm mua sắm tốt nhất. Mọi khiếu nại vui lòng liên hệ:</p>
            <p><strong>Phòng Chăm Sóc Khách Hàng - Nội Thất Hùng Ngọc</strong></p>
            <p>Hotline hỗ trợ: <a href="tel:0347227377">0347 227 377</a></p>
            <p>Địa chỉ: Số 211 Nguyễn Văn Giáp, P. Cầu Diễn, Q. Nam Từ Liêm, Hà Nội</p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}