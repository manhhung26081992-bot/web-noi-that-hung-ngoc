import type { NextConfig } from "next";

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