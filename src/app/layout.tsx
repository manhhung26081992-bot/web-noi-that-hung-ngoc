// src/app/layout.tsx
import Script from 'next/script'
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SpeedInsights } from "@vercel/speed-insights/next";
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
    canonical: '/',
  },

  title: {
    default: 'Nội Thất Hùng Ngọc | Nội Thất Văn Phòng & Gia Đình Giá Rẻ Hà Nội',
    template: '%s | Nội Thất Hùng Ngọc',
  },

  description:'Nội Thất Hùng Ngọc - Chuyên cung cấp bàn ghế văn phòng, giường tủ gia đình giá rẻ tại xưởng Hà Nội. Uy tín, giao hàng nhanh 24h.',
  keywords: [
    'nội thất hùng ngọc',
    'bàn làm việc hà nội',
    'ghế văn phòng giá rẻ',
    'sofa phòng khách',
    'thi công nội thất văn phòng',
  ],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
  },
  manifest: '/site.webmanifest',

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
    description: 'Nội Thất Hùng Ngọc chuyên cung cấp bàn ghế văn phòng, bàn làm việc, giường tủ gia đình giá rẻ tại xưởng Hà Nội. Sản phẩm bền đẹp, mẫu mã đa dạng, giao hàng nhanh 24h',
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
        {/* Chuyển các đoạn Script quảng cáo xuống body và đổi sang strategy="lazyOnload" */}
        {/* Điều này giúp giải phóng hoàn toàn tiến trình render và chuyển trang */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18110246759"
          strategy="lazyOnload"
        />
        <Script id="gtag-init" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18110246759');
          `}
        </Script>

        <Header />
        <main id="main-content" className="mainContent">
          {children}
        </main>
        <Footer />
        <SpeedInsights />
      </body>
    </html>
  );
}

// // src/app/layout.tsx
// import Script from 'next/script'
// import './globals.css';
// import type { Metadata, Viewport } from 'next';
// import { Inter } from 'next/font/google';
// import Header from '@/components/Header';
// import Footer from '@/components/Footer';

// const inter = Inter({
//   subsets: ['latin', 'vietnamese'],
//   display: 'swap',
//   variable: '--font-inter',
// });

// export const viewport: Viewport = {
//   width: 'device-width',
//   initialScale: 1,
//   maximumScale: 5,
//   themeColor: '#005aab',
// };

// export const metadata: Metadata = {
//   metadataBase: new URL('https://www.noithathungngoc.com'),

//   alternates: {
//     canonical: 'https://www.noithathungngoc.com',
//   },

//   title: {
//     default: 'Nội Thất Hùng Ngọc | Nội Thất Văn Phòng & Gia Đình Giá Rẻ Hà Nội',
//     template: '%s | Nội Thất Hùng Ngọc',
//   },

//   description:'Nội Thất Hùng Ngọc - Chuyên cung cấp bàn ghế văn phòng, giường tủ gia đình giá rẻ tại xưởng Hà Nội. Uy tín, giao hàng nhanh 24h.',
//   keywords: [
//     'nội thất hùng ngọc',
//     'bàn làm việc hà nội',
//     'ghế văn phòng giá rẻ',
//     'sofa phòng khách',
//     'thi công nội thất văn phòng',
//   ],
// icons: {
//   icon: [
//     { url: '/favicon.ico' },
//     { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
//     { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
//   ],
//   apple: [
//     { url: '/apple-touch-icon.png', sizes: '180x180' },
//   ],
// },
// manifest: '/site.webmanifest',
//   // icons: {
//   //   icon: '/icon.png',
//   //   shortcut: '/icon.png',
//   //   apple: '/icon.png',
//   // },

//   verification: {
//     google: '8sRs-CQPkINftAG1gd1zSkOtsIGquewoAeFpp7L0LM4',
//   },

//   authors: [{ name: 'Nội Thất Hùng Ngọc' }],
//   creator: 'Nội Thất Hùng Ngọc',
//   publisher: 'Nội Thất Hùng Ngọc',

//   robots: {
//     index: true,
//     follow: true,
//     googleBot: {
//       index: true,
//       follow: true,
//       'max-video-preview': -1,
//       'max-image-preview': 'large',
//       'max-snippet': -1,
//     },
//   },

//   openGraph: {
//     title: 'Nội Thất Hùng Ngọc - Nội Thất Văn Phòng & Gia Đình Giá Xưởng',
//     description: 'Nội Thất Hùng Ngọc chuyên cung cấp bàn ghế văn phòng, bàn làm việc, giường tủ gia đình giá rẻ tại xưởng Hà Nội. Sản phẩm bền đẹp, mẫu mã đa dạng, giao hàng nhanh 24h',
//     url: 'https://www.noithathungngoc.com',
//     siteName: 'Nội Thất Hùng Ngọc',
//     images: [
//       {
//         url: '/og-image.webp',
//         width: 1200,
//         height: 630,
//         alt: 'Showroom Nội Thất Hùng Ngọc Hà Nội',
//       },
//     ],
//     locale: 'vi_VN',
//     type: 'website',
//   },
// };

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const businessSchema = {
//     '@context': 'https://schema.org',
//     '@type': 'FurnitureStore',
//     name: 'Nội Thất Hùng Ngọc',
//     alternateName: 'Nội Thất Mạnh Hùng',
//     image: 'https://www.noithathungngoc.com/logo.png',
//     logo: 'https://www.noithathungngoc.com/logo.png',
//     '@id': 'https://www.noithathungngoc.com/#furniturestore',
//     url: 'https://www.noithathungngoc.com',
//     telephone: '+84347227377',
//     priceRange: '₫₫-₫₫₫',

//     address: {
//       '@type': 'PostalAddress',
//       streetAddress: '213 Nguyễn Văn Giáp',
//       addressLocality: 'Từ Liêm',
//       addressRegion: 'Hà Nội',
//       postalCode: '100000',
//       addressCountry: 'VN',
//     },

//     geo: {
//       '@type': 'GeoCoordinates',
//       latitude: 21.02747653968819,
//       longitude: 105.75671738124595,
//     },

//     openingHoursSpecification: {
//       '@type': 'OpeningHoursSpecification',
//       dayOfWeek: [
//         'Monday',
//         'Tuesday',
//         'Wednesday',
//         'Thursday',
//         'Friday',
//         'Saturday',
//         'Sunday',
//       ],
//       opens: '08:00',
//       closes: '21:00',
//     },

//     sameAs: [
//       'https://zalo.me/0347227377',
//     ],
//   };

//   return (
//     <html lang="vi" className={inter.variable} suppressHydrationWarning>
//       <head>
//          {/* Google tag (gtag.js) */}
//           <Script
//     src="https://www.googletagmanager.com/gtag/js?id=AW-18110246759"
//     strategy="afterInteractive"
//   />
//   <Script id="gtag-init" strategy="afterInteractive">
//     {`
//       window.dataLayer = window.dataLayer || [];
//       function gtag(){dataLayer.push(arguments);}
//       gtag('js', new Date());
//       gtag('config', 'AW-18110246759');
//     `}
//   </Script>
//         <script
//           type="application/ld+json"
//           dangerouslySetInnerHTML={{
//             __html: JSON.stringify(businessSchema),
//           }}
//         />
//       </head>
//       <body style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
//         <Header />
//         <main id="main-content" className="mainContent">
//           {children}
//         </main>
//         <Footer />
//       </body>
//     </html>
//   );
// }