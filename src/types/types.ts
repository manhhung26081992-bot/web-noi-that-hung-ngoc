// types.ts
export interface Product {
  id: number | string;
  name: string;
  slug: string;
  // Chấp nhận cả 1 chuỗi ảnh hoặc 1 mảng các chuỗi ảnh
  image: string | string[]; 
  // Thuộc tính bổ sung cho slider ảnh
  images?: string[]; 
  realInstallImages?: string[];
   alt?:string;
  // Chấp nhận cả số hoặc chuỗi như "550,000" hoặc "Liên hệ"
  
  price: number | string; 
  category: string;
  description: string;
  specs: {
    material?: string;
    size?: string;
    color?: string;
    warranty?: string;
  };
  detailDescription: string;
  features: string[];
}
export interface CartItem {
  id: string | number;
  name: string;
  price: number|string;
  image: string;
  quantity: number;
  slug: string;
}
export interface ProductSpecs {
  material?: string;
  size?: string;
  color?: string;
  warranty?: string;
}