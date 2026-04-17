'use client'
import { seedAllProductsAction } from '@/app/actions'
import { useState } from 'react'

export default function AdminPage() {
  const [loading, setLoading] = useState(false)

  const handleUpdate = async () => {
    setLoading(true)
    const result = await seedAllProductsAction()
    alert(result.message)
    setLoading(false)
  }

  return (
    <div className="p-20">
      <button 
        onClick={handleUpdate}
        disabled={loading}
        className="bg-green-600 text-white p-4 rounded"
      >
        {loading ? 'Đang cập nhật...' : 'Đẩy dữ liệu từ file TS lên Supabase'}
      </button>
    </div>
  )
}
//Gợi ý: Bạn có thể tạo một trang bí mật là src/app/admin/update/page.tsx và dán code này vào để nhấn nút "Cập nhật Database":

