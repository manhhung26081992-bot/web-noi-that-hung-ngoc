// src/app/layout.tsx

import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
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
  themeColor: '#005aab',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.noithathungngoc.com'),

  alternates: {
    canonical: 'https://www.noithathungngoc.com',
  },

  title: {
    default: 'Nội Thất Hùng Ngọc | Nội Thất Văn Phòng & Gia Đình Giá Rẻ Hà Nội',
    template: '%s | Nội Thất Hùng Ngọc',
  },

  description:
    'Chuyên cung cấp bàn ghế văn phòng, sofa giá rẻ, bền đẹp tại Hà Nội. Thiết kế thi công nội thất trọn gói, uy tín, giao hàng nhanh trong 24h.',

  keywords: [
    'nội thất hùng ngọc',
    'bàn làm việc hà nội',
    'ghế văn phòng giá rẻ',
    'sofa phòng khách',
    'thi công nội thất văn phòng',
  ],

  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },

  verification: {
    google: '8sRs-CQPkINftAG1gd1zSkOtsIGquewoAeFpp7L0LM4',
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
    url: 'https://www.noithathungngoc.com',
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const businessSchema = {
    '@context': 'https://schema.org',
    '@type': 'FurnitureStore',
    name: 'Nội Thất Hùng Ngọc',
    alternateName: 'Nội Thất Mạnh Hùng',
    image: 'https://www.noithathungngoc.com/logo.png',
    logo: 'https://www.noithathungngoc.com/logo.png',
    '@id': 'https://www.noithathungngoc.com/#furniturestore',
    url: 'https://www.noithathungngoc.com',
    telephone: '+84347227377',
    priceRange: '₫₫-₫₫₫',

    address: {
      '@type': 'PostalAddress',
      streetAddress: '213 Nguyễn Văn Giáp',
      addressLocality: 'Từ Liêm',
      addressRegion: 'Hà Nội',
      postalCode: '100000',
      addressCountry: 'VN',
    },

    geo: {
      '@type': 'GeoCoordinates',
      latitude: 21.02747653968819,
      longitude: 105.75671738124595,
    },

    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      opens: '08:00',
      closes: '21:00',
    },

    sameAs: [
      'https://zalo.me/0347227377',
    ],
  };

  return (
    <html lang="vi" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(businessSchema),
          }}
        />
      </head>
      <body style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
        <Header />
        <main id="main-content" className="mainContent">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}