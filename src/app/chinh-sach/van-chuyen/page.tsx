import Style from "@/styles/Policy.module.css";
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Chính Sách Vận Chuyển & Lắp Đặt | Nội Thất Hùng Ngọc',
  description: 'Thông tin chi tiết về phí vận chuyển và quy trình lắp đặt nội thất tại Hà Nội và các tỉnh. Miễn phí vận chuyển cho đơn hàng dự án.',
};

export default function ShippingPolicy() {
  return (
    <>
      <main className={Style.container}>
        <article className={Style.content}>
          <h1>Chính Sách Vận Chuyển & Lắp Đặt</h1>
          <p className={Style.updateDate}>Cập nhật lần cuối: Tháng 03/2026</p>

          <section>
            <h2>1. Khu vực áp dụng</h2>
            <p>
              <strong>Nội Thất Hùng Ngọc</strong> hỗ trợ giao hàng và lắp đặt tận nơi trên toàn quốc, tập trung chủ yếu tại khu vực Hà Nội và các tỉnh miền Bắc như: Bắc Ninh, Hưng Yên, Vĩnh Phúc, Thái Nguyên...
            </p>
          </section>
          
          <section>
            <h2>2. Thời gian giao hàng</h2>
            <ul>
              <li><strong>Nội thành Hà Nội:</strong> Giao hàng nhanh trong vòng 2h - 24h kể từ khi xác nhận đơn hàng.</li>
              <li><strong>Các tỉnh lân cận:</strong> Thời gian giao từ 1 - 3 ngày tùy theo khoảng cách và khối lượng hàng hóa.</li>
              <li>Thời gian giao hàng linh hoạt từ 8h00 - 20h00 tất cả các ngày trong tuần.</li>
            </ul>
          </section>

          <section>
            <h2>3. Biểu phí vận chuyển</h2>
            <ul>
              <li><strong>Miễn phí vận chuyển:</strong> Áp dụng cho các đơn hàng dự án, đơn hàng có giá trị cao hoặc trong bán kính 3km từ kho Nguyễn Văn Giáp.</li>
              <li><strong>Phí thỏa thuận:</strong> Với các đơn hàng lẻ hoặc đi tỉnh, chúng tôi cam kết mức phí rẻ nhất (hỗ trợ xe tải của xưởng hoặc gửi xe khách/bưu cục uy tín).</li>
            </ul>
          </section>

          <section>
            <h2>4. Quy trình lắp đặt</h2>
            <p>
              Đội ngũ kỹ thuật viên của Hùng Ngọc sẽ trực tiếp vận chuyển và lắp đặt hoàn thiện tại nhà/văn phòng cho quý khách. Chúng tôi cam kết:
            </p>
            <ul>
              <li>Lắp đặt đúng kỹ thuật, đảm bảo độ bền và tính thẩm mỹ.</li>
              <li>Vệ sinh sạch sẽ khu vực lắp đặt trước khi bàn giao.</li>
              <li>Hướng dẫn khách hàng cách sử dụng và bảo quản nội thất bền đẹp.</li>
            </ul>
          </section>

          <section className={Style.contactInfo}>
            <p>Để nhận báo giá vận chuyển chính xác nhất cho đơn hàng của bạn, vui lòng liên hệ:</p>
            <p><strong>Kho Nội Thất Hùng Ngọc</strong></p>
            <p>Địa chỉ kho: Số 211 Đường Nguyễn Văn Giáp, Cầu Diễn, Nam Từ Liêm, Hà Nội</p>
            <p>Hotline: <a href="tel:0974336571">0974 336 571</a></p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}