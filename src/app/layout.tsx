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
    'image': 'https://noithathungngoc.com/logo.png',
    '@id': 'https://noithathungngoc.com',
    'url': 'https://noithathungngoc.com',
    'telephone': '0347 227 377',
    'priceRange': 'VND',
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': '213 Nguyễn Văn Giáp', // Bạn nhớ cập nhật địa chỉ thật vào đây
      'addressLocality': 'Hà Nội',
      'addressRegion': 'HN',
      'postalCode': '100000',
      'addressCountry': 'VN'
    },
    'openingHoursSpecification': {
      '@type': 'OpeningHoursSpecification',
      'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      'opens': '08:00',
      'closes': '21:00'
    }
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

