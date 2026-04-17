import styles from '@/styles/Policy.module.css';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Chính Sách Bảo Mật Thông Tin | Nội Thất Hùng Ngọc',
  description: 'Nội Thất Hùng Ngọc cam kết bảo mật tuyệt đối thông tin khách hàng khi mua sắm các sản phẩm nội thất văn phòng, gia đình tại website.',
};

export default function PrivacyPolicy() {
  return (
    <>
      <main className={styles.container}>
        <article className={styles.content}>
          <h1>Chính Sách Bảo Mật Thông Tin</h1>
          <p className={styles.updateDate}>Cập nhật lần cuối: Tháng 03/2026</p>

          <section>
            <h2>1. Mục đích thu thập thông tin</h2>
            <p>Nội Thất Hùng Ngọc thu thập thông tin khách hàng (Tên, Số điện thoại, Địa chỉ) chỉ nhằm mục đích phục vụ việc tư vấn, giao hàng và bảo hành sản phẩm.</p>
          </section>

          <section>
            <h2>2. Phạm vi sử dụng thông tin</h2>
            <p>Thông tin của quý khách chỉ được sử dụng nội bộ để:</p>
            <ul>
              <li>Xác nhận đơn hàng và giao hàng tận nơi.</li>
              <li>Thông báo về các chương trình ưu đãi, khuyến mãi từ Hùng Ngọc.</li>
              <li>Hỗ trợ kỹ thuật và thực hiện nghĩa vụ bảo hành sản phẩm.</li>
            </ul>
          </section>

          <section>
            <h2>3. Cam kết bảo mật</h2>
            <p>Chúng tôi cam kết không chia sẻ, bán hay cho thuê thông tin cá nhân của khách hàng cho bất kỳ bên thứ ba nào khác ngoài đơn vị vận chuyển trực tiếp.</p>
          </section>

          <section className={styles.contactInfo}>
            <p>Mọi thắc mắc về chính sách bảo mật, vui lòng liên hệ:</p>
            <p><strong>Nội Thất Hùng Ngọc</strong></p>
            <p>Hotline: 0974.336.571</p>
            <p>Địa chỉ: Số 211 Nguyễn Văn Giáp, Cầu Diễn, Nam Từ Liêm, Hà Nội</p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}