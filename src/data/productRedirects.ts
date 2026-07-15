import { addTrailingSlash } from "@/lib/url";

const redirects: Record<string, string> = {
  // URL cu nam sai duoi /san-pham/ nhung thuc te la trang danh muc.
  "/san-pham/ghe-van-phong/": "/ghe-van-phong/",
  "/san-pham/ban-van-phong/": "/ban-van-phong/",
  "/san-pham/tu-van-phong/": "/tu-van-phong/",
  "/san-pham/truong-hoc/": "/truong-hoc/",
  "/san-pham/gia-dinh/": "/gia-dinh/",
  "/san-pham/ban-ghe-an/": "/ban-ghe-an/",
  "/san-pham/ghe-an/": "/ghe-an/",
  "/san-pham/bo-ban-an-6-ghe/": "/bo-ban-an-6-ghe/",
  "/san-pham/bo-ban-an-4-ghe/": "/bo-ban-an-4-ghe/",
  "/san-pham/ban-an-thong-minh/": "/ban-an-thong-minh/",
  "/san-pham/ban-an-mat-da/": "/ban-an-mat-da/",
  "/san-pham/ban-ghe-cafe/": "/ban-ghe-cafe/",
  "/san-pham/sofa/": "/sofa/",
  "/san-pham/sofa-vang/": "/sofa-vang/",
  "/san-pham/sofa-van-phong/": "/sofa-van-phong/",
  "/san-pham/sofa-ni/": "/sofa-ni/",
  "/san-pham/sofa-giuong/": "/sofa-giuong/",
  "/san-pham/sofa-da/": "/sofa-da/",
  "/san-pham/ban-sofa/": "/ban-sofa/",

  // Ban van phong.
  "/san-pham/ban-nhan-vien/": "/ban-nhan-vien/",
  "/san-pham/ban-giam-doc/": "/ban-giam-doc/",
  "/san-pham/ban-hop/": "/ban-hop/",
  "/san-pham/cum-ban/": "/cum-ban/",
  "/san-pham/ban-chan-sat/": "/ban-chan-sat/",
"/san-pham/quay-le-tan/":"/quay-le-tan/",

  // Ghe van phong.
  "/san-pham/ghe-xoay/": "/ghe-xoay/",
  "/san-pham/ghe-chan-quy/": "/ghe-chan-quy/",
  "/san-pham/ghe-giam-doc/": "/ghe-giam-doc/",
  "/san-pham/ghe-gap/": "/ghe-gap/",
  "/san-pham/ghe-gaming/": "/ghe-gaming/",

  // Tu van phong.
  "/san-pham/tu-locker/": "/tu-locker/",
  "/san-pham/tu-tai-lieu-go/": "/tu-tai-lieu-go/",
  "/san-pham/tu-tai-lieu-sat/": "/tu-tai-lieu-sat/",
  "/san-pham/hoc-tu-tu-phu/": "/hoc-tu-tu-phu/",

  // Truong hoc.
  "/san-pham/ban-ghe-hoc-sinh/": "/ban-ghe-hoc-sinh/",
  "/san-pham/ban-ghe-giao-vien/": "/ban-ghe-giao-vien/",
  "/san-pham/bang-tu/": "/bang-tu/",

  // Gia dinh.
  "/san-pham/giuong-tang-sat/": "/giuong-tang-sat/",
  "/san-pham/giuong-go/": "/giuong-go/",
  "/san-pham/tu-quan-ao/": "/tu-quan-ao/",
  "/san-pham/tu-giay/": "/tu-giay/",
  "/san-pham/ban-trang-diem/": "/ban-trang-diem/",
  "/san-pham/ke-go/": "/ke-go/",
  "/san-pham/ke-sach/": "/ke-sach/",
  "/san-pham/ke-tivi/": "/ke-ti-vi/",
  "/san-pham/ke-ti-vi/": "/ke-ti-vi/",
  "/san-pham/ke-trang-tri/": "/ke-trang-tri/",
  "/san-pham/ke-treo-quan-ao/": "/ke-treo-quan-ao/",
  "/san-pham/ket-sat/": "/ket-sat/",
  "/san-pham/ke-de-hang/": "/ke-de-hang/",
};

export const productRedirects = Object.fromEntries(
  Object.entries(redirects).map(([source, destination]) => [
    addTrailingSlash(source),
    addTrailingSlash(destination),
  ]),
) as Record<string, string>;

