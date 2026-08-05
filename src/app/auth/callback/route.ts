import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/shared/utils/supabase/server'
import { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'

  // Determine correct base URL for redirects (support Cloudflare / proxy headers)
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  const isLocal = process.env.NODE_ENV === 'development'
  const baseUrl = (isLocal || !forwardedHost) ? origin : `${forwardedProto}://${forwardedHost}`

  const supabase = await createClient()

  // 1. PKCE Code Exchange Flow (Supabase sends ?code=...)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`)
    }
    return NextResponse.redirect(`${baseUrl}/auth/auth-code-error?message=${encodeURIComponent(error.message)}`)
  }

  // 2. Email OTP / Magic Link Flow (Supabase sends ?token_hash=...&type=...)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`)
    }
    return NextResponse.redirect(`${baseUrl}/auth/auth-code-error?message=${encodeURIComponent(error.message)}`)
  }

  return NextResponse.redirect(`${baseUrl}/auth/auth-code-error?message=${encodeURIComponent('Thiếu mã xác thực (code hoặc token_hash) trong liên kết')}`)
}
