import { createClient } from '@supabase/supabase-js'
import type { Database } from '@repo/shared'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 输出详细错误信息（服务端会打印，客户端可能看不到）
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing env vars:', {
    url: supabaseUrl ? 'present' : 'missing',
    key: supabaseAnonKey ? 'present' : 'missing',
    // 在服务端可以打印实际值（谨慎）
  })
  throw new Error(
    `Missing Supabase environment variables. URL: ${supabaseUrl ? '✅' : '❌'}, KEY: ${supabaseAnonKey ? '✅' : '❌'}`
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
