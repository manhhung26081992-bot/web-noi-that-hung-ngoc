# Google Ads & Keyword Planner Import Center

Trang sử dụng: /admin/seo

Module v8.0 dùng import thủ công, không dùng Google Ads API, không OAuth và không Google Cloud Billing.

## Cách nhập dữ liệu

1. Mở Google Ads hoặc Keyword Planner.
2. Export keyword plan hoặc report keyword.
3. Copy dữ liệu CSV hoặc tab-separated text.
4. Dán vào module "Google Ads & Keyword Planner Import Center".
5. Bấm "Phân tích dữ liệu".

## Dữ liệu được lưu ở đâu?

Dữ liệu import lưu trong trình duyệt bằng localStorage:

`noithathungngoc-google-ads-import-v1`

Không tạo bảng Supabase mới và không gửi dữ liệu lên Google API.

## Cột hỗ trợ

- keyword / Từ khóa
- avg_monthly_searches / Số lượt tìm kiếm trung bình hằng tháng
- competition / Mức độ cạnh tranh
- competition_index / Chỉ số cạnh tranh
- low_top_of_page_bid / Giá thầu thấp
- high_top_of_page_bid / Giá thầu cao
- cpc / CPC
- campaign / ad_group
- clicks / impressions / ctr
- cost / conversions / conversion_rate

## Kết nối Search Console v7

Nếu đã import dữ liệu Search Console v7, module sẽ ghép query với keyword gần giống để tạo bảng SEO + Ads Keyword Matrix.
