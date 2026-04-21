// src/app/layout.tsx
 
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/Header'; // Đảm bảo đường dẫn này đúng với thư mục bạn đã tách
import Footer from '@/components/Footer';

const inter = Inter({ 
  subsets: ['latin', 'vietnamese'],
  display: 'swap', 
  variable: '--font-inter',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#005aab', // Đổi thành màu xanh thương hiệu Hùng Ngọc cho đồng bộ
};

export const metadata: Metadata = {
  metadataBase: new URL('https://noithathungngoc.com'),
  title: {
    default: 'Nội Thất Hùng Ngọc | Nội Thất Văn Phòng & Gia Đình Giá Rẻ Hà Nội',
    template: '%s | Nội Thất Hùng Ngọc'
  },
  description: 'Chuyên cung cấp bàn ghế văn phòng, sofa giá rẻ, bền đẹp tại Hà Nội. Thiết kế thi công nội thất trọn gói, uy tín, giao hàng nhanh trong 24h.',
  keywords: ['nội thất hùng ngọc', 'bàn làm việc hà nội', 'ghế văn phòng giá rẻ', 'sofa phòng khách', 'thi công nội thất văn phòng'],
  verification: {
        google:"8sRs-CQPkINftAG1gd1zSkOtsIGquewoAeFpp7L0LM4", // Dán chính xác mã trong ngoặc kép ở ảnh trước của bạn vào đây
    },
  
  authors: [{ name: 'Nội Thất Hùng Ngọc' }],
  creator: 'Nội Thất Hùng Ngọc',
  publisher: 'Nội Thất Hùng Ngọc',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Nội Thất Hùng Ngọc - Nội Thất Văn Phòng & Gia Đình Giá Xưởng',
    description: 'Bàn ghế sofa cao cấp, bền đẹp, mẫu mã đa dạng tại Hà Nội.',
    url: 'https://noithathungngoc.com',
    siteName: 'Nội Thất Hùng Ngọc',
    images: [
      {
        url: '/og-image.webp', 
        width: 1200,
        height: 630,
        alt: 'Showroom Nội Thất Hùng Ngọc Hà Nội',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
const businessSchema = {
  '@context': 'https://schema.org',
  '@type': 'FurnitureStore',
  'name': 'Nội Thất Hùng Ngọc',
  'alternateName': 'Nội Thất Mạnh Hùng', // Thêm tên thay thế nếu khách hay tìm cả tên này
  'image': 'https://noithathungngoc.com/logo.png',
  '@id': 'https://noithathungngoc.com/#furniturestore', // Định danh duy nhất cho thực thể
  'url': 'https://noithathungngoc.com',
  'telephone': '0347227377',
  'priceRange': '₫₫-₫₫₫', // Định dạng chuẩn của Google (VND là tiền tệ, priceRange dùng ký hiệu)
  'address': {
    '@type': 'PostalAddress',
    'streetAddress': '213 Nguyễn Văn Giáp,Từ Liêm', // Cập nhật đầy đủ quận huyện
    'addressLocality': 'Hà Nội',
    'addressRegion': 'HN',
    'postalCode': '100000',
    'addressCountry': 'VN'
  },
  // Bổ sung tọa độ để Google Maps xác minh vị trí chính xác
  'geo': {
    '@type': 'GeoCoordinates',
    'latitude': 21.037416, 
    'longitude': 105.759451
  },
  'openingHoursSpecification': {
    '@type': 'OpeningHoursSpecification',
    'dayOfWeek': [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
      'Friday', 'Saturday', 'Sunday'
    ],
    'opens': '08:00',
    'closes': '21:00'
  },
  // Bổ sung liên kết mạng xã hội để tạo niềm tin với Google
  'sameAs': [
    'https://web.facebook.com/profile.php?id=61579413113220e', 
    'https://zalo.me/0347227377'
  ]
};

  return (
    <html lang="vi" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
        />
      </head>
      <body style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
        <Header />
        {/* Thêm một lớp bọc để tránh Header Sticky đè lên nội dung */}
        <main id="main-content" className='mainContent'>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

