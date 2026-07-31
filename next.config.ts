import type { NextConfig } from "next";

type LegacyRedirect = { source: string; destination: string; permanent: true };

const legacySemanticRedirects: LegacyRedirect[] = [
  { source: '/tin-tuc/ghe-xoay', destination: '/ghe-xoay/', permanent: true },
  { source: '/san-pham/ban-chan-sat', destination: '/ban-chan-sat/', permanent: true },
  { source: '/san-pham/sofa-da', destination: '/sofa-da/', permanent: true },
  { source: '/san-pham/ban-hop', destination: '/ban-hop/', permanent: true },
  { source: '/san-pham/cum-ban', destination: '/cum-ban/', permanent: true },
  { source: '/san-pham/ke-sach', destination: '/ke-sach/', permanent: true },
  { source: '/san-pham/tu-giay', destination: '/tu-giay/', permanent: true },
  { source: '/san-pham/ghe-bar', destination: '/ban-ghe-cafe/', permanent: true },
  { source: '/san-pham/ban-an-mat-da-cafe', destination: '/ban-ghe-cafe/', permanent: true },
  { source: '/san-pham/ban-lam-viec', destination: '/ban-nhan-vien/', permanent: true },
  { source: '/ban-lam-viec', destination: '/ban-nhan-vien/', permanent: true },
  { source: '/ghe-bar', destination: '/ban-ghe-cafe/', permanent: true },
  { source: '/ban-an-mat-da-cafe', destination: '/ban-ghe-cafe/', permanent: true },
  { source: '/san-pham/ke-tivi', destination: '/ke-ti-vi/', permanent: true },
  { source: '/san-pham/tu-locker-sat', destination: '/tu-locker/', permanent: true },
  { source: '/ke-tivi', destination: '/ke-ti-vi/', permanent: true },
  { source: '/tu-locker-sat', destination: '/tu-locker/', permanent: true },
  { source: '/danh-muc/ban-sofa', destination: '/ban-sofa/', permanent: true },
];

function withSlashVariants(redirect: LegacyRedirect): LegacyRedirect[] {
  const source = redirect.source.endsWith('/') ? redirect.source.slice(0, -1) : redirect.source;
  return [
    { ...redirect, source },
    { ...redirect, source: `${source}/` },
  ];
}

const nextConfig: NextConfig = {
  /* 1. Tối ưu hóa hình ảnh */
  images: {
    unoptimized:true,
     remotePatterns: [
      {
        protocol: 'https',
        hostname: 'oytmbjoxetmbjsvlyiph.supabase.co', // Tên miền từ lỗi của bạn
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  },

  /* 2. Cấu hình SEO & URL */
  trailingSlash: true, 
  compress: true,

  /* 3. Các cấu hình bổ sung khác */
  reactStrictMode: true, 
  
  // swcMinify: true, <-- XÓA DÒNG NÀY VÌ NEXT.JS ĐÃ TỰ ĐỘNG BẬT

  /* 4. Thêm Header bảo mật */
  async redirects() {
    return [
      ...legacySemanticRedirects.flatMap(withSlashVariants),
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'noithathungngoc.com',
          },
        ],
        destination: 'https://www.noithathungngoc.com/:path*',
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};
/** @type {import('next').NextConfig} */



export default nextConfig;


// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;
