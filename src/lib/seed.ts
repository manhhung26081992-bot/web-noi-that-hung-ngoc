import { supabase } from './supabase';
import { allProducts } from '@/data-m/products';

export const seedDatabase = async () => {
  console.log('Đang bắt đầu đẩy dữ liệu...');

  const { data, error } = await supabase
    .from('products')
    .insert(allProducts); // Supabase hỗ trợ đẩy nguyên một mảng lớn

  if (error) {
    console.error('Lỗi khi đẩy dữ liệu:', error.message);
    return { success: false, error };
  }

  console.log('Đã đẩy thành công toàn bộ sản phẩm lên Supabase!');
  return { success: true, data };
};