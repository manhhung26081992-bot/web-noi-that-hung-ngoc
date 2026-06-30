# Search Console Import Center

Dashboard SEO hiện dùng chế độ import thủ công, không cần Google Cloud, OAuth, billing hay service account.

## Cách import dữ liệu

1. Mở Google Search Console.
2. Vào Performance.
3. Chọn Query hoặc Page.
4. Export dữ liệu hoặc copy bảng đang xem.
5. Mở /admin/seo.
6. Mở module **Search Console Import Center**.
7. Dán dữ liệu CSV hoặc tab-separated vào ô nhập.
8. Bấm **Phân tích dữ liệu**.

## Cột được hỗ trợ

Dashboard nhận được cả tên cột tiếng Anh và tiếng Việt:

- Query / Truy vấn
- Page / Trang
- Clicks / Số lần nhấp
- Impressions / Số lượt hiển thị
- CTR
- Position / Vị trí
- Device / Thiết bị
- Date / Ngày
- Country / Quốc gia

Nếu thiếu một vài cột, dashboard vẫn phân tích phần dữ liệu có sẵn.

## Dữ liệu lưu ở đâu?

Dữ liệu import được lưu trong localStorage của trình duyệt với key:

noithathungngoc-search-console-import-v1

Không tạo bảng Supabase mới, không cần SQL mới.

## Module sử dụng dữ liệu import

- Search Console Import Center
- Keyword Intelligence
- Cluster Health
- AI Decision Engine
- Hôm nay cần làm gì

Khi chưa import, dashboard vẫn dùng dữ liệu Supabase và fallback cũ.
