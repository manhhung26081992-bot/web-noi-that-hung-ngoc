import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Kiểm tra xem biến môi trường có tồn tại không để tránh lỗi runtime
if (!supabaseUrl || !supabaseKey) {
  console.error("Thiếu cấu hình Supabase trong file .env.local")
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})
