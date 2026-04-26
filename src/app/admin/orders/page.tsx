"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import styles from '@/styles/Admin.module.css';

interface Order {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  order_items: any;
  total_amount: number;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Khắc phục lỗi Hydration: Đợi trang tải xong trên trình duyệt mới render dữ liệu
  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*') 
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Lỗi Supabase:", error.message);
      } else {
        setOrders(data || []);
      }
    } catch (err) {
      console.error("Lỗi hệ thống:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      fetchOrders();
    }
  }, [isClient, fetchOrders]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (!isClient) return null;

  if (loading) return <div style={{padding: '20px', textAlign: 'center'}}>Đang tải dữ liệu đơn hàng...</div>;

  return (
    <main className={styles.adminContainer || ''} style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Quản lý đơn hàng - Hùng Ngọc</h1>
        <button 
          onClick={fetchOrders} 
          style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#0068ff', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Làm mới danh sách
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Ngày đặt</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Khách hàng</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Điện thoại</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Sản phẩm</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Tổng tiền</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>Chưa có đơn hàng nào.</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{formatDate(order.created_at)}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{order.last_name} {order.first_name}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{order.phone_number}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                    {Array.isArray(order.order_items) ? (
                      order.order_items.map((item: any, idx: number) => (
                        <div key={idx}>• {item.name} (x{item.quantity})</div>
                      ))
                    ) : (
                      <span>{order.order_items || 'N/A'}</span>
                    )}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold', color: 'red' }}>
                    {Number(order.total_amount || 0).toLocaleString('vi-VN')}₫
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                    <a 
                      href={`https://zalo.me/${order.phone_number.replace(/\s+/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#0068ff', fontWeight: 'bold', textDecoration: 'none' }}
                    >
                      Chat Zalo
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}