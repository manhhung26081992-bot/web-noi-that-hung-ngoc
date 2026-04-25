export interface SubMenuItem {
  name: string;
  link: string;
}

export interface MenuItem {
  name: string;
  link: string;
  submenu?: SubMenuItem[];
}

export const MENU_ITEMS: MenuItem[] = [
  { name: "TRANG CHỦ", link: "/" },
  { 
    name: "TỦ VĂN PHÒNG", 
    link: "/tu-van-phong",
    submenu: [
      { name: "Tủ Locker", link: "/tu-locker" },
      { name: "Tủ tài liệu gỗ", link: "/tu-tai-lieu-go" },
      { name: "Tủ tài liệu sắt", link: "/tu-tai-lieu-sat" },
      { name: "Hộc tủ – Tủ phụ", link: "/hoc-tu-tu-phu" },
    ]
  },
  { 
    name: "GHẾ VĂN PHÒNG", 
    link: "/ghe-van-phong",
    submenu: [
      { name: "Ghế xoay văn phòng", link: "/ghe-xoay" },
      { name: "Ghế chân quỳ", link: "/ghe-chan-quy" },
      { name: "Ghế giám đốc", link: "/ghe-giam-doc" },
      { name: "Ghế gấp", link: "/ghe-gap" },
      { name: "Ghế Gaming", link: "/ghe-gaming" },
    ]
  },
  { 
    name: "BÀN VĂN PHÒNG", 
    link: "/ban-van-phong",
    submenu: [
      { name: "Bàn làm việc", link: "/ban-lam-viec" },
      { name: "Bàn giám đốc", link: "/ban-giam-doc" },
      { name: "Bàn họp", link: "/ban-hop" },
      { name: "Cụm bàn làm việc", link: "/cum-ban" },
      { name: "Bàn chân sắt", link: "/ban-chan-sat" },
      {name:"Quầy lễ tân", link:"/quay-le-tan"}
    ]
  },
  { 
    name: "TRƯỜNG HỌC", 
    link: "/truong-hoc",
    submenu: [
      { name: "Bàn Ghế giáo viên", link: "/ban-ghe-giao-vien" },
      { name: "Bảng từ", link: "/bang-tu" },
      { name: "Bàn ghế học sinh", link: "/ban-ghe-hoc-sinh" },
    ]
  },
  { 
    name: "GIA ĐÌNH", 
    link: "/gia-dinh",
    submenu: [
      { name: "Giường tầng sắt", link: "/giuong-tang-sat" },
      { name: "Giường gỗ", link: "/giuong-go" },
      { name: "Tủ quần áo", link: "/tu-quan-ao" },
      { name: "Tủ giày", link: "/tu-giay" },
      { name: "Bàn trang điểm", link: "/ban-trang-diem" },
      { name: "Kệ Gỗ", link: "/ke-go" },
      { name: "Kệ Sách", link: "/ke-sach" },
      { name: "Kệ tivi", link: "/ke-ti-vi" },
      { name: "Kệ trang trí", link: "/ke-trang-tri" },
      { name: "Kệ treo quần áo", link: "/ke-treo-quan-ao" },
      { name: "Két sắt", link: "/ket-sat" },
      { name: "Kệ để hàng", link: "/ke-de-hang" },
      { name: "Quầy lễ tân", link: "/quay-le-tan" },
    ]
  },
  { 
    name: "BÀN GHẾ ĂN", 
    link: "/ban-ghe-an",
    submenu: [
      { name: "Bàn ăn mặt đá", link: "/ban-an-mat-da" },
      { name: "Bàn ăn thông minh", link: "/ban-an-thong-minh" },
      { name: "Bộ bàn ăn 4 ghế", link: "/bo-ban-an-4-ghe" },
      { name: "Bộ bàn ăn 6 ghế", link: "/bo-ban-an-6-ghe" },
      { name: "Ghế ăn", link: "/ghe-an" },
    ]
  },
  {
    name: "BÀN GHẾ CAFE",
    link:"/ban-ghe-cafe",
    // submenu:[
    //   {name: "bàn ghế cafe",link:"/ban-ghe-cafe"}
    // ]
  },
  { 
    name: "SOFA", 
    link: "/sofa",
    submenu: [
      { name: "Bàn sofa", link: "/ban-sofa" },
      { name: "Sofa da", link: "/sofa-da" },
      { name: "Sofa giường", link: "/sofa-giuong" },
      { name: "Sofa nỉ", link: "/sofa-ni" },
      { name: "Sofa văn phòng", link: "/sofa-van-phong" },
      { name: "Sofa văng", link: "/sofa-vang" },
    ]
  },
 
];